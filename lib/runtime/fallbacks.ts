import { getMember } from "../catalog";
import type { ClosingComment, ExecutiveReadout, OpeningPosition, TranscriptEvent } from "../types";

/** The chair's question, recovered from a free-form briefing without a model call. */
export function decisionLine(briefing: string): string {
  const trimmed = briefing.trim();
  if (!trimmed) return "An unstated decision.";
  const labelled = /^\s*question:\s*(.+)$/im.exec(trimmed);
  if (labelled) return labelled[1].trim();
  const question = trimmed.split("\n").find((line) => line.trim().endsWith("?"));
  if (question) return question.trim();
  const firstLine = trimmed.split("\n")[0].trim();
  return firstLine.length > 200 ? `${firstLine.slice(0, 197)}…` : firstLine;
}

/**
 * A private opening position used only when a member's own call fails twice. It is never
 * read out; it exists so a failed seat can still take part instead of freezing the room.
 */
export function localOpeningPosition(slug: string, briefing: string): OpeningPosition {
  const name = getMember(slug)?.name ?? slug;
  return {
    memberId: slug,
    recommendation: `Hold the decision until the load-bearing claim behind it is tested.`,
    reasoning: `${name} has not been able to form a full position on "${decisionLine(briefing)}" yet and will rely on the room.`,
    concern: "Acting on a number nobody in this room has verified.",
    question: "What single piece of evidence would settle this?",
  };
}

function bullets(events: TranscriptEvent[], limit: number): string[] {
  return events
    .filter((event) => event.kind === "message" && !event.failed)
    .slice(-limit)
    .map((event) => `${event.speakerName}: ${event.text.replace(/\s+/g, " ").trim()}`);
}

/**
 * Assembled from the transcript when the secretary fails twice. Deliberately does not
 * summarise: it attributes and preserves, so nothing is invented on the way out.
 */
export function fallbackReadout(
  briefing: string,
  transcript: TranscriptEvent[],
  closingComments: ClosingComment[],
): ExecutiveReadout {
  const said = bullets(transcript, 12);
  const questions = transcript
    .filter((event) => event.kind === "message" && event.text.includes("?"))
    .flatMap((event) =>
      event.text
        .split(/(?<=\?)\s+/)
        .filter((sentence) => sentence.trim().endsWith("?"))
        .map((sentence) => `${event.speakerName}: ${sentence.trim()}`),
    )
    .slice(-5);

  return {
    decision: decisionLine(briefing),
    recommendation:
      "The secretary could not synthesise this meeting, so no recommendation is being asserted on the board's behalf. What the room actually said is recorded below, with every closing comment intact.",
    divided: true,
    options: [],
    tradeoffs: [],
    assumptions: [],
    openQuestions: questions,
    nextActions: [],
    closingComments,
    fallback: true,
    transcriptDigest: said,
  };
}
