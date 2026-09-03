import { generateText, Output } from "ai";
import { getPersona } from "@/lib/server/personas";
import { fastBoardModel, lowReasoning, missingApiKeyResponse } from "@/lib/server/models";
import { memberPrompt, apiError } from "@/lib/server/prompts";
import { reactSchema, reactResultSchema } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;
const neutral = { reaction: null, urgency: 0, wantsToRebut: false } as const;

export async function POST(request: Request) {
  const missing = missingApiKeyResponse(); if (missing) return missing;
  try {
    const input = reactSchema.parse(await request.json());
    const results = await Promise.all(input.members.map(async ({ slug, context }) => {
      try {
        const persona = await getPersona(slug); if (!persona) return { slug, ...neutral };
        const result = await generateText({ model: fastBoardModel(), system: persona.instructions, prompt: memberPrompt(context, `React silently to ${input.lastSpeakerName}: ${input.lastText}\nSet urgency 0–10 and wantsToRebut only for a material disagreement.`), output: Output.object({ schema: reactResultSchema }), providerOptions: lowReasoning, abortSignal: request.signal });
        return { slug, ...result.output };
      } catch { return { slug, ...neutral }; }
    }));
    return Response.json(results);
  } catch (error) { return apiError(error); }
}
