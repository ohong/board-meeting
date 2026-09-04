import { CATALOG, DEMO_SLUGS, getMember, matchMemberByName, searchCatalog } from "./catalog";
import { EXAMPLE_DECISION, EXAMPLE_QUESTION } from "./example";
import { extractMention } from "./mentions";
import { createMockRuntime } from "./runtime/mock";
import type {
  BoardRuntime,
  CatalogMember,
  ClosingComment,
  ExecutiveReadout,
  GuestStatus,
  MeetingPhase,
  OpeningPosition,
  Phase,
  SeatStatus,
  TranscriptEvent,
} from "./types";

export type SessionOptions = {
  runtime?: BoardRuntime;
  autoContinue?: boolean;
  autoTurnGapMs?: number;
  runtimeDeadlineMs?: number;
  now?: () => number;
  joinDelayMs?: number;
  wait?: (milliseconds: number) => Promise<void>;
};

export type MemberSeat = {
  slug: string;
  name: string;
  role: string;
  initials: string;
  status: SeatStatus;
  spokenCount: number;
};

export type GuestSeat = {
  name: string | null;
  status: GuestStatus;
};

export type MeetingState = {
  phase: Phase;
  meetingPhase: MeetingPhase;
  search: string;
  selected: string[];
  selectionMessage: string | null;
  briefing: string;
  members: MemberSeat[];
  guest: GuestSeat;
  transcript: TranscriptEvent[];
  inProgressPublicMessage: TranscriptEvent | null;
  positions: Record<string, OpeningPosition>;
  mentionQueue: string[];
  composing: boolean;
  readout: ExecutiveReadout | null;
  runtimeId: "mock" | "live";
  setupMessage: string | null;
  lastError: string | null;
};

export type InspectResult = {
  phase: Phase;
  meetingPhase: MeetingPhase;
  briefing: string;
  board: { slug: string; name: string; status: string }[];
  guest: GuestSeat;
  transcript: { speaker: string; text: string }[];
  readoutReady: boolean;
  lastError: string | null;
};

type Listener = () => void;

type ActionResult = { ok: boolean; message?: string };
type ContributionActionResult = ActionResult & {
  contribution?: { speaker: string; text: string };
  guest?: GuestSeat;
  phase?: Phase;
  meetingPhase?: MeetingPhase;
};
type AddressActionResult = ActionResult & {
  addressedMember?: { slug: string; name: string };
  response?: { speaker: string; text: string } | null;
};
type SynthesisActionResult = ActionResult & {
  synthesis?: string;
  phase?: Phase;
  meetingPhase?: MeetingPhase;
};

export const MAX_BRIEFING_CHARACTERS = 6_000;
export const MAX_CHAIR_MESSAGE_CHARACTERS = 2_000;
export const MAX_MODEL_CONTEXT_ENTRIES = 32;
export const MAX_MODEL_CONTEXT_CHARACTERS = 24_000;
export const OMITTED_MODEL_CONTEXT_TEXT =
  "Earlier transcript entries were omitted from this turn's context.";

const MAX_AUTOMATIC_TURNS = 12;
const DEFAULT_RUNTIME_DEADLINE_MS = 30_000;

function waitFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function openingFallback(member: CatalogMember, briefing: string): OpeningPosition {
  return {
    memberId: member.slug,
    recommendation: "No private recommendation was captured after two attempts.",
    reasoning: `The chair's briefing remains the only available basis for ${member.name}'s later contribution: ${briefing.trim()}`,
    concern: "No private concern was captured.",
    question: "No private question was captured.",
  };
}

function boundedWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ").replace(/[.,;:!?]?$/, "")}…`;
}

function boundedEvidence(text: string, maxCharacters = 240): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxCharacters) return normalized;
  const prefix = normalized.slice(0, maxCharacters - 1);
  const boundary = prefix.lastIndexOf(" ");
  return `${prefix.slice(0, boundary > maxCharacters / 2 ? boundary : undefined)}…`;
}

/** Bound repeated model calls without mutating the complete meeting record. */
export function compactTranscriptForModel(transcript: TranscriptEvent[]): TranscriptEvent[] {
  const totalCharacters = transcript.reduce((sum, event) => sum + event.text.length, 0);
  if (
    transcript.length <= MAX_MODEL_CONTEXT_ENTRIES &&
    totalCharacters <= MAX_MODEL_CONTEXT_CHARACTERS
  ) {
    return transcript.map((event) => ({ ...event }));
  }

  const selected: TranscriptEvent[] = [];
  let charactersLeft = MAX_MODEL_CONTEXT_CHARACTERS - OMITTED_MODEL_CONTEXT_TEXT.length;

  for (
    let index = transcript.length - 1;
    index >= 0 && selected.length < MAX_MODEL_CONTEXT_ENTRIES - 1 && charactersLeft > 0;
    index -= 1
  ) {
    const event = transcript[index];
    const text =
      event.text.length > charactersLeft
        ? charactersLeft === 1
          ? "…"
          : `${event.text.slice(0, charactersLeft - 1).trimEnd()}…`
        : event.text;
    selected.push({ ...event, text });
    charactersLeft -= text.length;
  }

  selected.reverse();
  return [
    {
      id: "model-context-omission",
      kind: "system",
      speakerId: "system",
      speakerName: "Secretary",
      text: OMITTED_MODEL_CONTEXT_TEXT,
      createdAt: selected[0]?.createdAt ?? transcript.at(-1)?.createdAt ?? 0,
    },
    ...selected,
  ];
}

