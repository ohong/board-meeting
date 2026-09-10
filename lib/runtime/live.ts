import { streamText, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { memberSystemPrompt, modelFor, secretarySystemPrompt } from "../personas";
import { localOpeningPosition } from "./fallbacks";
import { consumeTurnStream } from "./turn-stream";
import {
  closingCommentPrompt,
  openingPositionPrompt,
  parseControlLine,
  publicTurnPrompt,
  readoutPrompt,
  synthesisPrompt,
} from "./prompts";
import type {
  BoardRuntime,
  ExecutiveReadout,
  OpeningPosition,
  ReadoutInput,
  SynthesisInput,
} from "../types";

export function hasLiveKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * eve declares models in AI Gateway form ("openai/gpt-5.6-luna"). The OpenAI provider
 * wants the bare model id, so the provider prefix is stripped here and nowhere else —
 * the subagent package stays the single place a model is chosen.
 */
function bareModelId(gatewayId: string): string {
  return gatewayId.replace(/^openai\//, "");
}

/**
 * Built on first use rather than at module load, so the key and base URL are read when a
 * request runs. That matters on serverless, and it lets the live path be driven against a
 * stub server in tests. `OPENAI_BASE_URL` also covers proxies and compatible gateways.
 */
let provider: ReturnType<typeof createOpenAI> | undefined;
let providerKey: string | undefined;

function model(gatewayId: string) {
  const key = `${process.env.OPENAI_API_KEY ?? ""}|${process.env.OPENAI_BASE_URL ?? ""}`;
  if (!provider || providerKey !== key) {
    provider = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? "",
      ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
    });
    providerKey = key;
  }
  return provider(bareModelId(gatewayId));
}

async function complete(
  gatewayId: string,
  system: string,
  prompt: string,
  maxOutputTokens: number,
): Promise<string> {
  const result = await generateText({
    model: model(gatewayId),
    system,
    prompt,
    maxOutputTokens,
  });
  return result.text.trim();
}

/** Pulls the first JSON object out of a model reply that may carry stray prose. */
function extractJson<T>(raw: string): T {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object in model output.");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
}

export function createLiveRuntime(): BoardRuntime {
  return {
    id: "live",

    async formOpeningPosition(input) {
      const raw = await complete(
        modelFor(input.memberId),
        memberSystemPrompt(input.memberId),
        openingPositionPrompt(input),
        600,
      );
      try {
        const parsed = extractJson<Partial<OpeningPosition>>(raw);
        const position: OpeningPosition = {
          memberId: input.memberId,
          recommendation: String(parsed.recommendation ?? "").trim(),
          reasoning: String(parsed.reasoning ?? "").trim(),
          concern: String(parsed.concern ?? "").trim(),
          question: String(parsed.question ?? "").trim(),
        };
        if (!position.recommendation) throw new Error("Empty recommendation.");
        return position;
      } catch {
        // The position is private scaffolding, not a visible artefact. A degraded one is
        // far better than a seat that never becomes ready.
        return { ...localOpeningPosition(input.memberId, input.briefing), reasoning: raw.slice(0, 400) };
      }
    },

    async publicTurn(input, onDelta) {
      // streamText reports transport and API errors through onError and then ends the
      // stream rather than throwing. Without capturing it, a failed call arrives as an
      // empty turn — which the meeting engine reads as the member choosing to pass, so the
      // seat would go quiet with no error, no retry and nothing on screen.
      let streamFailure: unknown;
      const result = streamText({
        model: model(modelFor(input.memberId)),
        system: memberSystemPrompt(input.memberId),
        prompt: publicTurnPrompt(input),
        maxOutputTokens: 400,
        onError: ({ error }) => {
          streamFailure = error;
        },
      });

      const turn = await consumeTurnStream(result.textStream, onDelta);
      if (streamFailure) {
        throw streamFailure instanceof Error ? streamFailure : new Error(String(streamFailure));
      }
      return turn;
    },

    async closingComment(input) {
      const raw = await complete(
        modelFor(input.memberId),
        memberSystemPrompt(input.memberId),
        closingCommentPrompt(input),
        400,
      );
      const { rest } = parseControlLine(raw);
      const text = rest.trim();
      if (!text) throw new Error("The closing comment came back empty.");
      return text;
    },

    async synthesis(input: SynthesisInput) {
      const text = await complete(
        modelFor("secretary"),
        secretarySystemPrompt(),
        synthesisPrompt(input),
        400,
      );
      if (!text) throw new Error("The synthesis came back empty.");
      return text;
    },

    async readout(input: ReadoutInput) {
      const raw = await complete(
        modelFor("secretary"),
        secretarySystemPrompt(),
        readoutPrompt(input),
        1600,
      );
      const parsed = extractJson<Record<string, unknown>>(raw);
      const readout: ExecutiveReadout = {
        decision: String(parsed.decision ?? "").trim(),
        recommendation: String(parsed.recommendation ?? "").trim(),
        divided: Boolean(parsed.divided),
        options: asStringArray(parsed.options),
        tradeoffs: asStringArray(parsed.tradeoffs),
        assumptions: asStringArray(parsed.assumptions),
        openQuestions: asStringArray(parsed.openQuestions),
        nextActions: asStringArray(parsed.nextActions),
        closingComments: input.closingComments,
      };
      if (!readout.recommendation || !readout.decision) {
        throw new Error("The readout was missing required sections.");
      }
      return readout;
    },
  };
}
