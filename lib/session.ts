import { CATALOG, getMember, matchMemberByName, searchCatalog } from "./catalog";
import { EXAMPLE_DECISION, EXAMPLE_QUESTION, invitationPrompt } from "./example";
import { extractMention } from "./mentions";
import { createMockRuntime } from "./runtime/mock";
import { decisionLine, fallbackReadout } from "./runtime/fallbacks";
import type {
  BoardRuntime,
  CatalogMember,
  ClosingComment,
  ExecutiveReadout,
  GuestStatus,
  MeetingPhase,
  OpeningPosition,
  Phase,
  ReactionKind,
  SeatStatus,
  TranscriptEvent,
} from "./types";

export const MIN_BOARD = 3;
export const MAX_BOARD = 6;

/**
 * How many board contributions the room produces on its own before it stops and waits for
 * the chair. The human stays in control: any contribution from the chair or the guest
 * agent wakes the room back up.
 */
const AUTO_TURN_BUDGET = 12;

export type SessionOptions = {
  runtime?: BoardRuntime;
  /** Whether the room keeps talking on its own. Off in tests so turns can be stepped. */
  autoContinue?: boolean;
  now?: () => number;
  /** Beat between turns, so the room reads as a conversation rather than a dump. */
  turnGapMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

export type MemberSeat = {
  slug: string;
  name: string;
  role: string;
  house: string;
  initials: string;
  status: SeatStatus;
  spokenCount: number;
  /** The last reaction this member emitted, cleared once they speak again. */
  reaction?: ReactionKind;
};

export type GuestSeat = {
  name: string | null;
  status: GuestStatus;
};

export type AgentActivity = {
  id: string;
  label: string;
  at: number;
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
  /** Private to each member; never rendered and never sent to another member. */
  positions: Record<string, OpeningPosition>;
  composing: boolean;
  /** True once the room has used its turn budget and is waiting on the chair. */
  awaitingChair: boolean;
  readout: ExecutiveReadout | null;
  setupMessage: string | null;
  lastError: string | null;
  /** What the external agent has done, so its participation is visible without devtools. */
  agentActivity: AgentActivity[];
  readoutRetrievedBy: string | null;
};

export type InspectResult = {
  phase: Phase;
  meetingPhase: MeetingPhase;
  chair: string;
  briefing: string;
  board: { name: string; role: string; status: SeatStatus; contributions: number }[];
  guest: { name: string | null; status: GuestStatus };
  transcript: { speaker: string; to?: string; text: string }[];
  readoutReady: boolean;
};

export type ActionResult = { ok: boolean; message: string };

type Listener = () => void;

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export function createMeetingSession(options: SessionOptions = {}) {
  const runtime = options.runtime ?? createMockRuntime();
  const autoContinue = options.autoContinue ?? false;
  const now = options.now ?? (() => Date.now());
  const turnGapMs = options.turnGapMs ?? 0;
  const sleep = options.sleep ?? defaultSleep;
  const listeners = new Set<Listener>();

  /** Only one public message may stream at a time; every mutation queues behind this. */
  let activeTurn: Promise<unknown> | null = null;
  let pumping = false;
  let ended = false;
  let autoTurnsUsed = 0;
  /** Members with next-turn priority: direct @mentions first, then requests for the floor. */
  let mentionQueue: string[] = [];
  let floorQueue: string[] = [];
  let lastSpeaker: string | null = null;
  /** Members who said they had nothing to add. Cleared when new context enters the room. */
  let passed = new Set<string>();

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
    positions: {},
    composing: false,
    awaitingChair: false,
    readout: null,
    setupMessage: null,
    lastError: null,
    agentActivity: [],
    readoutRetrievedBy: null,
  };

  function emit() {
    for (const listener of listeners) listener();
  }

  function snapshot(): MeetingState {
    return {
      ...state,
      selected: [...state.selected],
      members: state.members.map((member) => ({ ...member })),
      guest: { ...state.guest },
      transcript: state.transcript.map((event) => ({ ...event })),
      positions: { ...state.positions },
      agentActivity: [...state.agentActivity],
    };
  }

  function addEvent(partial: Omit<TranscriptEvent, "id" | "createdAt">): TranscriptEvent {
    const event: TranscriptEvent = { ...partial, id: uid("evt"), createdAt: now() };
    state.transcript = [...state.transcript, event];
    return event;
  }

  function updateEvent(id: string, patch: Partial<TranscriptEvent>) {
    state.transcript = state.transcript.map((event) =>
      event.id === id ? { ...event, ...patch } : event,
    );
  }

  function dropEvent(id: string) {
    state.transcript = state.transcript.filter((event) => event.id !== id);
  }

  function systemEvent(text: string) {
    return addEvent({ kind: "system", speakerId: "system", speakerName: "Secretary", text });
  }

  function noteAgentActivity(label: string) {
    state.agentActivity = [...state.agentActivity, { id: uid("act"), label, at: now() }].slice(-8);
  }

  function setStatus(slug: string, status: SeatStatus, reaction?: ReactionKind) {
    state.members = state.members.map((member) =>
      member.slug === slug ? { ...member, status, ...(reaction !== undefined ? { reaction } : {}) } : member,
    );
  }

  function seat(slug: string): MemberSeat | undefined {
    return state.members.find((member) => member.slug === slug);
  }

  // ---------------------------------------------------------------- selection

  function toggleMember(slug: string): ActionResult {
    if (state.phase !== "select" && state.phase !== "brief") {
      return { ok: false, message: "Board membership is locked for this meeting." };
    }
    const member = getMember(slug);
    if (!member) return { ok: false, message: "No such adviser on the roster." };

    if (state.selected.includes(slug)) {
      state.selected = state.selected.filter((s) => s !== slug);
      state.selectionMessage = null;
      emit();
      return { ok: true, message: `${member.name} left the table.` };
    }
    if (state.selected.length >= MAX_BOARD) {
      state.selectionMessage = `The table seats ${MAX_BOARD}. Free a seat before adding another adviser.`;
      emit();
      return { ok: false, message: state.selectionMessage };
    }
    state.selected = [...state.selected, slug];
    state.selectionMessage = null;
    emit();
    return { ok: true, message: `${member.name} is seated.` };
  }

  function canStart(): boolean {
    return (
      state.selected.length >= MIN_BOARD &&
      state.selected.length <= MAX_BOARD &&
      state.briefing.trim().length > 0
    );
  }

  // ------------------------------------------------------------ agent inputs

  function baseInput(slug: string) {
    const member = getMember(slug)!;
    return {
      memberId: slug,
      memberName: member.name,
      briefing: state.briefing,
      phase: state.meetingPhase,
      // The public record only. A member never sees another member's private position.
      transcript: state.transcript.filter((event) => !event.streaming && !event.failed),
      privatePosition: state.positions[slug],
      ownPriorStatements: state.transcript
        .filter((event) => event.kind === "message" && event.speakerId === slug && !event.failed)
        .map((event) => event.text),
      boardNames: state.members.map((member) => member.name),
    };
  }

  /** Runs `attempt` twice at most, showing a quiet reconnecting state in between. */
  async function withRetry<T>(slug: string | null, attempt: () => Promise<T>): Promise<T | null> {
    try {
      return await attempt();
    } catch {
      if (slug) {
        setStatus(slug, "reconnecting");
        emit();
      }
      try {
        return await attempt();
      } catch (error) {
        state.lastError = error instanceof Error ? error.message : "A board agent call failed.";
        return null;
      }
    }
  }

  // ------------------------------------------------------- speaker selection

  /**
   * Deterministic. Direct mentions win, then a member another member asked to hear from,
   * then anyone who has not spoken, then the least-heard voice. Nobody takes a third turn
   * until every seat has spoken once, unless the chair or the guest called on them.
   */
  function nextSpeaker(): string | undefined {
    while (mentionQueue.length) {
      const slug = mentionQueue.shift()!;
      if (seat(slug)) return slug;
    }

    const everyoneSpoke = state.members.every((member) => member.spokenCount >= 1);
    const eligible = state.members.filter(
      (member) => (everyoneSpoke || member.spokenCount < 2) && !passed.has(member.slug),
    );
    if (!eligible.length) return undefined;

    // A member can pull someone into the conversation, but not hand the room to one voice.
    const quietest = Math.min(...state.members.map((member) => member.spokenCount));
    while (floorQueue.length) {
      const slug = floorQueue.shift()!;
      const candidate = eligible.find((member) => member.slug === slug);
      if (candidate && slug !== lastSpeaker && candidate.spokenCount <= quietest + 1) return slug;
    }

    const unspoken = eligible.filter((member) => member.spokenCount === 0);
    if (unspoken.length) return unspoken[0].slug;

    const pool = eligible.filter((member) => member.slug !== lastSpeaker);
    const candidates = pool.length ? pool : eligible;
    return [...candidates].sort((a, b) => a.spokenCount - b.spokenCount)[0]?.slug;
  }

  // -------------------------------------------------------------------- turns

  async function speak(
    slug: string,
    capability: "publicTurn" | "answerDirect",
    prompt?: string,
    askedBy?: string,
  ): Promise<boolean> {
    const member = getMember(slug);
    if (!member || ended) return false;

    setStatus(slug, "speaking", undefined);
    emit();

    const run = async (): Promise<boolean> => {
      const live = addEvent({
        kind: "message",
        speakerId: slug,
        speakerName: member.name,
        text: "",
        streaming: true,
      });
      emit();

      let streamed = "";
      try {
        const turn = await runtime.publicTurn(
          { ...baseInput(slug), capability, prompt, addressedTo: askedBy },
          (delta) => {
            streamed += delta;
            updateEvent(live.id, { text: streamed });
            emit();
          },
        );

        // An empty turn means the member had nothing to add. Nothing goes on the record.
        if (!turn.text.trim()) {
          dropEvent(live.id);
          passed.add(slug);
          setStatus(slug, "ready");
          emit();
          return false;
        }

        updateEvent(live.id, {
          text: turn.text,
          streaming: false,
          addressedTo: turn.addressedTo,
          reaction: turn.reaction,
        });

        const current = seat(slug);
        if (current) {
          state.members = state.members.map((m) =>
            m.slug === slug
              ? { ...m, spokenCount: m.spokenCount + 1, status: "ready", reaction: turn.reaction }
              : m,
          );
        }
        lastSpeaker = slug;

        if (turn.wantsToRespond) {
          const target = matchMemberByName(turn.wantsToRespond, state.selected);
          if (target && target.slug !== slug) {
            floorQueue = [target.slug, ...floorQueue.filter((s) => s !== target.slug)];
            setStatus(target.slug, "wants_to_respond");
          }
        }
        emit();
        return true;
      } catch {
        // Never leave a half-written bubble or a seat stuck typing.
        dropEvent(live.id);
        setStatus(slug, "reconnecting");
        emit();
        throw new Error("turn failed");
      }
    };

    try {
      return await run();
    } catch {
      try {
        return await run();
      } catch (error) {
        state.lastError =
          error instanceof Error && error.message !== "turn failed"
            ? error.message
            : `${member.name} could not take that turn. The meeting continued without it.`;
        setStatus(slug, "ready");
        emit();
        return false;
      }
    }
  }

  /** Serialises everything that mutates the room behind the turn currently streaming. */
  async function queued<T>(work: () => Promise<T>): Promise<T> {
    const previous = activeTurn;
    let release: () => void = () => {};
    activeTurn = new Promise<void>((resolve) => {
      release = resolve;
    });
    try {
      if (previous) await previous.catch(() => {});
      return await work();
    } finally {
      release();
    }
  }

  async function takeOneTurn(): Promise<boolean> {
    if (ended || state.meetingPhase !== "discussion" || state.composing) return false;
    // A member may pass. Try the next voice rather than ending the discussion on one silence.
    for (let attempt = 0; attempt < state.members.length; attempt += 1) {
      const slug = nextSpeaker();
      if (!slug) return false;
      if (await speak(slug, "publicTurn")) return true;
      if (!passed.has(slug)) return false;
    }
    return false;
  }

  async function pump(): Promise<void> {
    if (pumping || !autoContinue) return;
    pumping = true;
    try {
      while (
        !ended &&
        state.meetingPhase === "discussion" &&
        !state.composing &&
        autoTurnsUsed < AUTO_TURN_BUDGET
      ) {
        const spoke = await queued(() => takeOneTurn());
        if (!spoke) break;
        autoTurnsUsed += 1;
        if (turnGapMs) await sleep(turnGapMs);
      }
      if (state.meetingPhase === "discussion" && !ended && !state.composing) {
        state.awaitingChair = true;
        emit();
      }
    } finally {
      pumping = false;
    }
  }

  /** Something new entered the room, so the board has a reason to keep going. */
  function wake(extraTurns = 3) {
    // New context is a reason to speak again, even for someone who had nothing to add before.
    passed = new Set();
    state.awaitingChair = false;
    autoTurnsUsed = Math.max(0, Math.min(autoTurnsUsed, AUTO_TURN_BUDGET - extraTurns));
    if (autoContinue) void pump();
  }

  // ------------------------------------------------------------ meeting start

  async function startMeeting(): Promise<ActionResult> {
    if (!canStart()) {
      return {
        ok: false,
        message: `Seat ${MIN_BOARD} to ${MAX_BOARD} advisers and describe the decision first.`,
      };
    }
    ended = false;
    autoTurnsUsed = 0;
    mentionQueue = [];
    floorQueue = [];
    lastSpeaker = null;
    passed = new Set();

    state.phase = "meeting";
    state.meetingPhase = "opening";
    state.members = state.selected.map((slug) => {
      const member = getMember(slug)!;
      return {
        slug,
        name: member.name,
        role: member.role,
        house: member.house,
        initials: member.initials,
        status: "thinking" as SeatStatus,
        spokenCount: 0,
      };
    });
    state.guest = { name: null, status: "waiting" };
    systemEvent(
      "The chair has opened the meeting. Every adviser is forming an independent position in private, so the first speaker does not anchor the room.",
    );
    emit();

    // Independent, concurrent, and isolated: no member sees another's opening position.
    const positions = await Promise.all(
      state.members.map(async (member) => {
        const position = await withRetry(member.slug, () =>
          runtime.formOpeningPosition({ ...baseInput(member.slug), capability: "formOpeningPosition" }),
        );
        setStatus(member.slug, "ready");
        emit();
        return position;
      }),
    );

    state.positions = Object.fromEntries(
      positions.filter((position): position is OpeningPosition => Boolean(position)).map((p) => [p.memberId, p]),
    );

    const missing = state.members.filter((member) => !state.positions[member.slug]);
    state.meetingPhase = "discussion";
    systemEvent(
      missing.length
        ? `Independent positions are closed. ${missing
            .map((m) => m.name)
            .join(" and ")} will join the discussion without one. The board is in session.`
        : "Independent positions are closed. The board is in session.",
    );
    emit();

    if (autoContinue) void pump();
    return { ok: true, message: "The meeting is in session." };
  }

  // ------------------------------------------------------------- chair inputs

  async function sendUserMessage(text: string): Promise<ActionResult> {
    const trimmed = text.trim();
    if (!trimmed) return { ok: false, message: "Nothing to say." };
    if (state.phase !== "meeting" || ended) {
      return { ok: false, message: "There is no meeting in session." };
    }

    // The chair's words go on the record immediately, even mid-turn. Only the board's
    // response waits for the member currently speaking to finish.
    addEvent({ kind: "message", speakerId: "chair", speakerName: "You", text: trimmed });
    const mentioned = extractMention(trimmed, state.selected);
    if (mentioned) {
      mentionQueue = [mentioned, ...mentionQueue.filter((slug) => slug !== mentioned)];
      passed.delete(mentioned);
    }
    state.awaitingChair = false;
    emit();

    return queued(async () => {
      if (mentioned) {
        await speak(mentioned, "answerDirect", trimmed, "You");
        mentionQueue = mentionQueue.filter((slug) => slug !== mentioned);
      }
      return { ok: true, message: "Sent to the board." };
    }).then((result) => {
      wake();
      return result;
    });
  }

  // ------------------------------------------------------- external agent (WebMCP)

  function inspect(): InspectResult {
    return {
      phase: state.phase,
      meetingPhase: state.meetingPhase,
      chair: "You (the human chair)",
      briefing: state.briefing,
      board: state.members.map((member) => ({
        name: member.name,
        role: member.role,
        status: member.status,
        contributions: member.spokenCount,
      })),
      guest: { name: state.guest.name, status: state.guest.status },
      transcript: state.transcript
        .filter((event) => event.kind !== "reaction")
        .map((event) => ({
          speaker: event.kind === "system" ? "Meeting record" : event.speakerName,
          ...(event.addressedTo ? { to: event.addressedTo } : {}),
          text: event.text,
        })),
      readoutReady: Boolean(state.readout),
    };
  }

  function join(name: string): ActionResult {
    if (state.phase !== "meeting" || ended) {
      return { ok: false, message: "There is no meeting in session to join." };
    }
    const display = name.trim().slice(0, 40);
    if (!display) return { ok: false, message: "Provide the name you know yourself by." };
    if (state.guest.name) {
      return {
        ok: false,
        message:
          state.guest.name === display
            ? `You are already seated as ${display}.`
            : `The guest seat is taken by ${state.guest.name}. One external agent may join a meeting.`,
      };
    }

    state.guest = { name: display, status: "joining" };
    emit();
    state.guest = { name: display, status: "joined" };
    systemEvent(`${display} joined the meeting through this page's site tools and took the guest seat.`);
    noteAgentActivity(`${display} joined the guest seat`);
    emit();
    return {
      ok: true,
      message: `Seated as ${display}. You can contribute context, address an adviser by name, and request a synthesis. Only the human chair can end the meeting.`,
    };
  }

  function requireGuest(): { ok: false; message: string } | { ok: true; name: string } {
    if (!state.guest.name) {
      return { ok: false, message: "Join the meeting first with join_board_meeting." };
    }
    if (state.phase === "readout" || ended) {
      return { ok: false, message: "The meeting has ended. Only the readout is available now." };
    }
    return { ok: true, name: state.guest.name };
  }

  async function contribute(text: string): Promise<ActionResult> {
    const guest = requireGuest();
    if (!guest.ok) return guest;
    const trimmed = text.trim();
    if (!trimmed) return { ok: false, message: "Nothing to contribute." };

    // Queued behind any turn currently streaming, then applied immediately after it.
    const result = await queued(async () => {
      state.guest = { ...state.guest, status: "contributing" };
      addEvent({ kind: "message", speakerId: "guest", speakerName: guest.name, text: trimmed });
      noteAgentActivity(`${guest.name} added context to the record`);
      emit();
      state.guest = { ...state.guest, status: "joined" };
      emit();
      return {
        ok: true,
        message: `Added to the public record. Every adviser sees it from their next turn. ${state.members.length} advisers are seated; the meeting is in ${state.meetingPhase}.`,
      };
    });
    wake();
    return result;
  }

  async function address(memberName: string, text: string): Promise<ActionResult> {
    const guest = requireGuest();
    if (!guest.ok) return guest;
    const member = matchMemberByName(memberName, state.selected);
    if (!member) {
      return {
        ok: false,
        message: `No adviser named "${memberName}" is at this table. Seated: ${state.members
          .map((m) => m.name)
          .join(", ")}.`,
      };
    }
    const trimmed = text.trim();
    if (!trimmed) return { ok: false, message: "Ask them something." };
    if (state.meetingPhase === "opening") {
      return {
        ok: false,
        message: "The board is still forming independent positions. Contribute context now and ask once discussion opens.",
      };
    }

    const result = await queued(async () => {
      state.guest = { ...state.guest, status: "asking" };
      addEvent({
        kind: "message",
        speakerId: "guest",
        speakerName: guest.name,
        text: `@${member.name} ${trimmed}`,
        addressedTo: member.name,
      });
      mentionQueue = [member.slug, ...mentionQueue.filter((slug) => slug !== member.slug)];
      passed.delete(member.slug);
      noteAgentActivity(`${guest.name} put a question to ${member.name}`);
      emit();

      await speak(member.slug, "answerDirect", trimmed, guest.name);
      mentionQueue = mentionQueue.filter((slug) => slug !== member.slug);
      state.guest = { ...state.guest, status: "joined" };
      emit();

      const answer = [...state.transcript].reverse().find((event) => event.speakerId === member.slug);
      return {
        ok: true,
        message: answer
          ? `${member.name} answered: ${answer.text}`
          : `${member.name} could not answer that turn.`,
      };
    });
    wake();
    return result;
  }

  async function requestSynthesis(): Promise<ActionResult> {
    const guest = requireGuest();
    if (!guest.ok) return guest;

    return queued(async () => {
      noteAgentActivity(`${guest.name} requested an interim synthesis`);
      const text = await withRetry(null, () =>
        runtime.synthesis({
          capability: "synthesis",
          briefing: state.briefing,
          phase: state.meetingPhase,
          transcript: state.transcript.filter((event) => !event.streaming),
          ownPriorStatements: [],
          boardNames: state.members.map((member) => member.name),
        }),
      );
      if (!text) {
        emit();
        return { ok: false, message: "The secretary could not produce a synthesis. The meeting is unaffected." };
      }
      addEvent({ kind: "system", speakerId: "secretary", speakerName: "Secretary", text });
      emit();
      return { ok: true, message: text };
    });
  }

  function getReadout(): { ready: boolean; message: string; readout?: ExecutiveReadout } {
    if (!state.readout) {
      return {
        ready: false,
        message:
          "The final readout does not exist yet. The human chair has to end the meeting first; only they can. Try again after that.",
      };
    }
    if (state.guest.name && !state.readoutRetrievedBy) {
      state.readoutRetrievedBy = state.guest.name;
      noteAgentActivity(`${state.guest.name} retrieved the final readout`);
      emit();
    }
    return { ready: true, message: "The final readout follows.", readout: state.readout };
  }

  function guestEndMeeting(): ActionResult {
    return {
      ok: false,
      message:
        "Only the human chair can end this meeting. You can request an interim synthesis instead, and retrieve the readout once the chair has closed the room.",
    };
  }

  // --------------------------------------------------------------- meeting end

  async function endMeeting(): Promise<ActionResult> {
    if (state.phase !== "meeting") return { ok: false, message: "There is no meeting to end." };

    // Let the turn that is currently streaming finish cleanly rather than cutting it off.
    await queued(async () => {
      ended = true;
      state.meetingPhase = "ending";
      state.awaitingChair = false;
      systemEvent("The chair closed the discussion and asked every adviser for a closing comment.");
      emit();
    });

    const closingComments: ClosingComment[] = await Promise.all(
      state.members.map(async (member) => {
        const comment = await withRetry(member.slug, () =>
          runtime.closingComment({ ...baseInput(member.slug), capability: "closingComment" }),
        );
        setStatus(member.slug, "ready");
        emit();
        if (comment) return { memberId: member.slug, name: member.name, comment };
        // Falling back to their most recent substantive position beats blocking the memo.
        const position = state.positions[member.slug];
        const lastSaid = [...state.transcript]
          .reverse()
          .find((event) => event.speakerId === member.slug && event.kind === "message")?.text;
        return {
          memberId: member.slug,
          name: member.name,
          comment: lastSaid ?? position?.recommendation ?? "No closing comment was captured.",
        };
      }),
    );

    // Closing comments are said out loud, so every seated adviser has spoken publicly.
    for (const comment of closingComments) {
      addEvent({
        kind: "message",
        speakerId: comment.memberId,
        speakerName: comment.name,
        text: comment.comment,
      });
    }
    emit();

    const readoutInput = {
      briefing: state.briefing,
      transcript: state.transcript.filter((event) => !event.streaming),
      closingComments,
      boardNames: state.members.map((member) => member.name),
    };
    const readout = await withRetry(null, () => runtime.readout(readoutInput));

    state.readout =
      readout ?? fallbackReadout(state.briefing, readoutInput.transcript, closingComments);
    state.phase = "readout";
    state.meetingPhase = "closed";
    emit();
    return { ok: true, message: "The readout is ready." };
  }

  function reset() {
    ended = true;
    pumping = false;
    activeTurn = null;
    autoTurnsUsed = 0;
    mentionQueue = [];
    floorQueue = [];
    lastSpeaker = null;
    passed = new Set();
    Object.assign(state, {
      phase: "select" as Phase,
      meetingPhase: "idle" as MeetingPhase,
      search: "",
      selected: [],
      selectionMessage: null,
      briefing: "",
      members: [],
      guest: { name: null, status: "empty" as GuestStatus },
      transcript: [],
      positions: {},
      composing: false,
      awaitingChair: false,
      readout: null,
      lastError: null,
      agentActivity: [],
      readoutRetrievedBy: null,
    });
    emit();
  }

  return {
    getState: snapshot,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    // selection and briefing
    catalog: CATALOG,
    visibleCatalog(): CatalogMember[] {
      return searchCatalog(state.search);
    },
    setSearch(query: string) {
      state.search = query;
      emit();
    },
    toggleMember,
    goToBrief(): ActionResult {
      if (state.selected.length < MIN_BOARD) {
        state.selectionMessage = `Seat at least ${MIN_BOARD} advisers.`;
        emit();
        return { ok: false, message: state.selectionMessage };
      }
      state.phase = "brief";
      emit();
      return { ok: true, message: "Brief the board." };
    },
    goToSelect(): ActionResult {
      if (state.phase !== "brief") return { ok: false, message: "The board is locked." };
      state.phase = "select";
      emit();
      return { ok: true, message: "Back to the roster." };
    },
    setBriefing(text: string) {
      state.briefing = text;
      emit();
    },
    useExampleDecision() {
      state.briefing = EXAMPLE_DECISION;
      emit();
    },
    setSetupMessage(message: string | null) {
      state.setupMessage = message;
      emit();
    },
    canStart,

    // the meeting
    startMeeting,
    sendUserMessage,
    setComposing(value: boolean) {
      state.composing = value;
      emit();
      if (!value) wake(1);
    },
    /** Steps the room by hand. Tests use this instead of the automatic pump. */
    takeOneTurn: () => queued(() => takeOneTurn()),
    async runDiscussion(turns: number) {
      for (let i = 0; i < turns; i += 1) {
        const spoke = await queued(() => takeOneTurn());
        if (!spoke) break;
      }
    },
    endMeeting,
    reset,

    // WebMCP-facing actions, shared verbatim with the human interface
    inspect,
    join,
    contribute,
    address,
    requestSynthesis,
    getReadout,
    guestEndMeeting,

    // demo copy
    invitationPrompt: () => invitationPrompt(state.members.map((member) => member.name)),
    exampleQuestion: EXAMPLE_QUESTION,
    decisionTitle: () => decisionLine(state.briefing),
  };
}

export type MeetingSession = ReturnType<typeof createMeetingSession>;
