import type {
  BoardRuntime,
  ExecutiveReadout,
  MemberTurn,
  OpeningPosition,
  ReadoutInput,
  RuntimeTurnInput,
  SynthesisInput,
} from "../types";

const ENDPOINT = "/api/member-turn";

async function post<T>(capability: string, input: unknown): Promise<T> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ capability, input }),
  });
  const data = (await response.json()) as { ok: boolean; error?: string; result?: T };
  if (!response.ok || !data.ok) throw new Error(data.error || "The board agent call failed.");
  return data.result as T;
}

/** Reads one `text/event-stream` response, dispatching each `event:`/`data:` pair. */
async function readEventStream(
  response: Response,
  onEvent: (event: string, data: Record<string, unknown>) => void,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The board agent stream had no body.");
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = /^event:\s*(.+)$/m.exec(frame)?.[1]?.trim();
      const payload = /^data:\s*(.+)$/m.exec(frame)?.[1];
      if (event && payload) {
        try {
          onEvent(event, JSON.parse(payload) as Record<string, unknown>);
        } catch {
          // A malformed frame is dropped rather than allowed to end the turn.
        }
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
}

/** The client half of the live runtime: same contract, calls cross the network. */
export function createBrowserRuntime(): BoardRuntime {
  return {
    id: "live",

    formOpeningPosition(input) {
      return post<OpeningPosition>("formOpeningPosition", input);
    },

    async publicTurn(input: RuntimeTurnInput, onDelta) {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ capability: input.capability, input }),
      });

      if (!response.ok && response.headers.get("content-type")?.includes("application/json")) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "The turn failed.");
      }

      let turn: MemberTurn | undefined;
      let failure: string | undefined;
      await readEventStream(response, (event, data) => {
        if (event === "delta") onDelta?.(String(data.delta ?? ""));
        if (event === "done") turn = data as unknown as MemberTurn;
        if (event === "error") failure = String(data.error ?? "The turn failed.");
      });

      if (failure) throw new Error(failure);
      if (!turn) throw new Error("The turn ended without a result.");
      return turn;
    },

    closingComment(input) {
      return post<string>("closingComment", input);
    },

    synthesis(input: SynthesisInput) {
      return post<string>("synthesis", input);
    },

    readout(input: ReadoutInput) {
      return post<ExecutiveReadout>("readout", input);
    },
  };
}
