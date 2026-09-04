import type {
  BoardRuntime,
  ClosingComment,
  ExecutiveReadout,
  MemberTurn,
  OpeningPosition,
  PublicTurnOptions,
  RuntimeCallOptions,
  TranscriptEvent,
} from "../types";
import {
  PUBLIC_TURN_MAX_CHARS,
  publicTurnStreamEventSchema,
} from "./schemas";

type BrowserRuntimeOptions = {
  fetch?: typeof fetch;
};

async function post<T>(
  fetcher: typeof fetch,
  body: unknown,
  options: RuntimeCallOptions = {},
): Promise<T> {
  const res = await fetcher("/api/member-turn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: options.signal,
  });
  const data = (await res.json()) as { ok: boolean; error?: string; result?: T };
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "OPENAI_API_KEY is not set.");
  }
  return data.result as T;
}

export async function readPublicTurnStream(
  body: ReadableStream<Uint8Array>,
  options: PublicTurnOptions = {},
): Promise<MemberTurn> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";
  let completed: MemberTurn | undefined;
  let provisionalChars = 0;

  const consumeLine = (line: string) => {
    if (!line.trim()) return;
    if (completed) {
      throw new Error("The board runtime emitted a stream event after completion.");
    }
    let decoded: unknown;
    try {
      decoded = JSON.parse(line);
    } catch {
      throw new Error("The board runtime returned malformed JSON in its stream.");
    }
    const parsed = publicTurnStreamEventSchema.safeParse(decoded);
    if (!parsed.success) throw new Error("The board runtime returned an invalid stream event.");
    const event = parsed.data;
    if (event.type === "reset") {
      provisionalChars = 0;
      options.onStream?.(event);
    } else if (event.type === "append") {
      if (provisionalChars + event.delta.length > PUBLIC_TURN_MAX_CHARS) {
        throw new Error(
          `The board runtime streamed more than ${PUBLIC_TURN_MAX_CHARS} provisional characters.`,
        );
      }
      provisionalChars += event.delta.length;
      options.onStream?.(event);
    } else if (event.type === "complete") {
      completed = event.result;
    } else {
      throw new Error(event.error);
    }
  };

  try {
    while (true) {
      options.signal?.throwIfAborted();
      const { done, value } = await reader.read();
      buffered += decoder.decode(value, { stream: !done });
      let newline = buffered.indexOf("\n");
      while (newline >= 0) {
        consumeLine(buffered.slice(0, newline));
        buffered = buffered.slice(newline + 1);
        newline = buffered.indexOf("\n");
      }
      if (done) break;
    }
    consumeLine(buffered);
    if (!completed) throw new Error("The board runtime stream ended without a final turn.");
    return completed;
  } catch (error) {
    try {
      options.onStream?.({ type: "reset" });
    } catch {
      // Preserve the stream protocol failure if projection cleanup also fails.
    }
    try {
      await reader.cancel(error);
    } catch {
      // Reader cancellation is best-effort; the originating failure is authoritative.
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
}

async function streamPublicTurn(
  fetcher: typeof fetch,
  capability: "publicTurn" | "answerDirect",
  input: Parameters<BoardRuntime["publicTurn"]>[0],
  options: PublicTurnOptions = {},
): Promise<MemberTurn> {
  const res = await fetcher("/api/member-turn", {
    method: "POST",
    headers: {
      accept: "application/x-ndjson",
      "content-type": "application/json",
    },
    body: JSON.stringify({ capability, input }),
    signal: options.signal,
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error || "The live board runtime is unavailable.");
  }
  if (!res.body) throw new Error("The board runtime returned an empty stream.");
  return readPublicTurnStream(res.body, options);
}

export function createBrowserRuntime(options: BrowserRuntimeOptions = {}): BoardRuntime {
  const fetcher = options.fetch ?? fetch;
  return {
    id: "live",
    formOpeningPosition(input, callOptions) {
      return post<OpeningPosition>(
        fetcher,
        { capability: "formOpeningPosition", input },
        callOptions,
      );
    },
    publicTurn(input, turnOptions) {
      const capability = input.capability === "answerDirect" ? "answerDirect" : "publicTurn";
      return streamPublicTurn(fetcher, capability, input, turnOptions);
    },
    closingComment(input, callOptions) {
      return post<string>(fetcher, { capability: "closingComment", input }, callOptions);
    },
    synthesis(input, callOptions) {
      return post<string>(fetcher, { capability: "synthesis", input }, callOptions);
    },
    readout(input: {
      briefing: string;
      transcript: TranscriptEvent[];
      closingComments: ClosingComment[];
      boardNames: string[];
    }, callOptions) {
      return post<ExecutiveReadout>(
        fetcher,
        { capability: "readout", input },
        callOptions,
      );
    },
  };
}
