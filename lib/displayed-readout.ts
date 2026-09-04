import type { ExecutiveReadout, TranscriptEvent } from "./types";

export const NONE_RECORDED = "None recorded";

type ReadoutDisplayState = {
  members: readonly { name: string }[];
  guest: { readonly name: string | null };
  transcript: readonly Pick<TranscriptEvent, "createdAt">[];
};

type ReadoutDisplayContext = {
  meetingDate: string;
  participants: readonly string[];
};

export type DisplayedReadout = ReadoutDisplayContext & {
  readoutText: string;
};

const MEETING_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Los_Angeles",
});

export function deriveReadoutDisplayContext(
  state: ReadoutDisplayState,
): ReadoutDisplayContext {
  let meetingStartedAt: number | undefined;

  for (const event of state.transcript) {
    if (!Number.isFinite(event.createdAt)) continue;
    if (meetingStartedAt === undefined || event.createdAt < meetingStartedAt) {
      meetingStartedAt = event.createdAt;
    }
  }

  if (meetingStartedAt === undefined) {
    throw new Error("Cannot display a readout without a meeting timestamp.");
  }

  return {
    meetingDate: MEETING_DATE_FORMAT.format(new Date(meetingStartedAt)),
    participants: [
      "You (chair)",
      ...state.members.map((member) => member.name),
      ...(state.guest.name ? [`${state.guest.name} (guest agent)`] : []),
    ],
  };
}

export function formatDisplayedReadout(
  readout: ExecutiveReadout,
  context: ReadoutDisplayContext,
): string {
  const section = (title: string, items: readonly string[]) => [
    title,
    ...(items.length ? items.map((item) => `- ${item}`) : [NONE_RECORDED]),
  ];

  return [
    "Board readout",
    `Meeting date: ${context.meetingDate}`,
    `Participants: ${context.participants.join(", ")}`,
    "",
    "Decision under discussion",
    readout.decision || NONE_RECORDED,
    "",
    "Board recommendation",
    readout.recommendation || NONE_RECORDED,
    readout.divided ? "The board remains divided." : "The board is aligned.",
    "",
    ...section("Options considered", readout.options),
    "",
    ...section("Key tradeoffs", readout.tradeoffs),
    "",
    ...section("Important assumptions", readout.assumptions),
    "",
    ...section("Open questions", readout.openQuestions),
    "",
    ...section("Recommended next actions", readout.nextActions),
    "",
    "Closing comments by board member",
    ...(readout.closingComments.length
      ? readout.closingComments.map(
          (comment) => `- ${comment.name}: ${comment.comment || NONE_RECORDED}`,
        )
      : [NONE_RECORDED]),
  ].join("\n");
}

export function createDisplayedReadout(
  readout: ExecutiveReadout,
  state: ReadoutDisplayState,
): DisplayedReadout {
  const context = deriveReadoutDisplayContext(state);
  return {
    ...context,
    readoutText: formatDisplayedReadout(readout, context),
  };
}
