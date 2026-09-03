/**
 * Section-level helpers for serving the executive readout over WebMCP.
 *
 * The FULL document comes from `components/readout/readout-text.ts` — the same
 * function behind the human "Copy readout" button — so the agent and the human copy
 * byte-identical text (spec §15.2). Only the per-section slicing (needed when the
 * whole readout exceeds one tool result) lives here.
 */

import { readoutToText } from "@/components/readout/readout-text";
import type { Readout } from "@/lib/meeting/types";

export { readoutToText };

export const READOUT_SECTIONS = [
  "decision",
  "recommendation",
  "options",
  "tradeoffs",
  "assumptions",
  "open_questions",
  "next_actions",
  "closing_comments",
] as const;

export type ReadoutSection = (typeof READOUT_SECTIONS)[number];
export type ReadoutSectionArg = ReadoutSection | "all";

function bullets(items: string[]): string {
  if (!items.length) return "(none recorded)";
  return items.map((item) => `- ${item.trim()}`).join("\n");
}

function numbered(items: string[]): string {
  if (!items.length) return "(none recorded)";
  return items.map((item, i) => `${i + 1}. ${item.trim()}`).join("\n");
}

/** One section of the readout as plain text, without its heading. */
export function readoutSectionBody(readout: Readout, section: ReadoutSection): string {
  switch (section) {
    case "decision":
      return readout.decision.trim();
    case "recommendation": {
      const lines = [readout.recommendation.summary.trim()];
      if (readout.recommendation.detail.trim()) lines.push(readout.recommendation.detail.trim());
      return lines.join("\n");
    }
    case "options":
      return bullets(readout.options);
    case "tradeoffs":
      return bullets(readout.tradeoffs);
    case "assumptions":
      return bullets(readout.assumptions);
    case "open_questions":
      return bullets(readout.openQuestions);
    case "next_actions":
      return numbered(readout.nextActions);
    case "closing_comments":
      return readout.closingComments.length
        ? readout.closingComments.map((c) => `${c.memberName}: ${c.text.trim()}`).join("\n")
        : "(none recorded)";
  }
}

export function readoutSectionHeading(readout: Readout, section: ReadoutSection): string {
  switch (section) {
    case "decision":
      return "DECISION";
    case "recommendation":
      return readout.recommendation.divided
        ? "RECOMMENDATION (board divided)"
        : "RECOMMENDATION";
    case "options":
      return "OPTIONS CONSIDERED";
    case "tradeoffs":
      return "TRADEOFFS";
    case "assumptions":
      return "ASSUMPTIONS";
    case "open_questions":
      return "OPEN QUESTIONS";
    case "next_actions":
      return "NEXT ACTIONS";
    case "closing_comments":
      return "CLOSING COMMENTS";
  }
}

/** One section rendered with its heading. */
export function readoutSectionToText(readout: Readout, section: ReadoutSection): string {
  return `${readoutSectionHeading(readout, section)}\n${readoutSectionBody(readout, section)}`;
}

/**
 * The readout assembled from the per-section helpers, optionally omitting sections
 * that do not fit one tool result. With every section it must stay byte-identical to
 * `readoutToText`; tests/webmcp-tools.test.ts asserts that.
 */
export function readoutFromSections(
  readout: Readout,
  sections: readonly ReadoutSection[] = READOUT_SECTIONS,
): string {
  return sections.map((section) => readoutSectionToText(readout, section)).join("\n\n");
}

/** Short summary used when the full readout does not fit in one tool result. */
export function readoutSummary(readout: Readout): string {
  const parts = [
    readout.recommendation.divided
      ? `Board divided. ${readout.recommendation.summary.trim()}`
      : readout.recommendation.summary.trim(),
  ];
  const firstAction = readout.nextActions[0]?.trim();
  if (firstAction) parts.push(`First next action: ${firstAction}`);
  const firstQuestion = readout.openQuestions[0]?.trim();
  if (firstQuestion) parts.push(`Top open question: ${firstQuestion}`);
  return parts.join(" ");
}
