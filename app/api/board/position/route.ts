import { generateText, Output } from "ai";
import { getPersona } from "@/lib/server/personas";
import { boardModel, lowReasoning, missingApiKeyResponse } from "@/lib/server/models";
import { memberPrompt, apiError } from "@/lib/server/prompts";
import { memberContextSchema, openingPositionSchema } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const missing = missingApiKeyResponse(); if (missing) return missing;
  try {
    const input = memberContextSchema.parse(await request.json());
    const persona = await getPersona(input.slug);
    if (!persona) return Response.json({ error: `Unknown persona: ${input.slug}` }, { status: 404 });
    const result = await generateText({ model: boardModel(), system: persona.instructions, prompt: memberPrompt(input, "Form your private provisional position on the decision. Each field is ONE sentence in your own voice, specific to this briefing: recommendation, the central reasoning, your most important concern, and one question or assumption worth testing."), output: Output.object({ schema: openingPositionSchema }), maxOutputTokens: 200, providerOptions: lowReasoning, abortSignal: request.signal });
    return Response.json(result.output);
  } catch (error) { return apiError(error); }
}
