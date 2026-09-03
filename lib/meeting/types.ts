/**
 * Shared meeting contract — FROZEN.
 *
 * Every module (UI, orchestration engine, model runtime, WebMCP tools, readout)
 * builds against these types. Do not edit without the orchestrator's approval.
 */

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

/** Catalog metadata for a board member (mirrors agent/subagents/<slug>/persona.json). */
export interface PersonaSummary {
  slug: string;
  name: string;
  shortName: string;
  /** Token the chair types after "@" to call on this member (e.g. "Daniel", "DHH"). */
  mention: string;
  role: string;
  company: string;
  /** Public path, e.g. "/portraits/daniel-ek.webp". */
  portrait: string;
  episodeUrl: string;
  episodeDate: string;
  lenses: string[];
  searchTerms: string[];
  voiceSample: string;
}

export const MIN_BOARD_SIZE = 3;
export const MAX_BOARD_SIZE = 6;

// ---------------------------------------------------------------------------
// Phases and participants
// ---------------------------------------------------------------------------

export type MeetingPhase =
  | "selecting"
  | "briefing"
  | "forming" // opening positions being generated in parallel
  | "discussion"
  | "closing" // End Meeting clicked; closing comments + readout generating
  | "readout";

export type ParticipantRole = "chair" | "member" | "guest";

export type MemberStatus =
  | "idle"
  | "forming"
  | "ready"
  | "speaking"
  | "wants-to-respond"
  | "reacting"
  | "retrying"
  | "failed";

export type GuestStatus =
  | "empty"
  | "joining"
  | "joined"
  | "contributing"
  | "asking";

export type ReactionKind = "agree" | "disagree" | "concern" | "curious";

export interface Reaction {
  kind: ReactionKind;
  /** Participant id the reaction is aimed at (usually the last speaker). */
  toId: string;
  at: number;
}

export interface OpeningPosition {
  recommendation: string;
  reasoning: string;
  concern: string;
  question: string;
}

export interface MemberParticipant {
  role: "member";
  /** Equals persona.slug. */
  id: string;
  persona: PersonaSummary;
  /** 0-based seat index around the table, in selection order. */
  seat: number;
  status: MemberStatus;
  /** Number of public turns spoken so far. */
  turns: number;
  position: OpeningPosition | null;
  /** Latest position update stated publicly, if any. */
  positionUpdate: string | null;
  reaction: Reaction | null;
  /** Model-reported urgency to speak next (0–10), refreshed after each turn. */
  urgency: number;
  lastError: string | null;
  retries: number;
}

export interface GuestParticipant {
  role: "guest";
  id: "guest";
  /** Display name supplied by the external agent itself. */
  name: string;
  status: GuestStatus;
  joinedAt: number;
}

export interface ChairParticipant {
  role: "chair";
  id: "chair";
  name: "You";
}

export type Participant = ChairParticipant | MemberParticipant | GuestParticipant;

// ---------------------------------------------------------------------------
// Transcript
// ---------------------------------------------------------------------------

export type MessageIntent =
  | "statement"
  | "answer"
  | "rebuttal"
  | "question"
  | "context"
  | "update"
  | "closing";

export interface MessageEntry {
  kind: "message";
  id: string;
  speakerId: string; // "chair" | "guest" | member slug
  speakerRole: ParticipantRole;
  speakerName: string;
  text: string;
  /** Participant id this message is addressed to, or "board" for everyone. */
  addressedTo: string | "board";
  addressedName: string | null;
  intent: MessageIntent;
  /** True while the text is still streaming in. */
  streaming: boolean;
  /** True when this turn was prioritized as an interruption/rebuttal of the previous speaker. */
  interruption: boolean;
  /** True if the model call failed mid-stream; the partial text is kept but flagged. */
  failed: boolean;
  ts: number;
}

export type SystemEventKind =
  | "meeting-started"
  | "positions-ready"
  | "guest-joined"
  | "synthesis-requested"
  | "meeting-ending"
  | "meeting-ended"
  | "readout-retrieved"
  | "member-retrying"
  | "member-unavailable"
  | "notice";

