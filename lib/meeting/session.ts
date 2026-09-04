/**
 * MeetingSession — the reactive client copy of a board meeting.
 *
 * Deterministic application logic lives here: phase transitions, selection limits,
 * participant identity, transcript ordering, queueing, chair-only authorization,
 * participation bookkeeping. No model calls. Shared-room persistence is handled
 * by RoomSync so this class remains deterministic and directly testable.
 *
 * Both the human UI and the WebMCP tools call the SAME public actions on this object.
 * The orchestration engine (engine.ts) drives the async meeting loop through the
 * `engine*` mutators and listens to `on(...)` events.
 */

import {
  MAX_BOARD_SIZE,
  MIN_BOARD_SIZE,
  DEMO_BRIEFING,
  type ActionResult,
  type ClosingComment,
  type EventEntry,
  type GuestStatus,
  type MeetingPhase,
  type MeetingState,
  type MemberParticipant,
  type MemberStatus,
  type MessageEntry,
  type MessageIntent,
  type OpeningPosition,
  type PersonaSummary,
  type QueuedInput,
  type QueuedInputKind,
  type Reaction,
  type Readout,
  type ReadoutStatus,
  type SynthesisEntry,
  type SystemEventKind,
  type TranscriptEntry,
  type TranscriptLine,
} from "./types";

/** Match the server-side request schemas so invalid oversized prompts never enter the loop. */
export const MAX_BRIEFING_CHARACTERS = 6_000;
export const MAX_CHAIR_MESSAGE_CHARACTERS = 2_000;

export type SessionEvent =
  | { type: "start" }
  | { type: "resume" }
  | { type: "input"; input: QueuedInput }
  | { type: "compose"; composing: boolean }
  | { type: "end" }
  | { type: "retry"; memberId: string }
  | { type: "reset" };

type Listener = () => void;
type EventListener = (event: SessionEvent) => void;

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

export function createInitialState(): MeetingState {
  return {
    phase: "selecting",
    board: [],
    briefing: "",
    chair: { role: "chair", id: "chair", name: "You" },
    members: {},
    guest: null,
    transcript: [],
    queue: [],
    streamingEntryId: null,
    chairComposing: false,
    closingComments: [],
    readout: null,
    readoutStatus: "idle",
    readoutRetrievedByGuestAt: null,
    room: null,
    invitePanelOpen: false,
    notice: null,
    startedAt: null,
    endedAt: null,
  };
}

export class MeetingSession {
  private state: MeetingState;
  private listeners = new Set<Listener>();
  private eventListeners = new Set<EventListener>();
  private catalog: PersonaSummary[] = [];
  private chairKey: string | null = null;
  private authority: "chair" | "guest" = "chair";
  private applyingRemote = false;
  private roomRevision = 0;
  private seenRoomInputIds = new Set<string>();
  private mutationVersion = 0;

  constructor(initial?: MeetingState) {
    this.state = initial ?? createInitialState();
  }

  // ------------------------------------------------------------------ store

  getState = (): MeetingState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setCatalog(catalog: PersonaSummary[]): void {
    this.catalog = catalog;
  }

  getCatalog(): PersonaSummary[] {
    return this.catalog;
  }

  resolveCatalogMember(ref: string): PersonaSummary | undefined {
    const needle = ref.trim().replace(/^@/, "").toLowerCase();
    if (!needle) return undefined;
    return (
      this.catalog.find((persona) => persona.slug === needle) ??
      this.catalog.find((persona) => persona.mention.toLowerCase() === needle) ??
      this.catalog.find((persona) => persona.name.toLowerCase() === needle) ??
      this.catalog.find((persona) => persona.shortName.toLowerCase() === needle) ??
      this.catalog.find((persona) => persona.name.toLowerCase().startsWith(needle))
    );
  }

  getRoomId(): string | null {
    return this.state.room?.id ?? null;
  }

  getChairKey(): string | null {
    return this.chairKey;
  }

  getRoomRevision(): number {
    return this.roomRevision;
  }

  getMutationVersion(): number {
    return this.mutationVersion;
  }

  getAcknowledgedRoomInputIds(): string[] {
    const queued = new Set(this.state.queue.map((input) => input.id));
    return [...this.seenRoomInputIds].filter((id) => !queued.has(id)).slice(-100);
  }

  isChair(): boolean {
    return this.authority === "chair";
  }

  isApplyingRoomState(): boolean {
    return this.applyingRemote;
  }

