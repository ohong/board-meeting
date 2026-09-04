import type {
  BoardRuntime,
  ClosingComment,
  ExecutiveReadout,
  MemberTurn,
  OpeningPosition,
  PublicTurnOptions,
  TranscriptEvent,
} from "../types";
import { publicTurnStreamEventSchema } from "./schemas";

type BrowserRuntimeOptions = {
  fetch?: typeof fetch;
};

async function post<T>(fetcher: typeof fetch, body: unknown): Promise<T> {
  const res = await fetcher("/api/member-turn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
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

  const consumeLine = (line: string) => {
    if (!line.trim()) return;
    const parsed = publicTurnStreamEventSchema.safeParse(JSON.parse(line));
    if (!parsed.success) throw new Error("The board runtime returned an invalid stream event.");
    const event = parsed.data;
    if (event.type === "reset" || event.type === "append") {
      options.onStream?.(event);
    } else if (event.type === "complete") {
      if (completed) throw new Error("The board runtime completed a public turn more than once.");
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
  } finally {
    reader.releaseLock();
  }

  if (!completed) throw new Error("The board runtime stream ended without a final turn.");
  return completed;
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
    formOpeningPosition(input) {
      return post<OpeningPosition>(fetcher, { capability: "formOpeningPosition", input });
    },
    publicTurn(input, turnOptions) {
      const capability = input.capability === "answerDirect" ? "answerDirect" : "publicTurn";
      return streamPublicTurn(fetcher, capability, input, turnOptions);
    },
    closingComment(input) {
      return post<string>(fetcher, { capability: "closingComment", input });
    },
    synthesis(input) {
      return post<string>(fetcher, { capability: "synthesis", input });
    },
    readout(input: {
      briefing: string;
      transcript: TranscriptEvent[];
      closingComments: ClosingComment[];
      boardNames: string[];
    }) {
      return post<ExecutiveReadout>(fetcher, { capability: "readout", input });
    },
  };
}
