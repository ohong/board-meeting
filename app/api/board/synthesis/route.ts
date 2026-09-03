import { streamText } from "ai";
import { readoutModel, lowReasoning, missingApiKeyResponse, rejectCrossOrigin } from "@/lib/server/models";
import { synthesisPrompt, SECRETARY_SYSTEM, apiError } from "@/lib/server/prompts";
import { synthesisSchema } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const denied = rejectCrossOrigin(request); if (denied) return denied;
  const missing = missingApiKeyResponse(); if (missing) return missing;
  try {
    const input = synthesisSchema.parse(await request.json());
    const result = streamText({ model: readoutModel(), system: SECRETARY_SYSTEM, prompt: synthesisPrompt(input), maxOutputTokens: 180, providerOptions: lowReasoning, abortSignal: request.signal });
    return new Response(result.textStream.pipeThrough(new TextEncoderStream()), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
