import type { ExecutiveReadout } from "./types";

function section(title: string, items: string[]): string[] {
  if (!items.length) return [];
  return ["", title, ...items.map((item) => `- ${item}`)];
}

/** The plain-text readout. The Copy readout button and the WebMCP tool share this. */
export function formatReadout(readout: ExecutiveReadout): string {
  return [
    "THE BEST BOARD MEETING YOU'VE EVER HAD",
    "Executive readout",
    "",
    "DECISION UNDER DISCUSSION",
    readout.decision,
    "",
    "BOARD RECOMMENDATION",
    readout.recommendation,
    readout.divided
      ? "The board remained divided. That division is preserved above rather than resolved."
      : "The board was aligned.",
    ...section("OPTIONS CONSIDERED", readout.options),
    ...section("KEY TRADEOFFS", readout.tradeoffs),
    ...section("IMPORTANT ASSUMPTIONS", readout.assumptions),
    ...section("OPEN QUESTIONS", readout.openQuestions),
    ...section("RECOMMENDED NEXT ACTIONS", readout.nextActions),
    ...section("ON THE RECORD", readout.transcriptDigest ?? []),
    "",
    "CLOSING COMMENTS BY BOARD MEMBER",
    ...readout.closingComments.map((comment) => `- ${comment.name}: ${comment.comment}`),
  ].join("\n");
}