  markRoomCreating(): void {
    this.update((state) => ({ ...state, room: { id: null, status: "creating", error: null } }));
  }

  attachRoom(id: string, chairKey: string | null, revision = 0): void {
    const switchingRooms = this.state.room?.id !== id;
    if (switchingRooms) this.seenRoomInputIds.clear();
    this.chairKey = chairKey;
    this.authority = chairKey ? "chair" : "guest";
    this.roomRevision = switchingRooms ? revision : Math.max(this.roomRevision, revision);
    this.update((state) => ({ ...state, room: { id, status: "synced", error: null } }));
  }

  markRoomError(message: string): void {
    this.update((state) => ({
      ...state,
      room: { id: state.room?.id ?? null, status: "error", error: message },
    }));
  }

  /** Apply a canonical room snapshot, optionally preserving newer chair work. */
  applyRoomState(next: MeetingState, wakeEngine = false, revision = 0, mergeGuestOnly = false): boolean {
    if (revision > 0 && revision <= this.roomRevision) return false;
    const previous = this.state;
    const previousQueue = new Set(previous.queue.map((input) => input.id));
    const remoteInput = (input: QueuedInput) =>
      input.kind === "guest-context" || input.kind === "guest-address" || input.kind === "synthesis-request";
    const remoteEntry = (entry: TranscriptEntry) =>
      (entry.kind === "message" && entry.speakerRole === "guest") ||
      (entry.kind === "event" && (entry.event === "guest-joined" || entry.event === "readout-retrieved")) ||
      entry.kind === "synthesis";
    let shared = next;
    if (mergeGuestOnly && this.isChair()) {
      const transcriptIds = new Set(previous.transcript.map((entry) => entry.id));
      const additions = next.transcript.filter(
        (entry) => remoteEntry(entry) && !transcriptIds.has(entry.id),
      );
      const queueIds = new Set(previous.queue.map((input) => input.id));
      const newInputs = next.queue.filter(
        (input) =>
          remoteInput(input) &&
          !queueIds.has(input.id) &&
          !this.seenRoomInputIds.has(input.id),
      );
      shared = {
        ...previous,
        guest: previous.guest ?? next.guest,
        transcript: [...previous.transcript, ...additions].sort((a, b) => a.ts - b.ts),
        queue: [...previous.queue, ...newInputs].sort((a, b) => a.ts - b.ts),
        readoutRetrievedByGuestAt:
          previous.readoutRetrievedByGuestAt ?? next.readoutRetrievedByGuestAt,
      };
    }
    const localUi = {
      invitePanelOpen: previous.invitePanelOpen,
      notice: previous.notice,
      chairComposing: this.isChair() ? previous.chairComposing : false,
    };
    this.applyingRemote = true;
    this.state = {
      ...shared,
      ...localUi,
      room: {
        id: this.getRoomId() ?? shared.room?.id ?? null,
        status: "synced",
        error: null,
      },
    };
    const remoteQueueIds = new Set<string>();
    for (const input of next.queue) {
      if (!remoteInput(input)) continue;
      remoteQueueIds.add(input.id);
      this.seenRoomInputIds.add(input.id);
    }
    const localQueueIds = new Set(this.state.queue.map((input) => input.id));
    for (const id of this.seenRoomInputIds) {
      if (!remoteQueueIds.has(id) && !localQueueIds.has(id)) this.seenRoomInputIds.delete(id);
    }
    this.roomRevision = Math.max(this.roomRevision, revision);
    this.mutationVersion += 1;
    for (const listener of this.listeners) listener();
    this.applyingRemote = false;

    if (!wakeEngine || !this.isChair()) return true;
    for (const input of this.state.queue) {
      if (!previousQueue.has(input.id)) this.emit({ type: "input", input });
    }
    if (previous.phase !== "closing" && this.state.phase === "closing") this.emit({ type: "end" });
    return true;
  }

  /** Resume a chair-owned engine after loading an existing shared room. */
  resumeEngine(): void {
    if (!this.isChair()) return;
    if (this.state.phase === "forming" || this.state.phase === "discussion" || this.state.phase === "closing") {
      this.emit({ type: "resume" });
    }
  }

  on = (listener: EventListener): (() => void) => {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  };

  private update(fn: (draft: MeetingState) => MeetingState | void): void {
    const next = fn({ ...this.state });
    this.state = next ?? this.state;
    this.mutationVersion += 1;
    for (const l of this.listeners) l();
  }

