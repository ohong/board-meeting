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

/** Browser calls from this app are same-origin; reject casual cross-site scripts that would burn the model key. */
export function rejectCrossOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    if (host && new URL(origin).host === host) return null;
  } catch {
    // fall through
  }
  return Response.json({ error: "Cross-origin requests to the board API are not allowed." }, { status: 403 });
}

export function missingApiKeyResponse(): Response | null {
  return process.env.OPENAI_API_KEY
    ? null
    : Response.json(
        { error: "OPENAI_API_KEY is not configured. Use ?runtime=mock for the deterministic demo." },
        { status: 503 },
      );
}
