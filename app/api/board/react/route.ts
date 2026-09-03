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
        const result = await generateText({ model: fastBoardModel(), system: persona.instructions, prompt: memberPrompt(context, `PRIVATE REACTION (not spoken)\n${input.lastSpeakerName} just said: "${input.lastText}"\nAs yourself, report how you react. reaction: pick "agree", "disagree", "concern", or "curious"; use null only if you genuinely have no reaction. urgency: 8–10 if you have something you must say right now, 4–7 if you would add something, 0–3 if you would let others talk. wantsToRebut: true only when you disagree with a specific claim just made and would push back on it by name.`), output: Output.object({ schema: reactResultSchema }), providerOptions: lowReasoning, abortSignal: request.signal });
        return { slug, ...result.output };
      } catch { return { slug, ...neutral }; }
    }));
    return Response.json(results);
  } catch (error) { return apiError(error); }
}