export interface EventEntry {
  kind: "event";
  id: string;
  event: SystemEventKind;
  text: string;
  ts: number;
}

export interface SynthesisEntry {
  kind: "synthesis";
  id: string;
  /** Participant id who requested it ("guest" or "chair"). */
  requestedBy: string;
  requestedByName: string;
  text: string;
  streaming: boolean;
  failed: boolean;
  ts: number;
}

export type TranscriptEntry = MessageEntry | EventEntry | SynthesisEntry;

// ---------------------------------------------------------------------------
// Queue (inputs waiting for the engine)
// ---------------------------------------------------------------------------

export type QueuedInputKind =
  | "chair-message" // chair spoke; may carry a mention
  | "guest-context" // guest contributed context
  | "guest-address" // guest addressed a member
  | "synthesis-request";

export interface QueuedInput {
  id: string;
  kind: QueuedInputKind;
  /** Member slug that must speak next, if the input names one. */
  mention: string | null;
  /** Transcript entry id created for this input (message already appended). */
  entryId: string | null;
  ts: number;
}

// ---------------------------------------------------------------------------
// Readout
// ---------------------------------------------------------------------------

export interface ClosingComment {
  memberId: string;
  memberName: string;
  text: string;
  /** True when the closing-comment call failed and the text is the member's last substantive statement. */
  fallback: boolean;
}

export interface Readout {
  decision: string;
  recommendation: {
    summary: string;
    /** True when the board did not converge. */
    divided: boolean;
    detail: string;
  };
  options: string[];
  tradeoffs: string[];
  assumptions: string[];
  openQuestions: string[];
  nextActions: string[];
  closingComments: ClosingComment[];
  generatedAt: number;
  /** True when the secretary call failed and this was assembled deterministically. */
  fallback: boolean;
}

export type ReadoutStatus = "idle" | "generating" | "ready" | "failed";

// ---------------------------------------------------------------------------
// Meeting state (single source of truth; lives only in the page)
// ---------------------------------------------------------------------------

export interface MeetingState {
  phase: MeetingPhase;
  /** Selected personas in selection order. Locked once the meeting starts. */
  board: PersonaSummary[];
  briefing: string;
  chair: ChairParticipant;
  /** Keyed by slug; insertion order == seat order. */
  members: Record<string, MemberParticipant>;
  guest: GuestParticipant | null;
  transcript: TranscriptEntry[];
  queue: QueuedInput[];
  /** Id of the message currently streaming, if any. */
  streamingEntryId: string | null;
  /** Set while the chair is typing so the engine pauses auto-continuation. */
  chairComposing: boolean;
  /** Board members that have been asked for closing comments. */
  closingComments: ClosingComment[];
  readout: Readout | null;
  readoutStatus: ReadoutStatus;
  readoutRetrievedByGuestAt: number | null;
  invitePanelOpen: boolean;
  /** Non-fatal notice for the UI (e.g. "Seventh member not allowed"). */
  notice: { id: string; text: string } | null;
  /** Wall-clock when the meeting started. */
  startedAt: number | null;
  endedAt: number | null;
}

// ---------------------------------------------------------------------------
// Runtime contract (model calls). Implemented by the live runtime (API routes)
// and by the deterministic mock runtime used in tests and fixtures.
// ---------------------------------------------------------------------------

export interface TranscriptLine {
  speakerId: string;
  speakerName: string;
  role: ParticipantRole | "system";
  text: string;
  addressedName: string | null;
}

export interface MemberContext {
  slug: string;
  briefing: string;
  phase: MeetingPhase;
  /** Compact public transcript (all entries so far, in order). */
  transcript: TranscriptLine[];
  /** This member's own private opening position. Never another member's. */
  position: OpeningPosition | null;
  /** This member's own prior public statements. */
  ownStatements: string[];
  /** Names and one-line roles of the other participants (for addressing by name). */
  participants: { id: string; name: string; role: ParticipantRole; line: string }[];
}

