export type Phase = "select" | "brief" | "meeting" | "readout";

export type MeetingPhase =
  | "idle"
  | "opening"
  | "discussion"
  | "ending"
  | "closed";

export type SeatStatus =
  | "thinking"
  | "ready"
  | "speaking"
  | "wants_to_respond"
  | "reconnecting";

export type GuestStatus =
  | "empty"
  | "waiting"
  | "joining"
  | "joined"
  | "contributing"
  | "asking";

export type ReactionKind = "agree" | "concern" | "disagree";

export type CatalogMember = {
  slug: string;
  name: string;
  aliases: string[];
  role: string;
  /** Short organisation name, engraved on the nameplate at the table. */
  house: string;
  initials: string;
  /** Surfaced first in the roster so the demo trio is easy to find without a hidden list. */
  featured?: boolean;
};

export type TranscriptKind = "message" | "system";

export type TranscriptEvent = {
  id: string;
  kind: TranscriptKind;
  speakerId: string;
  speakerName: string;
  text: string;
  /** Name of the participant this contribution is directed at, if any. */
  addressedTo?: string;
  reaction?: ReactionKind;
  /** True while the text is still streaming in. */
  streaming?: boolean;
  /** Set when a turn ended badly, so the row can be marked instead of silently truncated. */
  failed?: boolean;
  createdAt: number;
};

export type OpeningPosition = {
  memberId: string;
  recommendation: string;
  reasoning: string;
  concern: string;
  question: string;
};

/** Orchestration metadata a member emits alongside their spoken turn. */
export type TurnDirectives = {
  /** Who the member is speaking to: a member name, the chair ("You"), or the guest. */
  addressedTo?: string;
  /** A visible reaction to what was just said. */
  reaction?: ReactionKind;
  /** The member this speaker wants to hear from next — a request for the floor on their behalf. */
  wantsToRespond?: string;
};

export type MemberTurn = TurnDirectives & {
  text: string;
};

export type ClosingComment = {
  memberId: string;
  name: string;
  comment: string;
};

export type ExecutiveReadout = {
  decision: string;
  recommendation: string;
  divided: boolean;
  options: string[];
  tradeoffs: string[];
  assumptions: string[];
  openQuestions: string[];
  nextActions: string[];
  closingComments: ClosingComment[];
  /** Set when synthesis failed twice and the memo was assembled from the transcript. */
  fallback?: boolean;
  /** Verbatim contributions, shown only on the fallback path so the memo is never blank. */
  transcriptDigest?: string[];
};

export type TurnCapability =
  | "formOpeningPosition"
  | "publicTurn"
  | "answerDirect"
  | "closingComment"
  | "synthesis"
  | "readout";

export type RuntimeTurnInput = {
  capability: TurnCapability;
  memberId: string;
  memberName: string;
  briefing: string;
  phase: MeetingPhase;
  /** The public transcript. Never contains another member's private opening position. */
  transcript: TranscriptEvent[];
  privatePosition?: OpeningPosition;
  ownPriorStatements: string[];
  /** Present on answerDirect: who asked, and what they asked. */
  addressedTo?: string;
  prompt?: string;
  boardNames: string[];
};

export type SynthesisInput = Omit<RuntimeTurnInput, "memberId" | "memberName">;

export type ReadoutInput = {
  briefing: string;
  transcript: TranscriptEvent[];
  closingComments: ClosingComment[];
  boardNames: string[];
};

export type BoardRuntime = {
  id: "mock" | "live";
  formOpeningPosition(input: RuntimeTurnInput): Promise<OpeningPosition>;
  /**
   * Streams one public turn. `onDelta` receives text as it arrives; the resolved value
   * carries the full text plus the orchestration directives the member emitted.
   */
  publicTurn(
    input: RuntimeTurnInput,
    onDelta?: (delta: string) => void,
  ): Promise<MemberTurn>;
  closingComment(input: RuntimeTurnInput): Promise<string>;
  synthesis(input: SynthesisInput): Promise<string>;
  readout(input: ReadoutInput): Promise<ExecutiveReadout>;
};
