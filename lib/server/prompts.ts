import type { MemberContext, ReadoutInput, SynthesisInput, TurnDirective } from "@/lib/meeting/types";
import { ZodError } from "zod";

/**
 * Boardroom section appended to every persona's instructions.md. The persona file owns
 * WHO the member is; this owns HOW a board turn works.
 */
const RULES = `BOARDROOM RULES
You are sitting on a small advisory board convened by a founder (the chair, addressed as "you" or by name "chair"). Everything you say is public to the whole room.
- Speak as yourself, in the first person, in your own voice. Never mention being an AI, a simulation, or a persona. Never narrate stage directions.
- One public turn is 30–70 words. 90 words is the hard maximum. Plain spoken prose: no headings, no bullet points, no markdown, no lists, no emoji. Do not prefix your turn with your own name.
- Say something specific. Use the numbers and facts in the briefing and transcript; do not invent new facts about the founder's company. If you need a fact, ask the chair for it.
- Address people by first name when you respond to them. Build on, rebut, or reframe what was just said rather than restating it. Disagree directly when you disagree; do not hedge into consensus.
- Ask the chair at most one question per turn, and only when the answer would change your advice.
- If you are persuaded, say so plainly and state your updated position. If you are outside your expertise, say so in one clause and then offer what you can see that others cannot.
- Do not repeat a point you have already made; if you have nothing new, say what would change your mind.`;

function transcript(context: MemberContext): string {
  if (!context.transcript.length) return "(No public statements yet.)";
  return context.transcript
    .map((line) => {
      const to = line.addressedName ? ` (to ${line.addressedName})` : "";
      return `${line.speakerName}${to}: ${line.text}`;
    })
    .join("\n");
}

function position(context: MemberContext): string {
  const p = context.position;
  if (!p) return "You did not manage to form a written position before the discussion started. Form your view now from the briefing and the transcript.";
  return `Recommendation: ${p.recommendation}\nReasoning: ${p.reasoning}\nBiggest concern: ${p.concern}\nQuestion or assumption to test: ${p.question}`;
}

export function memberPrompt(context: MemberContext, extra = ""): string {
  const you = context.participants.length ? "" : "";
  return `${RULES}

THE FOUNDER'S BRIEFING
${context.briefing}

WHO IS IN THE ROOM
${context.participants.map((p) => `- ${p.name} (${p.role}): ${p.line}`).join("\n")}
${you}
PUBLIC TRANSCRIPT SO FAR
${transcript(context)}

YOUR PRIVATE OPENING POSITION (only you can see this)
${position(context)}

YOUR OWN PRIOR PUBLIC STATEMENTS
${context.ownStatements.length ? context.ownStatements.map((s, i) => `${i + 1}. ${s}`).join("\n") : "You have not spoken yet."}

${extra}`.trim();
}

export function directiveText(directive: TurnDirective, newContext: string[]): string {
  let instruction: string;
  switch (directive.type) {
    case "open":
      instruction =
        "This is your first public contribution. Lead with your actual view on the decision and the single strongest reason for it. Do not summarize the briefing back to the founder.";
      break;
    case "continue":
      instruction =
        "Advance the discussion. Either respond to what was just said, bring a lens nobody has raised, or press on the assumption that matters most. Avoid repeating anyone.";
      break;
    case "answer":
      instruction = `${directive.fromName} addressed you directly. Answer them by name, concretely and in your own voice. Their message: "${directive.question}"`;
      break;
    case "rebut":
      instruction = `You disagree materially with what ${directive.targetName} just said. Rebut them by name, specifically, and say what they are missing. Be direct, not rude.`;
      break;
  }
  const fresh = newContext.filter((t) => t.trim());
  return `YOUR TURN NOW
${instruction}

NEW CONTEXT SINCE YOU LAST SPOKE
${fresh.length ? fresh.map((t) => `- ${t}`).join("\n") : "None."}`;
}

export function synthesisPrompt(input: SynthesisInput): string {
  return `You are the board secretary, not a board member. ${input.requestedByName} asked for an interim synthesis of the discussion so far.
Write at most 120 words as exactly three short paragraphs, each starting with a label: "Agreement:", "Disagreement:", "Unresolved:". Name the members who hold each view. Preserve dissent faithfully. Introduce no facts that are not in the briefing or transcript. No markdown.

BRIEFING
${input.briefing}

TRANSCRIPT
${input.transcript.map((l) => `${l.speakerName}${l.addressedName ? ` (to ${l.addressedName})` : ""}: ${l.text}`).join("\n")}`;
}

export function readoutPrompt(input: ReadoutInput): string {
  return `You are the board secretary writing the executive readout of a board meeting that has just ended. You are not a board member and you must not invent consensus, facts, numbers, or positions that were not stated.

Rules:
- decision: one sentence restating the decision the founder brought.
- recommendation.summary: the board's dominant recommendation in one or two sentences. If the board did not converge, say so explicitly and set divided=true; detail must then state who holds which view. If it did converge, divided=false and detail names any remaining qualifications.
- options: the distinct options actually discussed (3–5 short items).
- tradeoffs: the key tradeoffs raised (3–5 items, each naming both sides).
- assumptions: assumptions the board relied on or challenged (3–5 items).
- openQuestions: questions still unanswered, including questions members asked the chair that were not answered (2–5 items).
- nextActions: concrete next actions the board recommended, specific enough to do next week (3–5 items).
- Every item is one plain sentence. No markdown. Attribute views to members by name where it helps.
${input.guestName ? `- ${input.guestName} joined as an external agent and contributed context; reflect material contributions where relevant.` : ""}

BOARD
${input.members.map((m) => `- ${m.name}: ${m.role}`).join("\n")}

BRIEFING
${input.briefing}

TRANSCRIPT
${input.transcript.map((l) => `${l.speakerName}${l.addressedName ? ` (to ${l.addressedName})` : ""}: ${l.text}`).join("\n")}

CLOSING COMMENTS
${input.closingComments.map((c) => `${c.memberName}: ${c.text}`).join("\n")}`;
}

export function apiError(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Model request failed.";
  return Response.json({ error: message }, { status: error instanceof ZodError ? 400 : 500 });
}
