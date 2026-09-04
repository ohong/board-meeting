import { generateText } from "ai";
import { getPersona } from "@/lib/server/personas";
import { boardModel, lowReasoning, missingApiKeyResponse, rejectCrossOrigin } from "@/lib/server/models";
import { closingPrompt, apiError } from "@/lib/server/prompts";
import { closingCommentSchema } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const denied = rejectCrossOrigin(request); if (denied) return denied;
  const missing = missingApiKeyResponse(); if (missing) return missing;
  try {
    const input = closingCommentSchema.parse(await request.json()); const persona = await getPersona(input.slug);
    if (!persona) return Response.json({ error: `Unknown persona: ${input.slug}` }, { status: 404 });
    const result = await generateText({ model: boardModel(), system: persona.instructions, prompt: closingPrompt(input), maxOutputTokens: 130, providerOptions: lowReasoning, abortSignal: request.signal });
    return Response.json({ text: result.text.trim() });
  } catch (error) { return apiError(error); }
}
