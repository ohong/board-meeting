import { PERSONA_PACKAGES, SECRETARY_SLUG } from "@/lib/personas";
import { createLiveRuntime, hasLiveKey } from "@/lib/runtime/live";
import type { ReadoutInput, RuntimeTurnInput, SynthesisInput, TurnCapability } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const NO_KEY =
  "OPENAI_API_KEY is not set. Add it to the environment to seat live board members. The room falls back to a deterministic mock without one.";

/**
 * The page is the source of truth, so every request carries its own meeting context (§14.3)
 * and this endpoint holds no session. That means the only thing standing between a
 * deployment's key and an arbitrarily large request is what it refuses, so it bounds each
 * call to something a real board meeting could plausibly be.
 */
const LIMITS = {
  body: 256 * 1024,
  briefing: 20_000,
  prompt: 4_000,
  events: 200,
  transcript: 120_000,
};

const CAPABILITIES: TurnCapability[] = [
  "formOpeningPosition",
  "publicTurn",
  "answerDirect",
  "closingComment",
  "synthesis",
  "readout",
];

type Body = {
  capability: TurnCapability;
  input: RuntimeTurnInput | SynthesisInput | ReadoutInput;
};

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

/** Returns the reason this request is refused, or null when it is within bounds. */
function refuse(body: Body): string | null {
  if (!body || typeof body !== "object") return "Malformed request body.";
  if (!CAPABILITIES.includes(body.capability)) return "Unknown capability.";

  const input = body.input as Partial<RuntimeTurnInput>;
  if (!input || typeof input !== "object") return "Missing meeting context.";

  const needsMember = body.capability !== "synthesis" && body.capability !== "readout";
  const memberId = String(input.memberId);
  // Own keys only: "constructor" and "toString" are on every object but nobody's adviser.
  if (needsMember && (memberId === SECRETARY_SLUG || !Object.hasOwn(PERSONA_PACKAGES, memberId))) {
    return "No board member by that id.";
  }
  if (typeof input.briefing === "string" && input.briefing.length > LIMITS.briefing) {
    return `The briefing is longer than ${LIMITS.briefing} characters.`;
  }
  if (typeof input.prompt === "string" && input.prompt.length > LIMITS.prompt) {
    return `The prompt is longer than ${LIMITS.prompt} characters.`;
  }
  if (input.transcript) {
    if (!Array.isArray(input.transcript)) return "The transcript must be a list of events.";
    if (input.transcript.length > LIMITS.events) {
      return `A meeting this long is not supported: ${input.transcript.length} events.`;
    }
    const size = input.transcript.reduce((total, event) => total + (event?.text?.length ?? 0), 0);
    if (size > LIMITS.transcript) return "The transcript is too long to carry.";
  }
  return null;
}

/**
 * One endpoint for every board-agent capability. `publicTurn` answers as a text/event-stream
 * so the room can watch a member speak; the rest answer as JSON. Each request carries the
 * meeting context it needs — the page stays the source of truth and no session lives here.
 */
export async function POST(request: Request) {
  if (!hasLiveKey()) return jsonError(NO_KEY, 503);

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > LIMITS.body) return jsonError("The request is too large.", 413);

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > LIMITS.body) {
    return jsonError("The request is too large.", 413);
  }

  let body: Body;
  try {
    body = JSON.parse(raw) as Body;
  } catch {
    return jsonError("Malformed request body.", 400);
  }

  const refused = refuse(body);
  if (refused) return jsonError(refused, 400);

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
