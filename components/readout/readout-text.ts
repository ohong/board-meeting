/**
 * Plain-text rendering of the executive readout, used by the human "Copy readout"
 * action. The WebMCP workstream may import `readoutToText` from here.
 *
 * NOTE: `components/webmcp/readout-format.ts` currently carries a byte-identical
 * copy of this formatter (it shipped before this module existed). Keep the two in
 * sync, or collapse them once both workstreams have landed — spec §15.2 requires
 * the human and the agent to copy the same document.
 */

import type { Readout } from "@/lib/meeting/types";

function bullets(items: string[]): string {
  if (!items.length) return "(none recorded)";
  return items.map((item) => `- ${item.trim()}`).join("\n");
}

function numbered(items: string[]): string {
  if (!items.length) return "(none recorded)";
  return items.map((item, i) => `${i + 1}. ${item.trim()}`).join("\n");
}

export function readoutToText(readout: Readout): string {
  const recommendation = [readout.recommendation.summary.trim()];
  if (readout.recommendation.detail.trim()) recommendation.push(readout.recommendation.detail.trim());

  const sections: string[] = [
    `DECISION\n${readout.decision.trim()}`,
    `${readout.recommendation.divided ? "RECOMMENDATION (board divided)" : "RECOMMENDATION"}\n${recommendation.join("\n")}`,
    `OPTIONS CONSIDERED\n${bullets(readout.options)}`,
    `TRADEOFFS\n${bullets(readout.tradeoffs)}`,
    `ASSUMPTIONS\n${bullets(readout.assumptions)}`,
    `OPEN QUESTIONS\n${bullets(readout.openQuestions)}`,
    `NEXT ACTIONS\n${numbered(readout.nextActions)}`,
    `CLOSING COMMENTS\n${
      readout.closingComments.length
        ? readout.closingComments.map((c) => `${c.memberName}: ${c.text.trim()}`).join("\n")
        : "(none recorded)"
    }`,
  ];

  return sections.join("\n\n");
}
