export type Phase = "select" | "brief" | "meeting" | "readout";

export type MeetingPhase =
  | "idle"
  | "opening"
  | "discussion"
  | "ending"
  | "closed";

export type SeatStatus =
  | "idle"
  | "thinking"
  | "ready"
  | "speaking"
  | "wants_to_respond"
  | "reacting"
  | "reconnecting";

export type GuestStatus =
  | "empty"
  | "waiting"
  | "joining"
  | "joined"
  | "contributing"
  | "asking";

export type ReactionKind = "agree" | "concern" | "disagree" | "want_to_respond";

export type CatalogMember = {
  slug: string;
  name: string;
  aliases: string[];
  role: string;
  initials: string;
  featured?: boolean;
};

export type Participant = {
  id: string;
  slug?: string;
  name: string;
  role: string;
  initials: string;
  kind: "chair" | "member" | "guest";
  status: SeatStatus | GuestStatus;
};

export type TranscriptKind = "message" | "system" | "reaction";

export type TranscriptEvent = {
  id: string;
  kind: TranscriptKind;
  speakerId: string;
  speakerName: string;
  text: string;
  addressedTo?: string;
  reaction?: ReactionKind;
  createdAt: number;
};

export type OpeningPosition = {
  memberId: string;
  recommendation: string;
  reasoning: string;
  concern: string;
  question: string;
};

export type MemberTurn = {
  text: string;
  addressedTo?: string;
  reaction?: ReactionKind;
  reactionFrom?: string;
  wantsToRespond?: string;
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
  transcript: TranscriptEvent[];
  privatePosition?: OpeningPosition;
  ownPriorStatements: string[];
  addressedTo?: string;
  prompt?: string;
  boardNames: string[];
};

export type BoardRuntime = {
  id: "mock" | "live";
  formOpeningPosition(input: RuntimeTurnInput): Promise<OpeningPosition>;
  publicTurn(input: RuntimeTurnInput): Promise<MemberTurn>;
  closingComment(input: RuntimeTurnInput): Promise<string>;
  synthesis(input: Omit<RuntimeTurnInput, "memberId" | "memberName">): Promise<string>;
  readout(input: {
    briefing: string;
    transcript: TranscriptEvent[];
    closingComments: ClosingComment[];
    boardNames: string[];
  }): Promise<ExecutiveReadout>;
};
