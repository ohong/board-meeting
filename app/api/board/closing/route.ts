import { generateText } from "ai";
import { getPersona } from "@/lib/server/personas";
import { boardModel, lowReasoning, missingApiKeyResponse } from "@/lib/server/models";
import { memberPrompt, apiError } from "@/lib/server/prompts";
import { closingCommentSchema } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const missing = missingApiKeyResponse(); if (missing) return missing;
  try {
    const input = closingCommentSchema.parse(await request.json()); const persona = await getPersona(input.slug);
    if (!persona) return Response.json({ error: `Unknown persona: ${input.slug}` }, { status: 404 });
    const result = await generateText({ model: boardModel(), system: persona.instructions, prompt: memberPrompt(input, "Give one closing comment of at most 60 words: your most important recommendation, concern, or next action."), maxOutputTokens: 100, providerOptions: lowReasoning, abortSignal: request.signal });
    return Response.json({ text: result.text.trim() });
  } catch (error) { return apiError(error); }
}
