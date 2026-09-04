import {
  createRuntime,
  EveRuntimeContractError,
  hasLiveKey,
  resolveEveHost,
} from "@/lib/runtime/live";
import { memberTurnApiRequestSchema } from "@/lib/runtime/schemas";
import type { BoardRuntime, RuntimeTurnInput } from "@/lib/types";

const MAX_BODY_BYTES = 256 * 1024;

function errorResponse(status: number, code: string, error: string) {
  return Response.json({ ok: false, code, error }, { status });
}

type RouteDependencies = {
  createRuntime: (options: { eveHost: string }) => BoardRuntime;
  hasLiveKey: () => boolean;
};

const defaultDependencies: RouteDependencies = { createRuntime, hasLiveKey };

function streamLine(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value)}\n`);
}

function runtimeError(error: unknown) {
  if (error instanceof EveRuntimeContractError) {
    return { code: error.code, error: error.message };
  }
  console.error("Live Eve board runtime call failed.", error);
  return {
    code: "EVE_RUNTIME_UNAVAILABLE",
    error: "The Eve runtime could not complete this board turn.",
  };
}

function publicTurnResponse(
  runtime: BoardRuntime,
  input: RuntimeTurnInput,
  requestSignal: AbortSignal,
) {
  const cancellation = new AbortController();
  const signal = AbortSignal.any([requestSignal, cancellation.signal]);
  let open = true;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      void runtime
        .publicTurn(input, {
          signal,
          onStream(event) {
            if (open && !signal.aborted) controller.enqueue(streamLine(event));
          },
        })
        .then((result) => {
          if (open && !signal.aborted) controller.enqueue(streamLine({ type: "complete", result }));
        })
        .catch((error: unknown) => {
          if (open && !signal.aborted) controller.enqueue(streamLine({ type: "error", ...runtimeError(error) }));
        })
        .finally(() => {
          if (!open) return;
          open = false;
          controller.close();
        });
    },
    cancel(reason) {
      open = false;
      cancellation.abort(reason);
    },
  });
  return new Response(stream, {
    headers: {
      "cache-control": "no-store",
      "content-type": "application/x-ndjson; charset=utf-8",
      "x-accel-buffering": "no",
      "x-content-type-options": "nosniff",
    },
  });
}

export function validateSameOrigin(request: Request): string | null {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== requestOrigin) {
    return "Cross-origin board runtime requests are not allowed.";
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return "The board runtime accepts same-origin browser requests only.";
  }
  return null;
}

async function readJsonBody(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new RequestBodyError(413, "REQUEST_TOO_LARGE", "Request body is too large.");
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new RequestBodyError(413, "REQUEST_TOO_LARGE", "Request body is too large.");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new RequestBodyError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

class RequestBodyError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function handleMemberTurnPost(
  request: Request,
  dependencies: RouteDependencies = defaultDependencies,
) {
  const sameOriginError = validateSameOrigin(request);
  if (sameOriginError) return errorResponse(403, "CROSS_ORIGIN_REQUEST", sameOriginError);

  const contentType =
    request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (contentType !== "application/json") {
    return errorResponse(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "Content-Type must be application/json.",
    );
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return errorResponse(error.status, error.code, error.message);
    }
    return errorResponse(400, "INVALID_REQUEST_BODY", "Could not read request body.");
  }

  const parsed = memberTurnApiRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        code: "INVALID_REQUEST",
        error: "Request does not match the selected board capability.",
        issues: parsed.error.issues.map(({ path, message }) => ({ path, message })),
      },
      { status: 400 },
    );
  }

  if (!dependencies.hasLiveKey()) {
    return errorResponse(
      503,
      "LIVE_RUNTIME_NOT_CONFIGURED",
      "OPENAI_API_KEY is not set. The deterministic mock runtime remains available.",
    );
  }

  try {
    const runtime = dependencies.createRuntime({ eveHost: resolveEveHost(request) });
    let result: unknown;
    switch (parsed.data.capability) {
      case "formOpeningPosition":
        result = await runtime.formOpeningPosition(parsed.data.input, {
          signal: request.signal,
        });
        break;
      case "publicTurn":
      case "answerDirect":
        return publicTurnResponse(runtime, parsed.data.input, request.signal);
      case "closingComment":
        result = await runtime.closingComment(parsed.data.input, { signal: request.signal });
        break;
      case "synthesis":
        result = await runtime.synthesis(parsed.data.input, { signal: request.signal });
        break;
      case "readout":
        result = await runtime.readout(parsed.data.input, { signal: request.signal });
        break;
    }
    return Response.json({ ok: true, result });
  } catch (error) {
    const failure = runtimeError(error);
    return errorResponse(502, failure.code, failure.error);
  }
}

export function POST(request: Request) {
  return handleMemberTurnPost(request);
}
