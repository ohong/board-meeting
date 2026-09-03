import { generateText, Output } from "ai";
import { readoutModel, readoutReasoning, missingApiKeyResponse, rejectCrossOrigin } from "@/lib/server/models";
import { readoutPrompt, SECRETARY_SYSTEM, apiError } from "@/lib/server/prompts";
import { readoutInputSchema, readoutSchema } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const denied = rejectCrossOrigin(request); if (denied) return denied;
  const missing = missingApiKeyResponse(); if (missing) return missing;
  try {
    const input = readoutInputSchema.parse(await request.json());
    const result = await generateText({ model: readoutModel(), system: SECRETARY_SYSTEM, prompt: readoutPrompt(input), output: Output.object({ schema: readoutSchema }), providerOptions: readoutReasoning, abortSignal: request.signal });
    return Response.json({ ...result.output, closingComments: input.closingComments, generatedAt: Date.now(), fallback: false });
  } catch (error) { return apiError(error); }
}
