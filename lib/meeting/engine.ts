/**
 * Meeting orchestration engine — OWNED BY THE ORCHESTRATION WORKSTREAM.
 *
 * Drives the async meeting loop (opening positions, turns, reactions, queue,
 * closing, readout) through MeetingSession's engine mutators using a BoardRuntime.
 *
 */
import type { MeetingSession } from "./session";
import { MIN_BOARD_SIZE, type BoardRuntime, type ClosingComment, type MemberContext, type MemberParticipant, type QueuedInput, type ReactInput, type ReactResult, type Readout, type ReadoutInput, type TranscriptLine, type TurnDirective } from "./types";

export interface MeetingEngine {
  dispose(): void;
}

/**
 * Autonomous discussion is intentionally a bounded burst. The room remains in the
 * discussion phase after a natural pause; chair or WebMCP input wakes it again.
 */
const INITIAL_AUTOMATIC_TURNS = 10;
const FOLLOW_UP_AUTOMATIC_TURNS = 3;
const MIN_TURNS_BEFORE_LOW_URGENCY_PAUSE = 8;
const MIN_URGENCY_TO_CONTINUE = 4;

/** Keep repeated model calls bounded while retaining the complete on-screen record. */
export const MAX_MODEL_CONTEXT_LINES = 32;
export const MAX_MODEL_CONTEXT_CHARACTERS = 24_000;
const MAX_MODEL_CONTEXT_LINE_CHARACTERS = 2_000;
const OMITTED_CONTEXT_TEXT = "Earlier transcript entries were omitted from this turn's context.";

export function compactTranscriptForModel(lines: TranscriptLine[]): TranscriptLine[] {
  if (!lines.length) return [];

  const selected: TranscriptLine[] = [];
  let charactersLeft = MAX_MODEL_CONTEXT_CHARACTERS - OMITTED_CONTEXT_TEXT.length;
  let earliestIncluded = lines.length;

  for (
    let index = lines.length - 1;
    index >= 0 && selected.length < MAX_MODEL_CONTEXT_LINES - 1 && charactersLeft > 0;
    index -= 1
  ) {
    const line = lines[index];
    const cap = Math.min(MAX_MODEL_CONTEXT_LINE_CHARACTERS, charactersLeft);
    const text =
      line.text.length > cap
        ? `${line.text.slice(0, Math.max(1, cap - 1)).trimEnd()}…`
        : line.text;
    selected.push({ ...line, text });
    charactersLeft -= text.length;
    earliestIncluded = index;
  }

  selected.reverse();
  if (earliestIncluded > 0) {
    selected.unshift({
      speakerId: "system",
      speakerName: "System",
      role: "system",
      text: OMITTED_CONTEXT_TEXT,
      addressedName: null,
    });
  }
  return selected;
}