  private emit(event: SessionEvent): void {
    for (const l of this.eventListeners) l(event);
  }

  // -------------------------------------------------------------- selectors

  members(): MemberParticipant[] {
    return Object.values(this.state.members).sort((a, b) => a.seat - b.seat);
  }

  member(id: string): MemberParticipant | undefined {
    return this.state.members[id];
  }

  /** Resolve a member from an @mention token, first name, full name, or slug. Case-insensitive. */
  resolveMember(ref: string): MemberParticipant | undefined {
    const needle = ref.trim().replace(/^@/, "").toLowerCase();
    if (!needle) return undefined;
    const list = this.members();
    return (
      list.find((m) => m.id === needle) ??
      list.find((m) => m.persona.mention.toLowerCase() === needle) ??
      list.find((m) => m.persona.name.toLowerCase() === needle) ??
      list.find((m) => m.persona.shortName.toLowerCase() === needle) ??
      list.find((m) => m.persona.name.toLowerCase().startsWith(needle)) ??
      list.find((m) => m.persona.name.toLowerCase().split(/\s+/).includes(needle))
    );
  }

  /** Find the first @mention in free text that resolves to a board member. */
  parseMention(text: string): MemberParticipant | undefined {
    const tokens = text.match(/@([A-Za-z][A-Za-z.'-]*(?:\s[A-Z][A-Za-z.'-]*)?)/g) ?? [];
    for (const raw of tokens) {
      const full = this.resolveMember(raw);
      if (full) return full;
      const first = this.resolveMember(raw.split(/\s/)[0]);
      if (first) return first;
    }
    return undefined;
  }

  /** Compact transcript representation handed to model calls. */
  transcriptLines(): TranscriptLine[] {
    const lines: TranscriptLine[] = [];
    for (const e of this.state.transcript) {
      if (e.kind === "message") {
        if (!e.text.trim()) continue;
        lines.push({
          speakerId: e.speakerId,
          speakerName: e.speakerRole === "guest" ? `${e.speakerName} (external agent)` : e.speakerRole === "chair" ? "Chair (founder)" : e.speakerName,
          role: e.speakerRole,
          text: e.text,
          addressedName: e.addressedName,
        });
      } else if (e.kind === "synthesis") {
        if (!e.text.trim()) continue;
        lines.push({
          speakerId: "secretary",
          speakerName: "Secretary (interim synthesis)",
          role: "system",
          text: e.text,
          addressedName: null,
        });
      } else if (e.event === "guest-joined" || e.event === "meeting-started") {
        lines.push({
          speakerId: "system",
          speakerName: "System",
          role: "system",
          text: e.text,
          addressedName: null,
        });
      }
    }
    return lines;
  }

  canStart(): boolean {
    const n = this.state.board.length;
    return n >= MIN_BOARD_SIZE && n <= MAX_BOARD_SIZE && this.state.briefing.trim().length > 0;
  }

  configureAndStart(board: PersonaSummary[], briefing: string): ActionResult {
    if (!this.isChair()) return err("NOT_ALLOWED", "Only the meeting chair can launch a board.");
    if (this.state.phase !== "selecting" && this.state.phase !== "briefing") {
      return err("NOT_ALLOWED", "A meeting is already in progress.");
    }
    const unique = [...new Map(board.map((persona) => [persona.slug, persona])).values()];
    if (unique.length < MIN_BOARD_SIZE || unique.length > MAX_BOARD_SIZE) {
      return err("LIMIT", `Choose ${MIN_BOARD_SIZE}–${MAX_BOARD_SIZE} distinct advisers.`);
    }
    const trimmed = briefing.trim();
    if (!trimmed) return err("INVALID_INPUT", "Write a decision briefing before launching the meeting.");
    this.update((state) => ({
      ...createInitialState(),
      board: unique,
      briefing: trimmed.slice(0, MAX_BRIEFING_CHARACTERS),
      room: state.room,
    }));
    return this.startMeeting();
  }

  /** Finalization waits until every currently available member has spoken once. */
  canEndMeeting(): boolean {
    if (this.state.phase !== "discussion") return false;
    const available = this.members().filter(
      (m) => m.status !== "failed" && m.status !== "retrying" && m.status !== "forming",
    );
    return available.length > 0 && available.every((m) => m.turns > 0);
  }

  isLive(): boolean {
    return this.state.phase === "forming" || this.state.phase === "discussion";
  }

  // ------------------------------------------------------- chair: selection

  toggleMember(persona: PersonaSummary): ActionResult {
    if (!this.isChair()) return err("NOT_ALLOWED", "Only the meeting chair can change the board.");
    if (this.state.phase !== "selecting" && this.state.phase !== "briefing") {
      return err("NOT_ALLOWED", "The board is locked once the meeting starts.");
    }
    const selected = this.state.board.some((p) => p.slug === persona.slug);
    if (selected) {
      this.update((s) => ({ ...s, board: s.board.filter((p) => p.slug !== persona.slug), notice: null }));
      return { ok: true };
    }
    if (this.state.board.length >= MAX_BOARD_SIZE) {
      this.notify(`A board seats at most ${MAX_BOARD_SIZE} members. Deselect someone to add ${persona.shortName}.`);
      return err("LIMIT", `At most ${MAX_BOARD_SIZE} members.`);
    }
    this.update((s) => ({ ...s, board: [...s.board, persona], notice: null }));
    return { ok: true };
  }

  isSelected(slug: string): boolean {
    return this.state.board.some((p) => p.slug === slug);
  }

  goToBriefing(): ActionResult {
    if (!this.isChair()) return err("NOT_ALLOWED", "Only the meeting chair can brief the board.");
    if (this.state.phase !== "selecting") return err("NOT_ALLOWED", "Not selecting.");
    if (this.state.board.length < MIN_BOARD_SIZE) {
      return err("LIMIT", `Select at least ${MIN_BOARD_SIZE} members.`);
    }
    this.update((s) => ({ ...s, phase: "briefing", notice: null }));
    return { ok: true };
  }

  backToSelection(): ActionResult {
    if (!this.isChair()) return err("NOT_ALLOWED", "Only the meeting chair can change the board.");
    if (this.state.phase !== "briefing") return err("NOT_ALLOWED", "Not briefing.");
    this.update((s) => ({ ...s, phase: "selecting", notice: null }));
    return { ok: true };
  }

  setBriefing(text: string): void {
    if (!this.isChair()) return;
    if (this.state.phase !== "selecting" && this.state.phase !== "briefing") return;
    this.update((s) => ({ ...s, briefing: text.slice(0, MAX_BRIEFING_CHARACTERS) }));
  }

  useExampleBriefing(): void {
    this.setBriefing(DEMO_BRIEFING);
  }

  notify(text: string): void {
    this.update((s) => ({ ...s, notice: { id: nextId("n"), text } }));
  }

  clearNotice(): void {
    if (this.state.notice) this.update((s) => ({ ...s, notice: null }));
  }

  // ------------------------------------------------------- chair: meeting

  startMeeting(): ActionResult {
    if (!this.isChair()) return err("NOT_ALLOWED", "Only the meeting chair can start the meeting.");
    if (this.state.phase !== "briefing" && this.state.phase !== "selecting") {
      return err("NOT_ALLOWED", "Meeting already started.");
    }
    if (!this.canStart()) {
      return err("INVALID_INPUT", "Select 3–6 members and write a briefing first.");
    }
    const now = Date.now();
    const members: Record<string, MemberParticipant> = {};
    this.state.board.forEach((persona, seat) => {
      members[persona.slug] = {
        role: "member",
        id: persona.slug,
        persona,
        seat,
        status: "forming",
        turns: 0,
        position: null,
        positionUpdate: null,
        reaction: null,
        urgency: 0,
        lastError: null,
        retries: 0,
      };
    });
    const started: EventEntry = {
      kind: "event",
      id: nextId("ev"),
      event: "meeting-started",
      text: `Meeting called to order. ${this.state.board.map((p) => p.name).join(", ")} are forming independent positions.`,
      ts: now,
    };
    this.update((s) => ({
      ...s,
      phase: "forming",
      members,
      transcript: [started],
      queue: [],
      startedAt: now,
      notice: null,
    }));
    this.emit({ type: "start" });
    return { ok: true };
  }

  setChairComposing(composing: boolean): void {
    if (this.state.chairComposing === composing) return;
    this.update((s) => ({ ...s, chairComposing: composing }));
    this.emit({ type: "compose", composing });
  }

  /** Chair speaks to the room. An @mention makes that member the next speaker. */
  sendChairMessage(text: string): ActionResult<{ mentioned: string | null }> {
    if (!this.isChair()) return err("NOT_ALLOWED", "Only the meeting chair can speak as the chair.");
    const trimmed = text.trim();
    if (!trimmed) return err("INVALID_INPUT", "Empty message.");
    if (trimmed.length > MAX_CHAIR_MESSAGE_CHARACTERS) {
      return err("INVALID_INPUT", `Keep messages under ${MAX_CHAIR_MESSAGE_CHARACTERS.toLocaleString()} characters.`);
    }
    if (!this.isLive()) return err("NOT_ALLOWED", "The meeting is not in session.");
    const mentioned = this.parseMention(trimmed);
    const entry = this.pushMessage({
      speakerId: "chair",
      speakerRole: "chair",
      speakerName: "You",
      text: trimmed,
      addressedTo: mentioned?.id ?? "board",
      addressedName: mentioned?.persona.name ?? null,
      intent: mentioned ? "question" : "context",
    });
    this.enqueue("chair-message", mentioned?.id ?? null, entry.id);
    this.update((s) => ({ ...s, chairComposing: false }));
    return { ok: true, mentioned: mentioned?.id ?? null };
  }

  openInvitePanel(): void {
    if (!this.isChair()) return;
    this.update((s) => ({ ...s, invitePanelOpen: true }));
  }

  closeInvitePanel(): void {
    this.update((s) => ({ ...s, invitePanelOpen: false }));
  }

  /** Only the chair (UI) may call this. WebMCP must never expose it. */
  endMeeting(): ActionResult {
    if (!this.isChair()) return err("NOT_ALLOWED", "Only the meeting chair can end the meeting.");
    if (this.state.phase === "forming") {
      return err("NOT_ALLOWED", "Wait for the board to finish forming its opening positions.");
    }
    if (this.state.phase !== "discussion") return err("NOT_ALLOWED", "The meeting is not in session.");
    if (!this.canEndMeeting()) {
      return err("NOT_ALLOWED", "Wait until every available board member has spoken once.");
    }
    const now = Date.now();
    this.update((s) => ({
      ...s,
      phase: "closing",
      queue: [],
      invitePanelOpen: false,
      endedAt: now,
      readoutStatus: "generating",
      transcript: [
        ...s.transcript.map((e) =>
          e.kind === "synthesis" && e.streaming
            ? { ...e, streaming: false, failed: true, text: e.text || "Synthesis cancelled: the chair ended the meeting." }
            : e,
        ),
        {
          kind: "event",
          id: nextId("ev"),
          event: "meeting-ending",
          text: "The chair has ended the discussion. Collecting closing comments.",
          ts: now,
        } satisfies EventEntry,
      ],
    }));
    this.emit({ type: "end" });
    return { ok: true };
  }

  retryMember(memberId: string): ActionResult {
    if (!this.isChair()) return err("NOT_ALLOWED", "Only the meeting chair can retry a board member.");
    const m = this.member(memberId);
    if (!m) return err("NOT_FOUND", "No such member.");
    this.emit({ type: "retry", memberId });
    return { ok: true };
  }

  reset(): void {
    this.state = createInitialState();
    this.chairKey = null;
    this.authority = "chair";
    this.applyingRemote = false;
    this.roomRevision = 0;
    this.seenRoomInputIds.clear();
    this.mutationVersion += 1;
    for (const l of this.listeners) l();
    this.emit({ type: "reset" });
  }

  // ----------------------------------------------------------- guest (WebMCP)

  /** Read-only snapshot for inspect_board_meeting. No side effects. */
  inspect(): {
    phase: MeetingPhase;
    briefing: string;
    board: { id: string; name: string; role: string; status: MemberStatus; turns: number }[];
    participants: { id: string; name: string; role: string }[];
    guest: { name: string; status: GuestStatus } | null;
    transcriptCount: number;
    readoutReady: boolean;
  } {
    const s = this.state;
    return {
      phase: s.phase,
      briefing: s.briefing,
      board: this.members().map((m) => ({
        id: m.id,
        name: m.persona.name,
        role: m.persona.role,
        status: m.status,
        turns: m.turns,
      })),
      participants: [
        { id: "chair", name: "You (chair)", role: "chair" },
        ...this.members().map((m) => ({ id: m.id, name: m.persona.name, role: "member" })),
        ...(s.guest && s.guest.status !== "empty"
          ? [{ id: "guest", name: s.guest.name, role: "guest" }]
          : []),
      ],
      guest: s.guest ? { name: s.guest.name, status: s.guest.status } : null,
      transcriptCount: s.transcript.length,
      readoutReady: s.readoutStatus === "ready" && !!s.readout,
    };
  }

  joinGuest(name: string, animate = true): ActionResult<{ name: string; seat: string }> {
    const display = (name ?? "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
    if (!display) return err("INVALID_INPUT", "Provide the display name you know yourself by.");
    const lower = display.toLowerCase();
    const reserved = ["you", "chair", "the chair", "system", "secretary", "board", "host", "moderator"];
    const taken = this.members().flatMap((m) => [m.persona.name, m.persona.shortName, m.persona.mention, m.id]).map((n) => n.toLowerCase());
    if (reserved.includes(lower) || taken.includes(lower)) {
      return err("INVALID_INPUT", `"${display}" is a name already used in this room. Join under the name you know yourself by (for example your product name).`);
    }
    if (!this.isLive()) {
      return err("NOT_AVAILABLE", `The meeting is ${this.state.phase}; guests can join only during an active meeting.`);
    }
    if (this.state.guest && this.state.guest.status !== "empty") {
      return err("ALREADY_JOINED", `${this.state.guest.name} already holds the guest seat. One external agent per meeting.`);
    }
    const now = Date.now();
    this.update((s) => ({
      ...s,
      guest: { role: "guest", id: "guest", name: display, status: animate ? "joining" : "joined", joinedAt: now },
      invitePanelOpen: false,
      transcript: [
        ...s.transcript,
        {
          kind: "event",
          id: nextId("ev"),
          event: "guest-joined",
          text: `${display} joined the meeting through WebMCP and took the guest seat.`,
          ts: now,
        } satisfies EventEntry,
      ],
    }));
    if (animate) {
      // The seat transitions joining -> joined after a short beat so the UI can animate.
      setTimeout(() => {
        if (this.state.guest?.status === "joining") this.setGuestStatus("joined");
      }, 900);
    }
    return { ok: true, name: display, seat: "guest" };
  }

  guestContribute(text: string): ActionResult<{ entryId: string }> {
    const trimmed = (text ?? "").trim();
    if (!trimmed) return err("INVALID_INPUT", "Contribution text is empty.");
    if (trimmed.length > 1200) return err("INVALID_INPUT", "Keep contributions under 1,200 characters.");
    const guard = this.requireGuest();
    if (guard) return guard;
    const entry = this.pushMessage({
      speakerId: "guest",
      speakerRole: "guest",
      speakerName: this.state.guest!.name,
      text: trimmed,
      addressedTo: "board",
      addressedName: null,
      intent: "context",
    });
    this.setGuestStatus("contributing");
    this.enqueue("guest-context", null, entry.id);
    return { ok: true, entryId: entry.id };
  }

  guestAddress(memberRef: string, text: string): ActionResult<{ entryId: string; memberId: string; memberName: string }> {
    const trimmed = (text ?? "").trim();
    if (!trimmed) return err("INVALID_INPUT", "Question text is empty.");
    if (trimmed.length > 800) return err("INVALID_INPUT", "Keep questions under 800 characters.");
    const guard = this.requireGuest();
    if (guard) return guard;
    const member = this.resolveMember(memberRef ?? "");
    if (!member) {
      return err(
        "NOT_FOUND",
        `No board member matches "${memberRef}". Members: ${this.members().map((m) => m.persona.name).join(", ")}.`,
      );
    }
    const entry = this.pushMessage({
      speakerId: "guest",
      speakerRole: "guest",
      speakerName: this.state.guest!.name,
      text: trimmed,
      addressedTo: member.id,
      addressedName: member.persona.name,
      intent: "question",
    });
    this.setGuestStatus("asking");
    this.enqueue("guest-address", member.id, entry.id);
    return { ok: true, entryId: entry.id, memberId: member.id, memberName: member.persona.name };
  }

  requestSynthesis(requestedBy: "chair" | "guest"): ActionResult<{ entryId: string }> {
    if (!this.isLive()) return err("NOT_AVAILABLE", "Synthesis is available only during an active meeting.");
    if (requestedBy === "guest") {
      const guard = this.requireGuest();
      if (guard) return guard;
    }
    const name = requestedBy === "guest" ? this.state.guest!.name : "You";
    const now = Date.now();
    const entry: SynthesisEntry = {
      kind: "synthesis",
      id: nextId("syn"),
      requestedBy,
      requestedByName: name,
      text: "",
      streaming: true,
      failed: false,
      ts: now,
    };
    this.update((s) => ({
      ...s,
      transcript: [
        ...s.transcript,
        {
          kind: "event",
          id: nextId("ev"),
          event: "synthesis-requested",
          text: `${name} asked the secretary for a synthesis of the discussion so far.`,
          ts: now,
        } satisfies EventEntry,
        entry,
      ],
    }));
    this.enqueue("synthesis-request", null, entry.id);
    return { ok: true, entryId: entry.id };
  }

  /** Readout accessor used by the UI copy action and the WebMCP tool. */
  getReadout(): ActionResult<{ readout: Readout }> {
    if (this.state.readoutStatus === "ready" && this.state.readout) {
      return { ok: true, readout: this.state.readout };
    }
    if (this.state.phase === "closing") {
      return err("NOT_READY", "The chair has ended the meeting; the readout is being generated. Try again in a few seconds.");
    }
    return err("NOT_READY", "The readout does not exist yet. It is produced after the human chair ends the meeting.");
  }

  markReadoutRetrievedByGuest(): void {
    const now = Date.now();
    this.update((s) => ({
      ...s,
      readoutRetrievedByGuestAt: now,
      transcript: [
        ...s.transcript,
        {
          kind: "event",
          id: nextId("ev"),
          event: "readout-retrieved",
          text: `${s.guest?.name ?? "The external agent"} retrieved the executive readout.`,
          ts: now,
        } satisfies EventEntry,
      ],
    }));
  }

  private requireGuest(): ActionFailure | null {
    if (!this.isLive()) return err("NOT_AVAILABLE", "The meeting is not in session.");
    if (!this.state.guest || this.state.guest.status === "empty") {
      return err("NOT_ALLOWED", "Join the meeting first with join_board_meeting.");
    }
    return null;
  }

  // ------------------------------------------------------ engine mutators

  engineSetPhase(phase: MeetingPhase): void {
    this.update((s) => ({ ...s, phase }));
  }

  engineSetMember(id: string, patch: Partial<Omit<MemberParticipant, "id" | "role" | "persona" | "seat">>): void {
    this.update((s) => {
      const m = s.members[id];
      if (!m) return;
      return { ...s, members: { ...s.members, [id]: { ...m, ...patch } } };
    });
  }

  engineSetMemberStatus(id: string, status: MemberStatus): void {
    this.engineSetMember(id, { status });
  }

  engineSetPosition(id: string, position: OpeningPosition): void {
    this.engineSetMember(id, { position, status: "ready", lastError: null });
  }

  engineSetReaction(id: string, reaction: Reaction | null, urgency: number): void {
    this.update((s) => {
      const m = s.members[id];
      if (!m) return;
      const status: MemberStatus =
        m.status === "speaking" || m.status === "retrying" || m.status === "failed" || m.status === "forming"
          ? m.status
          : reaction && (reaction.kind === "disagree" || reaction.kind === "concern")
            ? "reacting"
            : urgency >= 7
              ? "wants-to-respond"
              : "ready";
      return { ...s, members: { ...s.members, [id]: { ...m, reaction, urgency, status } } };
    });
  }

  engineClearReactions(): void {
    this.update((s) => {
      const members: Record<string, MemberParticipant> = {};
      for (const [id, m] of Object.entries(s.members)) {
        members[id] = {
          ...m,
          reaction: null,
          status: m.status === "reacting" || m.status === "wants-to-respond" ? "ready" : m.status,
        };
      }
      return { ...s, members };
    });
  }

  setGuestStatus(status: GuestStatus): void {
    this.update((s) => (s.guest ? { ...s, guest: { ...s.guest, status } } : s));
  }

  engineAddEvent(event: SystemEventKind, text: string): EventEntry {
    const entry: EventEntry = { kind: "event", id: nextId("ev"), event, text, ts: Date.now() };
    this.update((s) => ({ ...s, transcript: [...s.transcript, entry] }));
    return entry;
  }

  /** Begin a streaming member message. Only one may stream at a time. */
  engineBeginMessage(
    memberId: string,
    opts: { addressedTo: string | "board"; addressedName: string | null; intent: MessageIntent; interruption: boolean },
  ): MessageEntry {
    const m = this.member(memberId);
    if (!m) throw new Error(`Unknown member ${memberId}`);
    if (this.state.streamingEntryId) throw new Error("Another message is already streaming.");
    const entry: MessageEntry = {
      kind: "message",
      id: nextId("m"),
      speakerId: memberId,
      speakerRole: "member",
      speakerName: m.persona.name,
      text: "",
      addressedTo: opts.addressedTo,
      addressedName: opts.addressedName,
      intent: opts.intent,
      streaming: true,
      interruption: opts.interruption,
      failed: false,
      ts: Date.now(),
    };
    this.update((s) => ({
      ...s,
      streamingEntryId: entry.id,
      transcript: [...s.transcript, entry],
      members: { ...s.members, [memberId]: { ...m, status: "speaking", reaction: null } },
    }));
    return entry;
  }

  engineAppendDelta(entryId: string, delta: string): void {
    if (!delta) return;
    this.update((s) => ({
      ...s,
      transcript: s.transcript.map((e) =>
        e.id === entryId && (e.kind === "message" || e.kind === "synthesis") ? { ...e, text: e.text + delta } : e,
      ),
    }));
  }

  engineSetText(entryId: string, text: string): void {
    this.update((s) => ({
      ...s,
      transcript: s.transcript.map((e) =>
        e.id === entryId && (e.kind === "message" || e.kind === "synthesis") ? { ...e, text } : e,
      ),
    }));
  }

  /** Finish a streaming message. If `failed` and the text is empty, the entry is removed (no duplicate partials). */
  engineEndMessage(entryId: string, opts: { failed?: boolean; positionUpdate?: string | null } = {}): void {
    this.update((s) => {
      const entry = s.transcript.find((e) => e.id === entryId);
      if (!entry || entry.kind !== "message") return { ...s, streamingEntryId: null };
      const failed = !!opts.failed;
      const remove = failed && entry.text.trim().length === 0;
      const transcript = remove
        ? s.transcript.filter((e) => e.id !== entryId)
        : s.transcript.map((e) => (e.id === entryId ? { ...e, streaming: false, failed } : e));
      const m = s.members[entry.speakerId];
      const members = m
        ? {
            ...s.members,
            [entry.speakerId]: {
              ...m,
              status: failed ? "retrying" : "ready",
              turns: failed ? m.turns : m.turns + 1,
              positionUpdate: opts.positionUpdate ?? m.positionUpdate,
            } satisfies MemberParticipant,
          }
        : s.members;
      return { ...s, transcript, members, streamingEntryId: null };
    });
  }

  engineEndSynthesis(entryId: string, opts: { failed?: boolean; text?: string } = {}): void {
    this.update((s) => ({
      ...s,
      transcript: s.transcript.map((e) =>
        e.id === entryId && e.kind === "synthesis"
          ? { ...e, streaming: false, failed: !!opts.failed, text: opts.text ?? e.text }
          : e,
      ),
    }));
  }

  engineDequeue(id: string): void {
    this.update((s) => ({ ...s, queue: s.queue.filter((q) => q.id !== id) }));
  }

  engineSetClosingComments(comments: ClosingComment[]): void {
    this.update((s) => ({ ...s, closingComments: comments }));
  }

  engineSetReadout(readout: Readout | null, status: ReadoutStatus): void {
    this.update((s) => ({
      ...s,
      readout,
      readoutStatus: status,
      phase: status === "ready" ? "readout" : s.phase,
    }));
  }

  // ---------------------------------------------------------------- private

  private pushMessage(
    fields: Omit<MessageEntry, "kind" | "id" | "ts" | "streaming" | "interruption" | "failed">,
  ): MessageEntry {
    const entry: MessageEntry = {
      kind: "message",
      id: nextId("m"),
      ts: Date.now(),
      streaming: false,
      interruption: false,
      failed: false,
      ...fields,
    };
    this.update((s) => ({ ...s, transcript: [...s.transcript, entry] }));
    return entry;
  }

  private enqueue(kind: QueuedInputKind, mention: string | null, entryId: string | null): QueuedInput {
    const input: QueuedInput = { id: nextId("q"), kind, mention, entryId, ts: Date.now() };
    this.update((s) => ({ ...s, queue: [...s.queue, input] }));
    this.emit({ type: "input", input });
    return input;
  }
}

type ActionFailure = Extract<ActionResult, { ok: false }>;
type ActionResultErrorCode = ActionFailure["error"]["code"];

function err(code: ActionResultErrorCode, message: string): ActionFailure {
  return { ok: false, error: { code, message } };
}

export function isEntryStreaming(e: TranscriptEntry): boolean {
  return (e.kind === "message" || e.kind === "synthesis") && e.streaming;
}
