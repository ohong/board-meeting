import type { ExecutiveReadout } from "./types";

export function formatReadout(readout: ExecutiveReadout): string {
  const lines = [
    "Executive readout",
    "",
    "Decision under discussion",
    readout.decision,
    "",
    "Board recommendation",
    readout.recommendation,
    readout.divided ? "The board remains divided." : "The board is aligned.",
    "",
    "Options considered",
    ...readout.options.map((o) => `- ${o}`),
    "",
    "Key tradeoffs",
    ...readout.tradeoffs.map((o) => `- ${o}`),
    "",
    "Important assumptions",
    ...readout.assumptions.map((o) => `- ${o}`),
    "",
    "Open questions",
    ...readout.openQuestions.map((o) => `- ${o}`),
    "",
    "Recommended next actions",
    ...readout.nextActions.map((o) => `- ${o}`),
    "",
    "Closing comments by board member",
    ...readout.closingComments.map((c) => `- ${c.name}: ${c.comment}`),
  ];
  return lines.join("\n");
}
