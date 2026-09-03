import { createRuntime, hasLiveKey } from "@/lib/runtime/live";
import type { TurnCapability } from "@/lib/types";

export async function POST(request: Request) {
  if (!hasLiveKey()) {
    return Response.json(
      {
        ok: false,
        error:
          "OPENAI_API_KEY is not set. Add it to the environment to enable live board members. The UI mock runtime remains available without a key.",
      },
      { status: 503 },
    );
  }
  const body = (await request.json()) as { capability: TurnCapability; input: Record<string, unknown> };
  const runtime = createRuntime();
  const input = body.input as never;
  try {
    let result: unknown;
    switch (body.capability) {
      case "formOpeningPosition":
        result = await runtime.formOpeningPosition(input);
        break;
      case "publicTurn":
      case "answerDirect":
        result = await runtime.publicTurn(input);
        break;
      case "closingComment":
        result = await runtime.closingComment(input);
        break;
      case "synthesis":
        result = await runtime.synthesis(input);
        break;
      case "readout":
        result = await runtime.readout(input);
        break;
      default:
        return Response.json({ ok: false, error: "Unknown capability." }, { status: 400 });
    }
    return Response.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Model call failed.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