export type TurnDirective =
  | { type: "open" } // first public contribution
  | { type: "continue" } // free-flowing contribution
  | { type: "answer"; fromId: string; fromName: string; question: string } // direct @mention / guest address
  | { type: "rebut"; targetId: string; targetName: string }; // disagreement flagged by reaction pass

export interface TurnInput extends MemberContext {
  directive: TurnDirective;
  /** Fresh context contributed by chair/guest since this member last spoke. */
  newContext: string[];
}

export interface TurnMeta {
  /** Member declares a changed/qualified position, stated publicly. */
  positionUpdate: string | null;
  /** Participant id the member mainly addressed, if any. */
  addressedId: string | null;
  /** True if the member asked the chair a question. */
  askedChair: boolean;
}

export interface TurnResult {
  text: string;
  meta: TurnMeta;
}

export interface ReactInput extends MemberContext {
  /** The message just spoken by someone else. */
  lastSpeakerId: string;
  lastSpeakerName: string;
  lastText: string;
}

export interface ReactResult {
  reaction: ReactionKind | null;
  /** 0–10 desire to speak next. */
  urgency: number;
  /** True when the member has a material rebuttal to the last speaker. */
  wantsToRebut: boolean;
}

export interface ClosingInput extends MemberContext {}

export interface SynthesisInput {
  briefing: string;
  transcript: TranscriptLine[];
  requestedByName: string;
}

export interface ReadoutInput {
  briefing: string;
  transcript: TranscriptLine[];
  members: { id: string; name: string; role: string }[];
  closingComments: ClosingComment[];
  guestName: string | null;
}

export interface BoardRuntime {
  openingPosition(input: MemberContext, signal: AbortSignal): Promise<OpeningPosition>;
  turn(
    input: TurnInput,
    signal: AbortSignal,
    onDelta: (delta: string) => void,
  ): Promise<TurnResult>;
  react(input: ReactInput, signal: AbortSignal): Promise<ReactResult>;
  closingComment(input: ClosingInput, signal: AbortSignal): Promise<string>;
  synthesis(
    input: SynthesisInput,
    signal: AbortSignal,
    onDelta: (delta: string) => void,
  ): Promise<string>;
  readout(input: ReadoutInput, signal: AbortSignal): Promise<Readout>;
}

// ---------------------------------------------------------------------------
// WebMCP tool names — FROZEN (spec §11.3)
// ---------------------------------------------------------------------------

export const WEBMCP_TOOL_NAMES = [
  "inspect_board_meeting",
  "join_board_meeting",
  "contribute_to_board_meeting",
  "address_board_member",
  "request_board_synthesis",
  "get_board_meeting_readout",
] as const;

export type WebMcpToolName = (typeof WEBMCP_TOOL_NAMES)[number];

/** Result shape returned by every shared session action (and thus every WebMCP tool). */
export type ActionResult<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | { ok: false; error: { code: ActionErrorCode; message: string } };

export type ActionErrorCode =
  | "INVALID_INPUT"
  | "NOT_ALLOWED"
  | "NOT_AVAILABLE"
  | "NOT_FOUND"
  | "NOT_READY"
  | "ALREADY_JOINED"
  | "LIMIT";

// ---------------------------------------------------------------------------
// Demo fixture (spec §3.2)
// ---------------------------------------------------------------------------

export const DEMO_BOARD_SLUGS = [
  "daniel-ek",
  "david-heinemeier-hansson",
  "lulu-cheng-meservey",
] as const;

export const DEMO_BRIEFING = `Should our B2B collaboration app eliminate its free tier and replace it with a 14-day trial?

We are an 18-person seed-stage company at $1.6M ARR. We have 6,000 free workspaces and 420 paying customers. Only 2.3% of free workspaces convert within 90 days, and free users generate 38% of support tickets. However, 34% of current paying customers first discovered us through a free workspace. We want faster growth and a simpler product, but we are worried about weakening word of mouth.`;
