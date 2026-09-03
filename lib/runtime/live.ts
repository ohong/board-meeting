import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getPersona, SECRETARY_INSTRUCTIONS } from "../personas";
import { createMockRuntime } from "./mock";
import type {
  BoardRuntime,
  ClosingComment,
  ExecutiveReadout,
  MemberTurn,
  OpeningPosition,
  RuntimeTurnInput,
  TranscriptEvent,
} from "../types";

const MEMBER_MODEL = "gpt-5.6-luna";
const SECRETARY_MODEL = "gpt-5.6-terra";

export function hasLiveKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function transcriptBlock(events: TranscriptEvent[]): string {
  return events
    .slice(-24)
    .map((e) => `${e.speakerName}: ${e.text}`)
    .join("\n");
}

async function complete(model: string, system: string, prompt: string): Promise<string> {
  const result = await generateText({
    model: openai(model),
    system,
    prompt,
    maxOutputTokens: 400,
  });
  return result.text.trim();
}

export function createLiveRuntime(): BoardRuntime {
  const mock = createMockRuntime();
  return {
    id: "live",
    async formOpeningPosition(input) {
      const persona = getPersona(input.memberId);
      const raw = await complete(
        MEMBER_MODEL,
        persona.instructions,
        `The chair's decision briefing:\n${input.briefing}\n\nForm a PRIVATE opening position. Other members will not see this. Reply as JSON with keys recommendation, reasoning, concern, question. Be specific. No more than 80 words per field.`,
      );
      try {
        const jsonStart = raw.indexOf("{");
        const json = JSON.parse(raw.slice(jsonStart)) as OpeningPosition;
        return {
          memberId: input.memberId,
          recommendation: String(json.recommendation ?? raw),
          reasoning: String(json.reasoning ?? ""),
          concern: String(json.concern ?? ""),
          question: String(json.question ?? ""),
        };
      } catch {
        return {
          memberId: input.memberId,
          recommendation: raw.slice(0, 280),
          reasoning: raw,
          concern: "Could not parse structured concern.",
          question: "What fact would change your mind?",
        };
      }
    },
    async publicTurn(input) {
      const persona = getPersona(input.memberId);
      const prompt = `Briefing:\n${input.briefing}\n\nYour private opening position (do not dump it; use it):\n${JSON.stringify(input.privatePosition ?? {})}\n\nPublic transcript:\n${transcriptBlock(input.transcript)}\n\n${input.prompt ? `You are being addressed: ${input.prompt}` : "Take the next public turn."}\nSpeak 30-70 words. Max 90.`;
      const text = await complete(MEMBER_MODEL, persona.instructions, prompt);
      return { text } satisfies MemberTurn;
    },
    async closingComment(input) {
      const persona = getPersona(input.memberId);
      return complete(
        MEMBER_MODEL,
        persona.instructions,
        `Briefing:\n${input.briefing}\n\nTranscript:\n${transcriptBlock(input.transcript)}\n\nGive a closing comment: most important recommendation, unresolved concern, or next action. 40-70 words.`,
      );
    },
    async synthesis(input) {
      return complete(
        SECRETARY_MODEL,
        SECRETARY_INSTRUCTIONS,
        `Briefing:\n${input.briefing}\n\nTranscript:\n${transcriptBlock(input.transcript)}\n\nWrite a concise interim synthesis with: current agreement; current disagreement; the most important unresolved question.`,
      );
    },
    async readout(input) {
      const raw = await complete(
        SECRETARY_MODEL,
        SECRETARY_INSTRUCTIONS,
        `Briefing:\n${input.briefing}\n\nTranscript:\n${transcriptBlock(input.transcript)}\n\nClosing comments:\n${input.closingComments.map((c) => `${c.name}: ${c.comment}`).join("\n")}\n\nReturn JSON with keys: decision, recommendation, divided (boolean), options (string[]), tradeoffs (string[]), assumptions (string[]), openQuestions (string[]), nextActions (string[]). Do not invent facts.`,
      );
      try {
        const jsonStart = raw.indexOf("{");
        const parsed = JSON.parse(raw.slice(jsonStart)) as ExecutiveReadout;
        return {
          decision: String(parsed.decision),
          recommendation: String(parsed.recommendation),
          divided: Boolean(parsed.divided),
          options: parsed.options ?? [],
          tradeoffs: parsed.tradeoffs ?? [],
          assumptions: parsed.assumptions ?? [],
          openQuestions: parsed.openQuestions ?? [],
          nextActions: parsed.nextActions ?? [],
          closingComments: input.closingComments,
        };
      } catch {
        return mock.readout(input);
      }
    },
  };
}

export function createRuntime(): BoardRuntime {
  return hasLiveKey() ? createLiveRuntime() : createMockRuntime();
}
