import type {
  ReactionKind,
  ReadoutInput,
  RuntimeTurnInput,
  SynthesisInput,
  TranscriptEvent,
  TurnDirectives,
} from "../types";

/**
 * A member's turn opens with one bracketed control line, then the spoken turn. The control
 * line is orchestration metadata — who they are answering, how they are reacting, who they
 * want to hear from next — so reactions and interruptions cost no extra model call.
 */
export const CONTROL_LINE_SPEC = `Reply in exactly this shape and nothing else:

Line 1, a control line: [to: <name or ->; reaction: agree|concern|disagree|none; next: <name or ->]
Line 2 onward: what you say out loud at the table.

- "to" is the person you are speaking to: a board member's name, "You" for the chair, the
  guest agent's name, or "-" for the whole room.
- "reaction" is your honest reaction to the previous speaker. Use "none" if you had none.
- "next" is the one person you most want to answer you. Use "-" if you are not calling
  anyone out. Never name yourself.
- The spoken part is plain prose. No brackets, no markdown, no stage directions.`;

const REACTIONS: ReactionKind[] = ["agree", "concern", "disagree", "want_to_respond"];

/** Splits a member's raw output into directives and the spoken text. */
export function parseControlLine(raw: string): { directives: TurnDirectives; rest: string } {
  const match = /^\s*\[([^\]\n]*)\]\s*\n?/.exec(raw);
  if (!match) return { directives: {}, rest: raw.trim() };

  const directives: TurnDirectives = {};
  for (const part of match[1].split(";")) {
    const [rawKey, ...rawValue] = part.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rawValue.join(":").trim();
    if (!key || !value || value === "-" || value.toLowerCase() === "none") continue;
    if (key === "to") directives.addressedTo = value;
    if (key === "next") directives.wantsToRespond = value;
    if (key === "reaction") {
      const reaction = value.toLowerCase() as ReactionKind;
      if (REACTIONS.includes(reaction)) directives.reaction = reaction;
    }
  }
  return { directives, rest: raw.slice(match[0].length).trim() };
}

/** How much transcript a member sees. Enough for continuity, bounded for latency. */
const TRANSCRIPT_WINDOW = 30;

export function renderTranscript(events: TranscriptEvent[]): string {
  const visible = events.filter((e) => e.kind !== "reaction" && !e.failed).slice(-TRANSCRIPT_WINDOW);
  if (!visible.length) return "(nothing has been said yet)";
  return visible
    .map((event) => {
      if (event.kind === "system") return `— ${event.text}`;
      const to = event.addressedTo ? ` (to ${event.addressedTo})` : "";
      return `${event.speakerName}${to}: ${event.text}`;
    })
    .join("\n");
}

function positionBlock(input: RuntimeTurnInput): string {
  const position = input.privatePosition;
  if (!position) return "";
  return `\nYour private opening position, formed before anyone spoke. Nobody else can see it. Use it; do not read it out:
- Provisional recommendation: ${position.recommendation}
- Reasoning: ${position.reasoning}
- Biggest concern: ${position.concern}
- What you want tested: ${position.question}
`;
}

function ownStatementsBlock(input: RuntimeTurnInput): string {
  if (!input.ownPriorStatements.length) return "\nYou have not spoken yet. This is your first contribution.\n";
  return `\nWhat you have already said out loud (do not repeat yourself):\n${input.ownPriorStatements
    .map((s) => `- ${s}`)
    .join("\n")}\n`;
}

export function openingPositionPrompt(input: RuntimeTurnInput): string {
  return `The chair has called this board meeting and put the following decision to the table.

DECISION BRIEFING
${input.briefing}

Also at the table: ${input.boardNames.filter((n) => n !== input.memberName).join(", ") || "no one else yet"}.

Form your private opening position before anyone speaks. Nobody will see this — it exists so
the first speaker does not anchor the whole room. Be decisive; a position you would defend.

Return only a JSON object with these keys and no other text:
{
  "recommendation": "what you would do, in one sentence",
  "reasoning": "the core of why, under 60 words",
  "concern": "the thing most likely to go wrong, under 40 words",
  "question": "one question or assumption you want tested in the room, under 30 words"
}`;
}

export function publicTurnPrompt(input: RuntimeTurnInput): string {
  const others = input.boardNames.filter((n) => n !== input.memberName);
  const direct = input.prompt
    ? `\nYou have been addressed directly${
        input.addressedTo ? ` by ${input.addressedTo}` : ""
      }:\n"${input.prompt}"\n\nAnswer it head-on, in your own voice, before anything else. Do not deflect.\n`
    : "\nTake the next turn. Say the thing this room needs to hear that has not been said yet.\n";

  return `DECISION BRIEFING
${input.briefing}

At the table: ${others.join(", ") || "you alone"}. The chair is "You".
${positionBlock(input)}${ownStatementsBlock(input)}
PUBLIC TRANSCRIPT SO FAR
${renderTranscript(input.transcript)}
${direct}
${CONTROL_LINE_SPEC}`;
}

export function closingCommentPrompt(input: RuntimeTurnInput): string {
  return `DECISION BRIEFING
${input.briefing}

PUBLIC TRANSCRIPT
${renderTranscript(input.transcript)}
${positionBlock(input)}
The chair has ended the meeting and asked you for a closing comment: your single most
important recommendation, the concern you have not resolved, or the next action you would
take. 40-70 words, spoken plainly, no control line, no preamble. If the room changed your
mind, say so and say what changed it.`;
}

export function synthesisPrompt(input: SynthesisInput): string {
  return `DECISION BRIEFING
${input.briefing}

PUBLIC TRANSCRIPT
${renderTranscript(input.transcript)}

The meeting is still running. Write an interim synthesis for the room: what the board
currently agrees on, where it is genuinely divided and who holds which side, and the single
most important unresolved question. Under 90 words, no headings, no bullet characters.`;
}

export function readoutPrompt(input: ReadoutInput): string {
  return `DECISION BRIEFING
${input.briefing}

COMPLETE PUBLIC TRANSCRIPT
${input.transcript
  .filter((e) => e.kind !== "reaction" && !e.failed)
  .map((e) => (e.kind === "system" ? `— ${e.text}` : `${e.speakerName}: ${e.text}`))
  .join("\n")}

CLOSING COMMENTS
${input.closingComments.map((c) => `${c.name}: ${c.comment}`).join("\n")}

Write the executive readout. Return only a JSON object with exactly these keys:
{
  "decision": "the decision under discussion, in the chair's own terms, one sentence",
  "recommendation": "the board's recommendation. If the board is divided, say so in this text and name who held which position.",
  "divided": true or false,
  "options": ["each distinct option the board actually considered"],
  "tradeoffs": ["the tradeoffs named in the room"],
  "assumptions": ["what the board assumed rather than knew"],
  "openQuestions": ["what remains unresolved"],
  "nextActions": ["concrete next actions, most important first"]
}

Every item must be traceable to the briefing or the transcript. Invent nothing. Do not
manufacture consensus. Keep each item to one short line.`;
}
