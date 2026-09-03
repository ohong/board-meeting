import { openai } from "@ai-sdk/openai";

export const lowReasoning = { openai: { reasoningEffort: "none" as const } };
/** The readout is a one-shot document; a little reasoning improves faithfulness at acceptable latency. */
export const readoutReasoning = { openai: { reasoningEffort: "low" as const } };

export function boardModel() {
  return openai(process.env.BOARD_MODEL || "gpt-5.6-terra");
}

export function fastBoardModel() {
  return openai(process.env.BOARD_FAST_MODEL || "gpt-5.6-luna");
}

export function readoutModel() {
  return openai(process.env.BOARD_READOUT_MODEL || "gpt-5.6-sol");
}

export function missingApiKeyResponse(): Response | null {
  return process.env.OPENAI_API_KEY
    ? null
    : Response.json(
        { error: "OPENAI_API_KEY is not configured. Use ?runtime=mock for the deterministic demo." },
        { status: 503 },
      );
}
