import { streamText } from "ai";
import { getPersona } from "@/lib/server/personas";
import { boardModel, lowReasoning, missingApiKeyResponse, rejectCrossOrigin } from "@/lib/server/models";
import { memberPrompt, directiveText, apiError } from "@/lib/server/prompts";
import { turnSchema } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;
const DEFAULT_META = '<<<META>>>{"positionUpdate":null,"addressedId":null,"askedChair":false}';

export async function POST(request: Request) {
  const denied = rejectCrossOrigin(request); if (denied) return denied;
  const missing = missingApiKeyResponse(); if (missing) return missing;
  try {
    const input = turnSchema.parse(await request.json());
    const persona = await getPersona(input.slug);
    if (!persona) return Response.json({ error: `Unknown persona: ${input.slug}` }, { status: 404 });
    const result = streamText({ model: boardModel(), system: persona.instructions, prompt: `${memberPrompt(input, directiveText(input))}\n\nEnd with one line exactly: <<<META>>>{"positionUpdate":string|null,"addressedId":string|null,"askedChair":boolean}`, maxOutputTokens: 240, providerOptions: lowReasoning, abortSignal: request.signal });
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({ async start(controller) {
      let full = "";
      try {
        for await (const delta of result.textStream) { full += delta; controller.enqueue(encoder.encode(delta)); }
        if (!full.includes("<<<META>>>")) controller.enqueue(encoder.encode(`\n${DEFAULT_META}`));
        controller.close();
      } catch (error) { controller.error(error); }
    }});
    return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  } catch (error) { return apiError(error); }
}
