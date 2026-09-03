import { createLiveRuntime, hasLiveKey } from "@/lib/runtime/live";
import type { ReadoutInput, RuntimeTurnInput, SynthesisInput, TurnCapability } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const NO_KEY =
  "OPENAI_API_KEY is not set. Add it to the environment to seat live board members. The room falls back to a deterministic mock without one.";

type Body = {
  capability: TurnCapability;
  input: RuntimeTurnInput | SynthesisInput | ReadoutInput;
};

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

/**
 * One endpoint for every board-agent capability. `publicTurn` answers as a text/event-stream
 * so the room can watch a member speak; the rest answer as JSON. Each request carries the
 * meeting context it needs — the page stays the source of truth and no session lives here.
 */
export async function POST(request: Request) {
  if (!hasLiveKey()) return jsonError(NO_KEY, 503);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return jsonError("Malformed request body.", 400);
  }

  const board = createLiveRuntime();

  if (body.capability === "publicTurn" || body.capability === "answerDirect") {
    const input = body.input as RuntimeTurnInput;
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };
        try {
          const turn = await board.publicTurn(input, (delta) => send("delta", { delta }));
          send("done", turn);
        } catch (error) {
          send("error", { error: error instanceof Error ? error.message : "The turn failed." });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      },
    });
  }

  try {
    let result: unknown;
    switch (body.capability) {
      case "formOpeningPosition":
        result = await board.formOpeningPosition(body.input as RuntimeTurnInput);
        break;
      case "closingComment":
        result = await board.closingComment(body.input as RuntimeTurnInput);
        break;
      case "synthesis":
        result = await board.synthesis(body.input as SynthesisInput);
        break;
      case "readout":
        result = await board.readout(body.input as ReadoutInput);
        break;
      default:
        return jsonError("Unknown capability.", 400);
    }
    return Response.json({ ok: true, result });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "The model call failed.", 500);
  }
}
