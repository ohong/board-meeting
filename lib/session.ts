import { CATALOG, getMember, matchMemberByName, searchCatalog } from "./catalog";
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
  now?: () => number;
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
};

type Listener = () => void;

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createMeetingSession(options: SessionOptions = {}) {
  const runtime = options.runtime ?? createMockRuntime();
  const autoContinue = options.autoContinue ?? false;
  const now = options.now ?? (() => Date.now());
  const listeners = new Set<Listener>();
  let seq = 0;
  let pumping = false;
  let ended = false;

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
    seq += 1;
    for (const fn of listeners) fn();
  }

  function snapshot(): MeetingState {
    return {
      ...state,
      selected: [...state.selected],
      members: state.members.map((m) => ({ ...m })),
      guest: { ...state.guest },
      transcript: [...state.transcript],
      positions: { ...state.positions },
      mentionQueue: [...state.mentionQueue],
      readout: state.readout,
    };
  }

  function addEvent(partial: Omit<TranscriptEvent, "id" | "createdAt">): TranscriptEvent {
    const event: TranscriptEvent = { ...partial, id: uid("evt"), createdAt: now() };
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

  function canStart(): boolean {
    return state.selected.length >= 3 && state.selected.length <= 6 && state.briefing.trim().length > 0;
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
      transcript: state.transcript.filter((e) => e.kind !== "system" || true),
      privatePosition: state.positions[slug],
      ownPriorStatements: own,
      boardNames: state.members.map((m) => m.name),
    };
  }

  function nextSpeaker(): string | undefined {
    const mention = state.mentionQueue.shift();
    if (mention && state.members.some((m) => m.slug === mention)) return mention;
    const unspoken = state.members.filter((m) => m.spokenCount === 0);
    if (unspoken.length) return unspoken[0].slug;
    const underTwo = state.members.filter((m) => m.spokenCount < 2);
    const everyoneOnce = state.members.every((m) => m.spokenCount >= 1);
    if (!everyoneOnce) {
      const first = state.members.find((m) => m.spokenCount < 1);
      return first?.slug;
    }
    const pool = underTwo.length ? underTwo : state.members;
    const idx = seq % pool.length;
    return pool[idx]?.slug;
  }

  async function runTurn(slug: string, capability: "publicTurn" | "answerDirect", prompt?: string) {
    if (ended) return;
    const member = getMember(slug);
    if (!member) return;
    setMemberStatus(slug, "speaking");
    emit();
    try {
      const turn = await runtime.publicTurn({
        ...baseInput(slug),
        capability,
        prompt,
        addressedTo: capability === "answerDirect" ? prompt : undefined,
      });
      const seat = state.members.find((m) => m.slug === slug);
      if (seat) seat.spokenCount += 1;
      addEvent({
        kind: "message",
        speakerId: slug,
        speakerName: member.name,
        text: turn.text,
        addressedTo: turn.addressedTo,
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
      setMemberStatus(slug, "ready");
      emit();
    } catch {
      setMemberStatus(slug, "reconnecting");
      emit();
      try {
        const turn = await runtime.publicTurn({
          ...baseInput(slug),
          capability,
          prompt,
        });
        addEvent({
          kind: "message",
          speakerId: slug,
          speakerName: member.name,
          text: turn.text,
        });
        const seat = state.members.find((m) => m.slug === slug);
        if (seat) seat.spokenCount += 1;
        setMemberStatus(slug, "ready");
      } catch (err) {
        state.lastError = err instanceof Error ? err.message : "A board member failed to speak.";
        setMemberStatus(slug, "ready");
      }
      emit();
    }
  }

  async function pumpOnce(): Promise<boolean> {
    if (ended || state.meetingPhase !== "discussion" || state.composing) return false;
    const slug = nextSpeaker();
    if (!slug) return false;
    const capability = state.mentionQueue.length ? "publicTurn" : "publicTurn";
    await runTurn(slug, capability);
    return true;
  }

  async function startMeeting(): Promise<{ ok: boolean; message?: string }> {
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
        try {
          const position = await runtime.formOpeningPosition({
            ...baseInput(seat.slug),
            capability: "formOpeningPosition",
          });
          setMemberStatus(seat.slug, "ready");
          return [seat.slug, position] as const;
        } catch {
          setMemberStatus(seat.slug, "reconnecting");
          const position = await runtime.formOpeningPosition({
            ...baseInput(seat.slug),
            capability: "formOpeningPosition",
          });
          setMemberStatus(seat.slug, "ready");
          return [seat.slug, position] as const;
        }
      }),
    );
    state.positions = Object.fromEntries(openings);
    state.meetingPhase = "discussion";
    addEvent({
      kind: "system",
      speakerId: "system",
      speakerName: "Secretary",
      text: "Independent views are closed. The board is in discussion.",
    });
    emit();
    if (autoContinue && !pumping) {
      void autoPump();
    }
    return { ok: true };
  }

  async function autoPump() {
    pumping = true;
    try {
      let turns = 0;
      while (!ended && state.meetingPhase === "discussion" && !state.composing && turns < 12) {
        const did = await pumpOnce();
        if (!did) break;
        turns += 1;
      }
    } finally {
      pumping = false;
    }
  }

  async function sendUserMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || state.phase !== "meeting" || ended) return;
    addEvent({
      kind: "message",
      speakerId: "chair",
      speakerName: "You",
      text: trimmed,
    });
    const mentioned = extractMention(trimmed, state.selected);
    emit();
    if (mentioned) {
      await runTurn(mentioned, "answerDirect", trimmed);
    } else if (autoContinue) {
      await pumpOnce();
    }
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
    };
  }

  function join(name: string): { ok: boolean; message: string } {
    if (state.phase !== "meeting") {
      return { ok: false, message: "No active board meeting to join." };
    }
    const display = name.trim();
    if (!display) return { ok: false, message: "Provide the name you know yourself by." };
    if (state.guest.name && state.guest.status !== "empty" && state.guest.status !== "waiting") {
      return { ok: false, message: `The guest seat is already occupied by ${state.guest.name}.` };
    }
    state.guest = { name: display, status: "joining" };
    emit();
    state.guest = { name: display, status: "joined" };
    addEvent({
      kind: "system",
      speakerId: "system",
      speakerName: "Secretary",
      text: `${display} has taken the guest seat.`,
    });
    emit();
    return { ok: true, message: `Joined as ${display}.` };
  }

  function requireGuest(): { ok: false; message: string } | { ok: true; name: string } {
    if (!state.guest.name || state.guest.status === "empty" || state.guest.status === "waiting") {
      return { ok: false, message: "Join the meeting before contributing." };
    }
    return { ok: true, name: state.guest.name };
  }

  async function contribute(text: string) {
    const guest = requireGuest();
    if (!guest.ok) return guest;
    const trimmed = text.trim();
    if (!trimmed) return { ok: false, message: "Nothing to contribute." };
    state.guest.status = "contributing";
    addEvent({
      kind: "message",
      speakerId: "guest",
      speakerName: guest.name,
      text: trimmed,
    });
    emit();
    state.guest.status = "joined";
    emit();
    if (autoContinue && state.meetingPhase === "discussion") await pumpOnce();
    return { ok: true, message: "Context added to the public transcript." };
  }

  async function address(memberName: string, text: string) {
    const guest = requireGuest();
    if (!guest.ok) return guest;
    const member = matchMemberByName(memberName, state.selected);
    if (!member) return { ok: false, message: `No seated adviser named ${memberName}.` };
    const trimmed = text.trim();
    state.guest.status = "asking";
    addEvent({
      kind: "message",
      speakerId: "guest",
      speakerName: guest.name,
      text: `@${member.name} ${trimmed}`,
      addressedTo: member.name,
    });
    state.mentionQueue.unshift(member.slug);
    emit();
    await runTurn(member.slug, "answerDirect", trimmed);
    state.guest.status = "joined";
    emit();
    return { ok: true, message: `${member.name} was addressed and answered.` };
  }

  async function requestSynthesis() {
    const guest = requireGuest();
    if (!guest.ok) return guest;
    const text = await runtime.synthesis({
      capability: "synthesis",
      briefing: state.briefing,
      phase: state.meetingPhase,
      transcript: state.transcript,
      ownPriorStatements: [],
      boardNames: state.members.map((m) => m.name),
    });
    addEvent({
      kind: "system",
      speakerId: "secretary",
      speakerName: "Secretary",
      text,
    });
    emit();
    return { ok: true, message: text };
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

  async function endMeeting(): Promise<{ ok: boolean; message?: string }> {
    if (state.phase !== "meeting") return { ok: false, message: "No meeting to end." };
    ended = true;
    state.meetingPhase = "ending";
    addEvent({
      kind: "system",
      speakerId: "system",
      speakerName: "Secretary",
      text: "The chair has ended the meeting. Closing comments are being collected.",
    });
    emit();
    const closingComments: ClosingComment[] = await Promise.all(
      state.members.map(async (seat) => {
        try {
          const comment = await runtime.closingComment({
            ...baseInput(seat.slug),
            capability: "closingComment",
          });
          return { memberId: seat.slug, name: seat.name, comment };
        } catch {
          const pos = state.positions[seat.slug];
          return {
            memberId: seat.slug,
            name: seat.name,
            comment: pos?.recommendation ?? "No closing comment captured.",
          };
        }
      }),
    );
    const readout = await runtime.readout({
      briefing: state.briefing,
      transcript: state.transcript,
      closingComments,
      boardNames: state.members.map((m) => m.name),
    });
    state.readout = readout;
    state.phase = "readout";
    state.meetingPhase = "closed";
    emit();
    return { ok: true };
  }

  function reset() {
    ended = true;
    pumping = false;
    state.phase = "select";
    state.meetingPhase = "idle";
    state.search = "";
    state.selected = [];
    state.selectionMessage = null;
    state.briefing = "";
    state.members = [];
    state.guest = { name: null, status: "empty" };
    state.transcript = [];
    state.positions = {};
    state.mentionQueue = [];
    state.composing = false;
    state.readout = null;
    state.lastError = null;
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
      state.briefing = text;
      emit();
    },
    useExampleDecision() {
      state.briefing = EXAMPLE_DECISION;
      emit();
    },
    canStart,
    startMeeting,
    sendUserMessage,
    setComposing(value: boolean) {
      state.composing = value;
      emit();
    },
    pumpOnce,
    pumpDiscussion: async (n: number) => {
      for (let i = 0; i < n; i += 1) {
        const did = await pumpOnce();
        if (!did) break;
      }
    },
    endMeeting,
    inspect,
    join,
    contribute,
    address,
    requestSynthesis,
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