function readoutFallback(
  briefing: string,
  transcript: TranscriptEvent[],
  closingComments: ClosingComment[],
): ExecutiveReadout {
  const firstLine = briefing.split("\n").find((line) => line.trim())?.trim() ?? "Decision not stated";
  const decision = firstLine.replace(/^Question:\s*/i, "");
  const dissentPattern = /\b(disagree|disagreement|divided|oppose|opposed|reject)\b/i;
  const hasExplicitDissent =
    transcript.some(
      (event) => event.kind === "reaction" && event.reaction === "disagree",
    ) ||
    transcript.some((event) => event.kind === "message" && dissentPattern.test(event.text)) ||
    closingComments.some(({ comment }) => dissentPattern.test(comment));
  const normalizedClosings = new Set(
    closingComments.map(({ comment }) => comment.replace(/\s+/g, " ").trim().toLowerCase()),
  );
  // Distinct closings are distinct positions unless a semantic evaluator proves otherwise.
  const divided = hasExplicitDissent || normalizedClosings.size > 1;
  const publicStatements = transcript
    .filter((event) => event.kind === "message" && event.speakerId !== "chair" && event.speakerId !== "guest")
    .slice(-3)
    .map((event) => `${event.speakerName}: ${event.text}`);
  const briefingContext = briefing
    .split(/\n+/)
    .map((line) => line.replace(/^Briefing:\s*/i, "").trim())
    .filter((line) => line && !/^Question:/i.test(line));
  const guestStatements = transcript
    .filter(
      (event) =>
        event.kind === "message" &&
        event.speakerId === "guest" &&
        !event.addressedTo,
    )
    .slice(-3)
    .map((event) => `Guest evidence (${event.speakerName}): ${boundedEvidence(event.text)}`);

  return {
    decision,
    recommendation:
      divided
        ? "The board did not reach a single recommendation. Its distinct closing positions are preserved below."
        : closingComments[0]?.comment ?? "No recommendation was captured.",
    divided,
    options: closingComments.map(({ name, comment }) => `${name}: ${comment}`),
    tradeoffs: publicStatements,
    assumptions: [...briefingContext, ...guestStatements],
    openQuestions: transcript
      .filter((event) => event.kind === "message" && event.text.includes("?"))
      .map((event) => event.text)
      .slice(-3),
    nextActions: [],
    closingComments,
  };
}