export function createEngine(session: MeetingSession, runtime: BoardRuntime): MeetingEngine {
  let disposed = false;
  let generation = new AbortController();
  let streamController: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let working = false;
  let activeTurn: Promise<void> | null = null;
  let lastSpeaker: string | null = null;
  let roundRobin = -1;
  let deterministicFallback = false;
  let justUnavailable: string | null = null;
  let automaticTurnsRemaining = 0;
  let pausedForChair = false;
  const rebutters = new Set<string>();
  const pacingScale = Math.max(0, (runtime as BoardRuntime & { pacingScale?: number }).pacingScale ?? 1);

  const unsubscribe = session.on((event) => {
    if (disposed) return;
    if (event.type === "start") void start();
    else if (event.type === "resume") {
      if (session.getState().phase === "forming") void start();
      else if (session.getState().phase === "discussion") {
        automaticTurnsRemaining = Math.max(automaticTurnsRemaining, FOLLOW_UP_AUTOMATIC_TURNS);
        pausedForChair = false;
        kick(0);
      } else if (session.getState().phase === "closing") void end();
    }
    else if (event.type === "input") {
      if (event.input.kind !== "synthesis-request") {
        automaticTurnsRemaining = Math.max(automaticTurnsRemaining, FOLLOW_UP_AUTOMATIC_TURNS);
        pausedForChair = false;
      }
      kick(0);
    }
    else if (event.type === "compose" && !event.composing) kick(0);
    else if (event.type === "end") void end();
    else if (event.type === "retry") {
      automaticTurnsRemaining = Math.max(automaticTurnsRemaining, 1);
      pausedForChair = false;
      if (session.getState().phase === "discussion") void runTurn(event.memberId, { type: "continue" }, [], false);
    }
    else if (event.type === "reset") abortAll();
  });

  function abortAll() {
    generation.abort(); streamController?.abort(); streamController = null;
    if (timer) clearTimeout(timer); timer = null; working = false; activeTurn = null;
    generation = new AbortController(); rebutters.clear(); lastSpeaker = null; roundRobin = -1; deterministicFallback = false; justUnavailable = null; automaticTurnsRemaining = 0; pausedForChair = false;
  }

  async function start() {
    abortAll();
    automaticTurnsRemaining = INITIAL_AUTOMATIC_TURNS;
    const signal = generation.signal; const members = session.members(); let settled = 0; let transitioned = false;
    const transition = () => {
      if (transitioned || signal.aborted || session.getState().phase !== "forming") return;
      const ready = session.members().filter((m) => m.position).length;
      if (settled === members.length || ready >= MIN_BOARD_SIZE && Date.now() - (session.getState().startedAt ?? Date.now()) >= 25_000) {
        transitioned = true; session.engineSetPhase("discussion");
        session.engineAddEvent("positions-ready", ready === members.length ? "All independent positions are ready. Open discussion." : `${ready} independent positions are ready. Discussion begins while unavailable members may rejoin.`);
        kick(0);
      }
    };
    const hardTimeout = setTimeout(transition, 25_000);
    await Promise.all(members.map(async (member) => {
      for (let attempt = 0; attempt < 2 && !signal.aborted; attempt += 1) {
        try {
          if (attempt) session.engineSetMember(member.id, { status: "retrying", retries: member.retries + 1 });
          const position = await runtime.openingPosition(contextFor(member.id), signal);
          if (!signal.aborted) session.engineSetPosition(member.id, position);
          break;
        } catch (error) {
          if (signal.aborted) break;
          if (attempt === 1) session.engineSetMember(member.id, { status: "failed", lastError: errorMessage(error), retries: member.retries + 1 });
        }
      }
      settled += 1; transition();
    }));
    clearTimeout(hardTimeout); transition();
  }

  function kick(delay: number) {
    if (disposed || session.getState().phase !== "discussion") return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; void step(); }, delay);
  }

  async function step() {
    if (disposed || working || session.getState().phase !== "discussion") return;
    if (session.getState().streamingEntryId) { kick(100); return; }
    const state = session.getState();
    if (state.chairComposing) return;
    working = true;
    try {
      const queued = state.queue[0];
      if (queued?.kind === "synthesis-request") { await runSynthesis(queued); return; }
      let memberId: string | null = null; let directive: TurnDirective = { type: "continue" }; let context: string[] = []; let interruption = false;
      if (queued) {
        const text = entryText(queued.entryId); context = text ? [text] : [];
        if (queued.mention) {
          const from = queued.kind === "guest-address" ? { id: "guest", name: state.guest?.name ?? "Guest" } : { id: "chair", name: "You" };
          memberId = queued.mention; directive = { type: "answer", fromId: from.id, fromName: from.name, question: text };
        } else memberId = chooseSpeaker(true);
        session.engineDequeue(queued.id);
        if (queued.kind.startsWith("guest-")) session.setGuestStatus("joined");
      } else {
        const mustCompleteFirstRound = availableMembers().some((m) => m.turns === 0);
        if (automaticTurnsRemaining <= 0 && !mustCompleteFirstRound) {
          pauseForChair();
          return;
        }
        memberId = chooseSpeaker(false);
        if (memberId && rebutters.has(memberId) && lastSpeaker) {
          const target = session.member(lastSpeaker); if (target) { directive = { type: "rebut", targetId: target.id, targetName: target.persona.name }; interruption = true; rebutters.delete(memberId); }
        } else if (memberId && (session.member(memberId)?.turns ?? 0) === 0) directive = { type: "open" };
      }
      if (memberId) await runTurn(memberId, directive, context, interruption);
      else pauseForChair();
    } finally { working = false; }
  }

  function availableMembers(): MemberParticipant[] {
    return session.members().filter((m) => m.status !== "failed" && m.status !== "retrying" && m.status !== "forming");
  }

  function pauseForChair() {
    if (pausedForChair || session.getState().phase !== "discussion") return;
    pausedForChair = true;
    session.engineClearReactions();
    session.engineAddEvent("notice", "The board has reached a natural pause and is waiting for the chair.");
  }

  function chooseSpeaker(forceContinuation: boolean): string | null {
    const members = availableMembers(); if (!members.length) return null;
    const someUnspoken = members.some((m) => m.turns === 0);
    let eligible = members.filter((m) => !someUnspoken || m.turns < 2);
    if (!eligible.length) eligible = members;
    if (justUnavailable && eligible.length > 1) eligible = eligible.filter((m) => m.id !== justUnavailable);
    // Nobody takes two consecutive turns unless directly called on.
    if (lastSpeaker && eligible.length > 1) eligible = eligible.filter((m) => m.id !== lastSpeaker);
    if (deterministicFallback) {
      deterministicFallback = false;
      const unspoken = eligible.filter((m) => m.turns === 0).sort(seatSort)[0];
      if (unspoken) return unspoken.id;
      for (let offset = 1; offset <= members.length; offset += 1) { const index = (roundRobin + offset) % members.length; const found = eligible.find((m) => m.id === members[index].id); if (found) { roundRobin = index; return found.id; } }
    }
    const rebut = eligible.filter((m) => rebutters.has(m.id)).sort(seatSort)[0]; if (rebut) return rebut.id;
    const unspoken = eligible.filter((m) => m.turns === 0);
    if (unspoken.length) return unspoken.sort(seatSort)[0].id;
    const urgency = [...eligible].sort((a, b) => b.urgency - a.urgency || a.seat - b.seat);
    const totalTurns = session.members().reduce((sum, member) => sum + member.turns, 0);
    if (!forceContinuation && totalTurns >= MIN_TURNS_BEFORE_LOW_URGENCY_PAUSE && (urgency[0]?.urgency ?? 0) < MIN_URGENCY_TO_CONTINUE) return null;
    if (urgency[0]?.urgency > 0) return urgency[0].id;
    for (let offset = 1; offset <= members.length; offset += 1) { const index = (roundRobin + offset) % members.length; const found = eligible.find((m) => m.id === members[index].id); if (found) { roundRobin = index; return found.id; } }
    return eligible[0]?.id ?? null;
  }

  async function runTurn(memberId: string, directive: TurnDirective, newContext: string[], interruption: boolean) {
    if (activeTurn || session.getState().phase !== "discussion") { kick(50); return; }
    const task = executeTurn(memberId, directive, newContext, interruption); activeTurn = task;
    try { await task; } finally { activeTurn = null; }
  }

  async function executeTurn(memberId: string, directive: TurnDirective, newContext: string[], interruption: boolean) {
    const member = session.member(memberId); if (!member) return;
    automaticTurnsRemaining = Math.max(0, automaticTurnsRemaining - 1);
    const addressed = directive.type === "answer" ? { id: directive.fromId, name: directive.fromName, intent: "answer" as const } : directive.type === "rebut" ? { id: directive.targetId, name: directive.targetName, intent: "rebuttal" as const } : { id: "board", name: null, intent: "statement" as const };
    const entry = session.engineBeginMessage(memberId, { addressedTo: addressed.id, addressedName: addressed.name, intent: addressed.intent, interruption });
    let succeeded = false;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      streamController = linkedController(generation.signal);
      try {
        if (attempt) { session.engineAddEvent("member-retrying", `${member.persona.shortName} is reconnecting.`); session.engineSetMember(memberId, { status: "retrying", retries: (session.member(memberId)?.retries ?? 0) + 1 }); session.engineSetText(entry.id, ""); }
        const result = await runtime.turn({ ...contextFor(memberId), directive, newContext }, streamController.signal, (delta) => session.engineAppendDelta(entry.id, delta));
        if (session.getState().phase !== "discussion") throw new DOMException("Meeting ended", "AbortError");
        session.engineEndMessage(entry.id, { positionUpdate: result.meta.positionUpdate }); succeeded = true; lastSpeaker = memberId; if (justUnavailable !== memberId) justUnavailable = null; break;
      } catch (error) {
        if (generation.signal.aborted || session.getState().phase !== "discussion") break;
        session.engineSetMember(memberId, { lastError: errorMessage(error) });
      } finally { streamController = null; }
    }
    if (!succeeded) {
      session.engineEndMessage(entry.id, { failed: true });
      if (session.getState().phase === "discussion") { justUnavailable = memberId; session.engineSetMember(memberId, { status: "failed" }); session.engineAddEvent("member-unavailable", `${member.persona.shortName} is temporarily unavailable and may be retried.`); }
    }
    if (session.getState().phase !== "discussion") return;
    const hasDirect = session.getState().queue.some((q) => !!q.mention);
    if (!hasDirect && succeeded) await reactionsAfter(memberId, entry.id);
    const delay = session.getState().queue.length ? 0 : (session.members().reduce((sum, m) => sum + m.turns, 0) >= 12 ? 2_000 : 700) * pacingScale;
    kick(delay);
  }

  async function reactionsAfter(speakerId: string, entryId: string) {
    const speaker = session.member(speakerId); const text = entryText(entryId); if (!speaker || !text) return;
    const others = session.members().filter((m) => m.id !== speakerId && (m.status === "ready" || m.status === "reacting" || m.status === "wants-to-respond"));
    const inputs: ReactInput[] = others.map((m) => ({ ...contextFor(m.id), lastSpeakerId: speakerId, lastSpeakerName: speaker.persona.name, lastText: text }));
    try {
      const batch = runtime as BoardRuntime & { reactMany?: (inputs: ReactInput[], signal: AbortSignal) => Promise<ReactResult[]> };
      const results = batch.reactMany ? await batch.reactMany(inputs, generation.signal) : await Promise.all(inputs.map((input) => runtime.react(input, generation.signal)));
      results.forEach((result, index) => { const member = others[index]; if (!member) return; session.engineSetReaction(member.id, result.reaction ? { kind: result.reaction, toId: speakerId, at: Date.now() } : null, result.urgency); if (result.wantsToRebut) rebutters.add(member.id); });
    } catch { deterministicFallback = true; }
  }

  async function runSynthesis(input: QueuedInput) {
    session.engineDequeue(input.id); const entryId = input.entryId; if (!entryId) return;
    try { await runtime.synthesis({ briefing: session.getState().briefing, transcript: compactTranscriptForModel(session.transcriptLines()), requestedByName: session.getState().guest?.name ?? "You" }, generation.signal, (delta) => session.engineAppendDelta(entryId, delta)); session.engineEndSynthesis(entryId); }
    catch { session.engineEndSynthesis(entryId, { failed: true, text: entryText(entryId) || "Synthesis is temporarily unavailable." }); }
    if (session.getState().guest) session.setGuestStatus("joined"); kick(0);
  }

  async function end() {
    if (timer) clearTimeout(timer); timer = null; streamController?.abort();
    const endedAt = session.getState().endedAt;
    if (activeTurn) await activeTurn.catch(() => {});
    // A reset (or a second end) during that wait invalidates this run.
    if (disposed || session.getState().phase !== "closing" || session.getState().endedAt !== endedAt) return;
    generation.abort(); generation = new AbortController(); const signal = generation.signal;
    const members = session.members();
    const comments = await Promise.all(members.map(async (member): Promise<ClosingComment> => {
      try { const text = await withTimeout((child) => runtime.closingComment(contextFor(member.id), child), 8_000, signal); if (!text.trim()) throw new Error("Empty closing comment"); return { memberId: member.id, memberName: member.persona.name, text: text.trim(), fallback: false }; }
      catch { return { memberId: member.id, memberName: member.persona.name, text: lastStatement(member.id) || member.positionUpdate || member.position?.recommendation || "No closing comment was available.", fallback: true }; }
    }));
    if (signal.aborted || disposed) return; session.engineSetClosingComments(comments);
    const input = { briefing: session.getState().briefing, transcript: compactTranscriptForModel(session.transcriptLines()), members: members.map((m) => ({ id: m.id, name: m.persona.name, role: m.persona.role })), closingComments: comments, guestName: session.getState().guest?.name ?? null };
    let readout: Readout | null = null;
    for (let attempt = 0; attempt < 2 && !signal.aborted; attempt += 1) { try { readout = await runtime.readout(input, signal); break; } catch {} }
    if (!readout) readout = fallbackReadout(input);
    if (!signal.aborted && !disposed && session.getState().phase === "closing" && session.getState().endedAt === endedAt) { session.engineSetReadout(readout, "ready"); session.engineAddEvent("meeting-ended", "The meeting ended and the executive readout is ready."); }
  }

  function contextFor(memberId: string): MemberContext {
    const state = session.getState(); const member = session.member(memberId); if (!member) throw new Error(`Unknown member ${memberId}`);
    return { slug: member.id, briefing: state.briefing, phase: state.phase, transcript: compactTranscriptForModel(session.transcriptLines()), position: member.position, ownStatements: state.transcript.filter((e) => e.kind === "message" && e.speakerId === memberId && !e.failed).map((e) => e.kind === "message" ? e.text : "").slice(-8), participants: [{ id: "chair", name: "You", role: "chair", line: "Human chair" }, ...session.members().filter((m) => m.id !== memberId).map((m) => ({ id: m.id, name: m.persona.name, role: "member" as const, line: m.persona.role })), ...(state.guest ? [{ id: "guest", name: state.guest.name, role: "guest" as const, line: "External personal agent" }] : [])] };
  }

  function entryText(id: string | null): string { const e = id ? session.getState().transcript.find((x) => x.id === id) : null; return e && (e.kind === "message" || e.kind === "synthesis") ? e.text : ""; }
  function lastStatement(id: string): string { return [...session.getState().transcript].reverse().find((e) => e.kind === "message" && e.speakerId === id && e.text.trim())?.kind === "message" ? ([...session.getState().transcript].reverse().find((e) => e.kind === "message" && e.speakerId === id && e.text.trim()) as { text: string }).text : ""; }

  return { dispose() {
    disposed = true; unsubscribe(); abortAll();
    const state = session.getState();
    if (state.streamingEntryId) session.engineEndMessage(state.streamingEntryId, { failed: true });
    for (const entry of state.transcript) if (entry.kind === "synthesis" && entry.streaming) session.engineEndSynthesis(entry.id, { failed: true, text: entry.text || "Synthesis was cancelled." });
  } };
}