export function createMeetingSession(options: SessionOptions = {}) {
  const runtime = options.runtime ?? createMockRuntime();
  const autoContinue = options.autoContinue ?? false;
  const autoTurnGapMs = Math.max(0, options.autoTurnGapMs ?? 0);
  const configuredRuntimeDeadlineMs = options.runtimeDeadlineMs ?? DEFAULT_RUNTIME_DEADLINE_MS;
  const runtimeDeadlineMs = Number.isFinite(configuredRuntimeDeadlineMs)
    ? Math.max(0, configuredRuntimeDeadlineMs)
    : DEFAULT_RUNTIME_DEADLINE_MS;
  const now = options.now ?? (() => Date.now());
  const joinDelayMs = options.joinDelayMs ?? 800;
  const wait = options.wait ?? waitFor;
  const listeners = new Set<Listener>();
  let eventSeq = 0;
  let generation = 0;
  let actionTail: Promise<void> = Promise.resolve();
  let automaticTurns = 0;
  let activeAutoPumpGeneration: number | null = null;
  let resumeAutoPumpGeneration: number | null = null;
  let ended = false;
  let speakerCursor = 0;
  const activeRuntimeControllers = new Set<AbortController>();
  const deferredSpeakers = new Set<string>();

  const state: MeetingState = {
    phase: "select",
    meetingPhase: "idle",
    search: "",
    selected: [],
    selectionMessage: null,
    briefing: "",
    members: [],
    guest: { name: null, status: "empty" },
    transcript: [],
    inProgressPublicMessage: null,
    positions: {},
    mentionQueue: [],
    composing: false,
    readout: null,
    runtimeId: runtime.id,
    setupMessage:
      runtime.id === "mock"
        ? "OPENAI_API_KEY is not set. The board is running a deterministic mock so you can test the room, orchestration, and WebMCP. Add OPENAI_API_KEY to enable live OpenAI GPT board members."
        : null,
    lastError: null,
  };

  function emit() {
    for (const fn of listeners) fn();
  }

  function isCurrent(token: number): boolean {
    return token === generation;
  }

  async function runRuntimeAttempt<T>(
    capability: string,
    work: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const controller = new AbortController();
    activeRuntimeControllers.add(controller);
    const deadlineError = new Error(
      `${capability} exceeded its ${runtimeDeadlineMs}ms attempt deadline.`,
    );
    deadlineError.name = "RuntimeDeadlineError";
    const aborted = new Promise<never>((_resolve, reject) => {
      controller.signal.addEventListener(
        "abort",
        () => {
          reject(
            controller.signal.reason instanceof Error
              ? controller.signal.reason
              : new Error(String(controller.signal.reason ?? "Runtime attempt cancelled.")),
          );
        },
        { once: true },
      );
    });
    const timeout = setTimeout(() => controller.abort(deadlineError), runtimeDeadlineMs);
    try {
      return await Promise.race([
        Promise.resolve().then(() => work(controller.signal)),
        aborted,
      ]);
    } finally {
      clearTimeout(timeout);
      activeRuntimeControllers.delete(controller);
    }
  }

  function enqueue<T>(work: (token: number) => Promise<T>, stale: T): Promise<T> {
    const token = generation;
    const run = () => (isCurrent(token) ? work(token) : Promise.resolve(stale));
    const result = actionTail.then(run, run);
    actionTail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  function snapshot(): MeetingState {
    return {
      ...state,
      selected: [...state.selected],
      members: state.members.map((m) => ({ ...m })),
      guest: { ...state.guest },
      transcript: state.transcript.map((event) => ({ ...event })),
      inProgressPublicMessage: state.inProgressPublicMessage
        ? { ...state.inProgressPublicMessage }
        : null,
      positions: Object.fromEntries(
        Object.entries(state.positions).map(([slug, position]) => [slug, { ...position }]),
      ),
      mentionQueue: [...state.mentionQueue],
      readout: state.readout
        ? {
            ...state.readout,
            options: [...state.readout.options],
            tradeoffs: [...state.readout.tradeoffs],
            assumptions: [...state.readout.assumptions],
            openQuestions: [...state.readout.openQuestions],
            nextActions: [...state.readout.nextActions],
            closingComments: state.readout.closingComments.map((comment) => ({ ...comment })),
          }
        : null,
    };
  }

  function addEvent(partial: Omit<TranscriptEvent, "id" | "createdAt">): TranscriptEvent {
    eventSeq += 1;
    const event: TranscriptEvent = { ...partial, id: `evt-${eventSeq}`, createdAt: now() };
    state.transcript = [...state.transcript, event];
    return event;
  }

  function visibleCatalog(): CatalogMember[] {
    return searchCatalog(state.search);
  }

  function toggleMember(slug: string): { ok: boolean; message?: string } {
    if (state.phase !== "select" && state.phase !== "brief") {
      return { ok: false, message: "Board membership is locked for this meeting." };
    }
    const member = getMember(slug);
    if (!member) return { ok: false, message: "Unknown adviser." };
    if (state.selected.includes(slug)) {
      state.selected = state.selected.filter((s) => s !== slug);
      state.selectionMessage = null;
      emit();
      return { ok: true };
    }
    if (state.selected.length >= 6) {
      state.selectionMessage = "The table holds six advisers. Deselect someone before adding a seventh.";
      emit();
      return { ok: false, message: state.selectionMessage };
    }
    state.selected = [...state.selected, slug];
    state.selectionMessage = null;
    emit();
    return { ok: true };
  }

  function useDemoBoard(): ActionResult {
    if (state.phase !== "select" && state.phase !== "brief") {
      return { ok: false, message: "Board membership is locked for this meeting." };
    }
    state.selected = [...DEMO_SLUGS];
    state.search = "";
    state.selectionMessage = null;
    emit();
    return { ok: true };
  }

  function canStart(): boolean {
    return state.selected.length >= 3 && state.selected.length <= 6 && state.briefing.trim().length > 0;
  }

  function mentionedMember(text: string): string | undefined {
    const normalized = text.toLowerCase();
    const candidates = state.selected
      .map((slug) => getMember(slug))
      .filter((member): member is CatalogMember => Boolean(member))
      .flatMap((member) => [member.name, ...member.aliases].map((name) => ({ member, name })))
      .sort((a, b) => b.name.length - a.name.length);
    const direct = candidates.find(({ name }) => {
      const start = normalized.indexOf(`@${name.toLowerCase()}`);
      if (start < 0) return false;
      const next = normalized[start + name.length + 1];
      return next === undefined || /[^a-z0-9]/.test(next);
    });
    return direct?.member.slug ?? extractMention(text, state.selected);
  }

  function setMemberStatus(slug: string, status: SeatStatus) {
    state.members = state.members.map((m) => (m.slug === slug ? { ...m, status } : m));
  }

  function baseInput(slug: string) {
    const member = getMember(slug)!;
    const own = state.transcript
      .filter((e) => e.kind === "message" && e.speakerId === slug)
      .map((e) => e.text);
    return {
      memberId: slug,
      memberName: member.name,
      briefing: state.briefing,
      phase: state.meetingPhase,
      transcript: compactTranscriptForModel(state.transcript),
      privatePosition: state.positions[slug],
      ownPriorStatements: own,
      boardNames: state.members.map((m) => m.name),
    };
  }

  function nextSpeaker(): string | undefined {
    while (state.mentionQueue.length) {
      const mention = state.mentionQueue.shift();
      if (mention && state.members.some((member) => member.slug === mention)) {
        deferredSpeakers.delete(mention);
        return mention;
      }
    }
    const unspoken = state.members.find(
      (member) => member.spokenCount === 0 && !deferredSpeakers.has(member.slug),
    );
    if (unspoken) return unspoken.slug;
    if (state.members.some((member) => member.spokenCount === 0)) deferredSpeakers.clear();
    if (!state.members.length) return undefined;
    const speaker = state.members[speakerCursor % state.members.length];
    speakerCursor = (speakerCursor + 1) % state.members.length;
    return speaker?.slug;
  }

  function latestDirectAnswerRecipient(): string | undefined {
    return [...state.transcript]
      .reverse()
      .find(
        (event) =>
          event.kind === "message" &&
          (event.speakerId === "chair" || event.speakerId === "guest"),
      )?.speakerName;
  }

  async function runTurn(
    token: number,
    slug: string,
    capability: "publicTurn" | "answerDirect",
    prompt?: string,
  ): Promise<TranscriptEvent | null> {
    if (ended || !isCurrent(token)) return null;
    const member = getMember(slug);
    if (!member) return null;
    const directAnswerRecipient =
      capability === "answerDirect" ? latestDirectAnswerRecipient() : undefined;
    setMemberStatus(slug, "speaking");
    emit();
    let firstError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) {
        setMemberStatus(slug, "speaking");
        emit();
      }
      let attemptActive = true;
      try {
        const turn = await runRuntimeAttempt(capability, (signal) =>
          runtime.publicTurn(
            {
              ...baseInput(slug),
              capability,
              prompt,
              addressedTo: directAnswerRecipient,
            },
            {
              signal,
              onStream(update) {
                if (!isCurrent(token) || ended || !attemptActive || signal.aborted) return;
                if (update.type === "reset") {
                  state.inProgressPublicMessage = null;
                } else {
                  const current = state.inProgressPublicMessage;
                  state.inProgressPublicMessage = {
                    id: `in-progress-${token}-${slug}-${attempt}`,
                    kind: "message",
                    speakerId: slug,
                    speakerName: member.name,
                    text: `${current?.text ?? ""}${update.delta}`,
                    addressedTo: directAnswerRecipient,
                    createdAt: current?.createdAt ?? now(),
                  };
                }
                emit();
              },
            },
          ),
        );
        if (!isCurrent(token) || ended) return null;
        state.inProgressPublicMessage = null;
        const seat = state.members.find((m) => m.slug === slug);
        if (seat) seat.spokenCount += 1;
        const response = addEvent({
          kind: "message",
          speakerId: slug,
          speakerName: member.name,
          text: turn.text,
          addressedTo:
            capability === "answerDirect" ? directAnswerRecipient : turn.addressedTo,
        });
        if (turn.reaction) {
          addEvent({
            kind: "reaction",
            speakerId: turn.reactionFrom ?? slug,
            speakerName: getMember(turn.reactionFrom ?? slug)?.name ?? member.name,
            text: turn.reaction,
            reaction: turn.reaction,
          });
        }
        if (turn.wantsToRespond) {
          const target = state.members.find((m) => m.slug === turn.wantsToRespond);
          if (target) {
            setMemberStatus(target.slug, "wants_to_respond");
            state.mentionQueue.unshift(target.slug);
          }
        }
        deferredSpeakers.delete(slug);
        setMemberStatus(slug, "ready");
        emit();
        return response;
      } catch (error) {
        if (!isCurrent(token) || ended) return null;
        state.inProgressPublicMessage = null;
        firstError ??= error;
        if (attempt === 0) {
          setMemberStatus(slug, "reconnecting");
          emit();
        }
      } finally {
        attemptActive = false;
      }
    }
    const detail = firstError instanceof Error ? firstError.message : "runtime request failed";
    state.lastError = `${member.name} could not complete a turn after two attempts: ${detail}`;
    deferredSpeakers.add(slug);
    const privatePosition = state.positions[slug];
    const recoveredText = boundedWords(privatePosition
      ? `Recovered from the private opening after two failed public-turn attempts: ${privatePosition.recommendation} ${privatePosition.reasoning}`
      : "No public statement was captured after two attempts, and no private opening was available to recover.", 90);
    const seat = state.members.find((candidate) => candidate.slug === slug);
    if (seat) seat.spokenCount += 1;
    addEvent({
      kind: "message",
      speakerId: slug,
      speakerName: member.name,
      text: recoveredText,
    });
    setMemberStatus(slug, "ready");
    addEvent({
      kind: "system",
      speakerId: "system",
      speakerName: "Secretary",
      text: `${member.name} could not complete a turn after two attempts. The meeting will continue.`,
    });
    emit();
    return null;
  }

  async function pumpOnceCore(token: number): Promise<boolean> {
    if (ended || state.meetingPhase !== "discussion" || state.composing) return false;
    const slug = nextSpeaker();
    if (!slug) return false;
    await runTurn(token, slug, "publicTurn");
    return isCurrent(token) && !ended;
  }

  async function startMeetingCore(token: number): Promise<ActionResult> {
    if (state.phase !== "brief") {
      return { ok: false, message: "The meeting has already started or is not ready to start." };
    }
    if (!canStart()) {
      return { ok: false, message: "Select three to six advisers and describe the decision." };
    }
    ended = false;
    state.phase = "meeting";
    state.meetingPhase = "opening";
    state.members = state.selected.map((slug) => {
      const m = getMember(slug)!;
      return {
        slug,
        name: m.name,
        role: m.role,
        initials: m.initials,
        status: "thinking" as const,
        spokenCount: 0,
      };
    });
    state.guest = { name: null, status: "waiting" };
    addEvent({
      kind: "system",
      speakerId: "system",
      speakerName: "Secretary",
      text: "Independent views are forming. The table is closed until every seat is ready.",
    });
    emit();
    const openings = await Promise.all(
      state.members.map(async (seat) => {
        const member = getMember(seat.slug)!;
        let failure: unknown;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            const position = await runRuntimeAttempt("formOpeningPosition", (signal) =>
              runtime.formOpeningPosition(
                {
                  ...baseInput(seat.slug),
                  capability: "formOpeningPosition",
                },
                { signal },
              ),
            );
            if (!isCurrent(token)) return null;
            setMemberStatus(seat.slug, "ready");
            emit();
            return { slug: seat.slug, position, failure: null };
          } catch (error) {
            if (!isCurrent(token)) return null;
            failure = error;
            if (attempt === 0) {
              setMemberStatus(seat.slug, "reconnecting");
              emit();
            }
          }
        }
        setMemberStatus(seat.slug, "ready");
        return {
          slug: seat.slug,
          position: openingFallback(member, state.briefing),
          failure: `${member.name} could not form a private position after two attempts: ${failure instanceof Error ? failure.message : "runtime request failed"}`,
        };
      }),
    );
    if (!isCurrent(token)) return { ok: false, message: "Session was reset before opening completed." };
    const completedOpenings = openings.filter((opening) => opening !== null);
    state.positions = Object.fromEntries(
      completedOpenings.map(({ slug, position }) => [slug, position]),
    );
    for (const opening of completedOpenings) {
      if (!opening.failure) continue;
      state.lastError = opening.failure;
      addEvent({
        kind: "system",
        speakerId: "system",
        speakerName: "Secretary",
        text: `${getMember(opening.slug)?.name ?? opening.slug}'s private opening failed twice. A briefing-only fallback was kept so the meeting can continue.`,
      });
    }
    state.meetingPhase = "discussion";
    addEvent({
      kind: "system",
      speakerId: "system",
      speakerName: "Secretary",
      text: "Independent views are closed. The board is in discussion.",
    });
    emit();
    scheduleAutoPump();
    return { ok: true };
  }

  function canAutoPump(token: number): boolean {
    return (
      autoContinue &&
      isCurrent(token) &&
      !ended &&
      state.meetingPhase === "discussion" &&
      !state.composing &&
      automaticTurns < MAX_AUTOMATIC_TURNS
    );
  }

  function scheduleAutoPump() {
    const token = generation;
    if (!canAutoPump(token)) return;
    if (activeAutoPumpGeneration === token) {
      // A composition pause can end between the loop condition and cleanup.
      // Remember the wake-up so that edge does not strand the discussion.
      resumeAutoPumpGeneration = token;
      return;
    }
    void autoPump(token);
  }

  async function autoPump(token: number) {
    if (activeAutoPumpGeneration === token) {
      resumeAutoPumpGeneration = token;
      return;
    }
    activeAutoPumpGeneration = token;
    try {
      while (canAutoPump(token)) {
        if (automaticTurns > 0 && autoTurnGapMs > 0) {
          await wait(autoTurnGapMs);
          if (!canAutoPump(token)) break;
        }
        const did = await enqueue(pumpOnceCore, false);
        if (!did) break;
        if (!isCurrent(token)) break;
        automaticTurns += 1;
      }
    } catch (error) {
      if (isCurrent(token)) {
        state.lastError =
          error instanceof Error ? error.message : "Automatic discussion pacing failed.";
        emit();
      }
    } finally {
      if (activeAutoPumpGeneration === token) activeAutoPumpGeneration = null;
      const resume = resumeAutoPumpGeneration === token;
      if (resume) resumeAutoPumpGeneration = null;
      if (resume && canAutoPump(token)) scheduleAutoPump();
    }
  }

  async function sendUserMessageCore(token: number, text: string): Promise<ActionResult> {
    const trimmed = text.trim();
    if (!trimmed) return { ok: false, message: "Nothing to contribute." };
    if (trimmed.length > MAX_CHAIR_MESSAGE_CHARACTERS) {
      return {
        ok: false,
        message: `Keep chair messages to ${MAX_CHAIR_MESSAGE_CHARACTERS.toLocaleString()} characters.`,
      };
    }
    if (state.phase !== "meeting" || ended) return { ok: false, message: "No active meeting." };
    addEvent({
      kind: "message",
      speakerId: "chair",
      speakerName: "You",
      text: trimmed,
    });
    const mentioned = mentionedMember(trimmed);
    emit();
    if (mentioned) {
      await runTurn(token, mentioned, "answerDirect", trimmed);
    } else if (autoContinue) {
      await pumpOnceCore(token);
    }
    return { ok: true };
  }

  function inspect(): InspectResult {
    return {
      phase: state.phase,
      meetingPhase: state.meetingPhase,
      briefing: state.briefing,
      board: state.members.map((m) => ({ slug: m.slug, name: m.name, status: m.status })),
      guest: { ...state.guest },
      transcript: state.transcript.map((e) => ({ speaker: e.speakerName, text: e.text })),
      readoutReady: Boolean(state.readout),
      lastError: state.lastError,
    };
  }

  function join(name: string): { ok: boolean; message: string } {
    if (state.phase !== "meeting" || ended || state.meetingPhase === "ending") {
      return { ok: false, message: "No active board meeting to join." };
    }
    const display = name.trim();
    if (!display) return { ok: false, message: "Provide the name you know yourself by." };
    if (state.guest.name) {
      return { ok: false, message: `The guest seat is already occupied by ${state.guest.name}.` };
    }
    const token = generation;
    state.guest = { name: display, status: "joining" };
    emit();
    const completeJoin = () => {
      if (!isCurrent(token) || ended || state.phase !== "meeting") return;
      if (state.guest.name !== display || state.guest.status !== "joining") return;
      state.guest = { name: display, status: "joined" };
      addEvent({
        kind: "system",
        speakerId: "system",
        speakerName: "Secretary",
        text: `${display} has taken the guest seat.`,
      });
      emit();
    };
    const admission = (joinDelayMs === 0 ? Promise.resolve() : wait(joinDelayMs)).then(
      () => ({ ok: true as const }),
      (error: unknown) => ({ ok: false as const, error }),
    );
    // Reserve this place in the action chain now, while the admission delay runs in parallel.
    // Guest actions invoked after join therefore cannot overtake admission or the opening.
    void enqueue(async () => {
      const result = await admission;
      if (!isCurrent(token) || state.guest.name !== display) return;
      if (!result.ok) {
        state.lastError =
          result.error instanceof Error ? result.error.message : "The guest could not join.";
        state.guest = { name: null, status: "waiting" };
        emit();
        return;
      }
      completeJoin();
    }, undefined);
    return { ok: true, message: `Joining as ${display}.` };
  }

  function requireGuest(): { ok: false; message: string } | { ok: true; name: string } {
    if (ended || state.phase !== "meeting" || state.meetingPhase === "ending") {
      return { ok: false, message: "The meeting has ended." };
    }
    if (!state.guest.name || state.guest.status !== "joined") {
      return { ok: false, message: "Join the meeting before contributing." };
    }
    return { ok: true, name: state.guest.name };
  }

  async function contributeCore(token: number, text: string): Promise<ContributionActionResult> {
    const guest = requireGuest();
    if (!guest.ok) return guest;
    const trimmed = text.trim();
    if (!trimmed) return { ok: false, message: "Nothing to contribute." };
    state.guest.status = "contributing";
    const contribution = addEvent({
      kind: "message",
      speakerId: "guest",
      speakerName: guest.name,
      text: trimmed,
    });
    emit();
    if (autoContinue && state.meetingPhase === "discussion") await pumpOnceCore(token);
    if (!isCurrent(token)) {
      return { ok: false, message: "Session was reset before the contribution was handled." };
    }
    if (state.guest.name === guest.name && state.guest.status === "contributing") {
      state.guest.status = "joined";
      emit();
    }
    return {
      ok: true,
      message: "Context added to the public transcript.",
      contribution: { speaker: contribution.speakerName, text: contribution.text },
      guest: { ...state.guest },
      phase: state.phase,
      meetingPhase: state.meetingPhase,
    };
  }

  async function addressCore(
    token: number,
    memberName: string,
    text: string,
  ): Promise<AddressActionResult> {
    const guest = requireGuest();
    if (!guest.ok) return guest;
    const member = matchMemberByName(memberName, state.selected);
    if (!member) return { ok: false, message: `No seated adviser named ${memberName}.` };
    const trimmed = text.trim();
    if (!trimmed) return { ok: false, message: "Nothing to ask." };
    state.guest.status = "asking";
    addEvent({
      kind: "message",
      speakerId: "guest",
      speakerName: guest.name,
      text: `@${member.name} ${trimmed}`,
      addressedTo: member.name,
    });
    emit();
    const response = await runTurn(token, member.slug, "answerDirect", trimmed);
    if (!isCurrent(token)) return { ok: false, message: "Session was reset before the answer completed." };
    state.guest.status = "joined";
    emit();
    if (!response) {
      return {
        ok: false,
        message: `${member.name} could not answer after two attempts. The question remains in the public transcript.`,
        addressedMember: { slug: member.slug, name: member.name },
        response: null,
      };
    }
    return {
      ok: true,
      message: `${member.name} was addressed and answered.`,
      addressedMember: { slug: member.slug, name: member.name },
      response: { speaker: response.speakerName, text: response.text },
    };
  }

  async function requestSynthesisCore(token: number): Promise<SynthesisActionResult> {
    const guest = requireGuest();
    if (!guest.ok) return guest;
    let failure: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const text = await runRuntimeAttempt("synthesis", (signal) =>
          runtime.synthesis(
            {
              capability: "synthesis",
              briefing: state.briefing,
              phase: state.meetingPhase,
              transcript: compactTranscriptForModel(state.transcript),
              ownPriorStatements: [],
              boardNames: state.members.map((m) => m.name),
            },
            { signal },
          ),
        );
        if (!isCurrent(token)) return { ok: false, message: "Session was reset before synthesis completed." };
        addEvent({
          kind: "system",
          speakerId: "secretary",
          speakerName: "Secretary",
          text,
        });
        emit();
        return {
          ok: true,
          message: "Interim synthesis delivered.",
          synthesis: text,
          phase: state.phase,
          meetingPhase: state.meetingPhase,
        };
      } catch (error) {
        failure = error;
        if (!isCurrent(token)) return { ok: false, message: "Session was reset before synthesis completed." };
      }
    }
    const message = "Interim synthesis failed twice. The meeting can continue without it.";
    state.lastError = failure instanceof Error ? failure.message : message;
    addEvent({ kind: "system", speakerId: "secretary", speakerName: "Secretary", text: message });
    emit();
    return { ok: false, message };
  }

  function getReadoutTool(): { ready: boolean; message: string; readout?: ExecutiveReadout } {
    if (!state.readout) {
      return {
        ready: false,
        message: "The final readout is not ready. The human chair must end the meeting first.",
      };
    }
    return { ready: true, message: "Readout ready.", readout: state.readout };
  }

  async function endMeetingCore(token: number): Promise<ActionResult> {
    if (state.phase !== "meeting") return { ok: false, message: "No meeting to end." };
    state.meetingPhase = "ending";
    emit();
    for (const seat of state.members.filter((member) => member.spokenCount === 0)) {
      await runTurn(token, seat.slug, "publicTurn");
      if (!isCurrent(token)) return { ok: false, message: "Session was reset before ending completed." };
    }
    ended = true;
    addEvent({
      kind: "system",
      speakerId: "system",
      speakerName: "Secretary",
      text: "The chair has ended the meeting. Closing comments are being collected.",
    });
    emit();
    const closingComments: ClosingComment[] = await Promise.all(
      state.members.map(async (seat) => {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            const comment = await runRuntimeAttempt("closingComment", (signal) =>
              runtime.closingComment(
                {
                  ...baseInput(seat.slug),
                  capability: "closingComment",
                },
                { signal },
              ),
            );
            return { memberId: seat.slug, name: seat.name, comment };
          } catch {
            if (!isCurrent(token)) break;
          }
        }
        const latestPublic = [...state.transcript]
          .reverse()
          .find(
            (event) =>
              event.kind === "message" &&
              event.speakerId === seat.slug &&
              event.text.trim().length > 0 &&
              !/^Recovered from the private opening|^No public statement was captured/i.test(
                event.text,
              ),
          );
        const pos = state.positions[seat.slug];
        return {
          memberId: seat.slug,
          name: seat.name,
          comment:
            latestPublic?.text ?? pos?.recommendation ?? "No closing comment captured.",
        };
      }),
    );
    if (!isCurrent(token)) return { ok: false, message: "Session was reset before ending completed." };
    let readout: ExecutiveReadout | undefined;
    let readoutFailure: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        readout = await runRuntimeAttempt("readout", (signal) =>
          runtime.readout(
            {
              briefing: state.briefing,
              transcript: state.transcript.map((event) => ({ ...event })),
              closingComments: closingComments.map((comment) => ({ ...comment })),
              boardNames: state.members.map((m) => m.name),
            },
            { signal },
          ),
        );
        if (!isCurrent(token)) return { ok: false, message: "Session was reset before readout completed." };
        break;
      } catch (error) {
        readoutFailure = error;
        if (!isCurrent(token)) return { ok: false, message: "Session was reset before readout completed." };
      }
    }
    if (!readout) {
      state.lastError = readoutFailure instanceof Error ? readoutFailure.message : "Readout failed twice.";
      readout = readoutFallback(state.briefing, state.transcript, closingComments);
      addEvent({
        kind: "system",
        speakerId: "system",
        speakerName: "Secretary",
        text: "Final synthesis failed twice. A transcript-based readout was assembled instead.",
      });
    }
    state.readout = readout;
    state.phase = "readout";
    state.meetingPhase = "closed";
    emit();
    return { ok: true };
  }

  function reset() {
    for (const controller of activeRuntimeControllers) {
      controller.abort(new Error("The board meeting was reset."));
    }
    activeRuntimeControllers.clear();
    generation += 1;
    actionTail = Promise.resolve();
    ended = true;
    automaticTurns = 0;
    activeAutoPumpGeneration = null;
    resumeAutoPumpGeneration = null;
    state.phase = "select";
    state.meetingPhase = "idle";
    state.search = "";
    state.selected = [];
    state.selectionMessage = null;
    state.briefing = "";
    state.members = [];
    state.guest = { name: null, status: "empty" };
    state.transcript = [];
    state.inProgressPublicMessage = null;
    state.positions = {};
    state.mentionQueue = [];
    state.composing = false;
    state.readout = null;
    state.lastError = null;
    eventSeq = 0;
    speakerCursor = 0;
    deferredSpeakers.clear();
    emit();
  }

  return {
    getState: snapshot,
    subscribe(fn: Listener) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    setSearch(query: string) {
      state.search = query;
      emit();
    },
    visibleCatalog,
    catalog: CATALOG,
    toggleMember,
    useDemoBoard,
    goToBrief() {
      if (state.selected.length < 3) {
        state.selectionMessage = "Choose at least three advisers.";
        emit();
        return { ok: false as const, message: state.selectionMessage };
      }
      state.phase = "brief";
      emit();
      return { ok: true as const };
    },
    setBriefing(text: string) {
      state.briefing = text.slice(0, MAX_BRIEFING_CHARACTERS);
      emit();
    },
    useExampleDecision() {
      state.briefing = EXAMPLE_DECISION;
      emit();
    },
    canStart,
    startMeeting: () =>
      enqueue(startMeetingCore, { ok: false, message: "Session was reset before starting completed." }),
    sendUserMessage: (text: string) =>
      enqueue(
        (token) => sendUserMessageCore(token, text),
        { ok: false, message: "Session was reset before the message was handled." },
      ),
    setComposing(value: boolean) {
      const wasComposing = state.composing;
      state.composing = value;
      emit();
      if (wasComposing && !value) scheduleAutoPump();
    },
    pumpOnce: () => enqueue(pumpOnceCore, false),
    pumpDiscussion: async (n: number) => {
      for (let i = 0; i < n; i += 1) {
        const did = await enqueue(pumpOnceCore, false);
        if (!did) break;
      }
    },
    endMeeting: () =>
      enqueue(endMeetingCore, { ok: false, message: "Session was reset before ending completed." }),
    inspect,
    join,
    contribute: (text: string) =>
      enqueue(
        (token) => contributeCore(token, text),
        { ok: false, message: "Session was reset before the contribution was handled." },
      ),
    address: (memberName: string, text: string) =>
      enqueue(
        (token) => addressCore(token, memberName, text),
        { ok: false, message: "Session was reset before the question was handled." },
      ),
    requestSynthesis: () =>
      enqueue(requestSynthesisCore, {
        ok: false,
        message: "Session was reset before synthesis was handled.",
      }),
    getReadout: getReadoutTool,
    guestEndMeeting() {
      return {
        ok: false as const,
        message: "Only the human chair can end the meeting.",
      };
    },
    reset,
    exampleQuestion: EXAMPLE_QUESTION,
  };
}

export type MeetingSession = ReturnType<typeof createMeetingSession>;