function seatSort(a: MemberParticipant, b: MemberParticipant) { return a.seat - b.seat; }
function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Request failed"; }
function linkedController(parent: AbortSignal): AbortController { const child = new AbortController(); if (parent.aborted) child.abort(parent.reason); else parent.addEventListener("abort", () => child.abort(parent.reason), { once: true }); return child; }
async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number, parent: AbortSignal): Promise<T> { const child = linkedController(parent); const timer = setTimeout(() => child.abort(new Error("Timed out")), ms); try { return await fn(child.signal); } finally { clearTimeout(timer); } }
function fallbackReadout(input: ReadoutInput): Readout {
  const statements = input.transcript.filter((line) => line.role === "member" && line.text.trim()).slice(-3).map((line) => `${line.speakerName}: ${line.text}`);
  return { decision: input.briefing.split("\n")[0] || "Decision under discussion", recommendation: { summary: input.closingComments.map((c) => c.text).join(" ") || statements.at(-1) || "Review the discussion before deciding.", divided: true, detail: "The secretary was unavailable, so this fallback preserves the public discussion and closing positions without claiming consensus." }, options: statements.length ? statements : ["Proceed", "Run a bounded test", "Maintain the status quo"], tradeoffs: ["Speed and simplicity versus learning and optionality"], assumptions: ["The briefing and public transcript contain the material evidence"], openQuestions: ["Which unresolved assumption most changes the decision?"], nextActions: ["Validate the key assumption", "Assign an owner and review date"], closingComments: input.closingComments, generatedAt: Date.now(), fallback: true };
}
