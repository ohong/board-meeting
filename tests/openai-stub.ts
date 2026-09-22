import { createServer, type Server } from "node:http";

/**
 * A stand-in for the OpenAI Responses API, faithful enough to drive the real live runtime:
 * the same provider, the same streaming transport, the same parsing. It exists so the live
 * code path is actually executed in tests instead of only reasoned about.
 */
export type StubCall = {
  model: string;
  stream: boolean;
  /** The whole request body, so a test can assert on whatever the SDK actually sent. */
  body: string;
};

export type StubServer = {
  url: string;
  calls: StubCall[];
  close: () => Promise<void>;
};

/** `reply` decides what the model says, given the call. Returns the output text. */
export async function startOpenAIStub(
  reply: (call: StubCall) => string,
  options: { chunkSize?: number; failFirst?: number } = {},
): Promise<StubServer> {
  const chunkSize = options.chunkSize ?? 7;
  let remainingFailures = options.failFirst ?? 0;
  const calls: StubCall[] = [];

  const server: Server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      const payload = JSON.parse(body || "{}") as {
        model?: string;
        instructions?: string;
        input?: unknown;
        stream?: boolean;
      };
      const call: StubCall = {
        model: String(payload.model ?? ""),
        stream: Boolean(payload.stream),
        body,
      };
      calls.push(call);

      if (remainingFailures > 0) {
        remainingFailures -= 1;
        // 400 rather than 500: a client error the SDK will not sit and retry through.
        response.writeHead(400, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: { message: "stub failure", type: "invalid_request_error" } }));
        return;
      }

      const text = reply(call);

      if (!payload.stream) {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(completedResponse(text)));
        return;
      }

      response.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      });
      const send = (event: Record<string, unknown>) => {
        response.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      send({ type: "response.created", response: baseResponse([]) });
      send({
        type: "response.output_item.added",
        output_index: 0,
        item: { type: "message", id: "msg_1", role: "assistant", status: "in_progress", content: [] },
      });
      // Chunked the way a model streams, so control-line parsing meets real boundaries.
      for (let i = 0; i < text.length; i += chunkSize) {
        send({
          type: "response.output_text.delta",
          item_id: "msg_1",
          output_index: 0,
          content_index: 0,
          delta: text.slice(i, i + chunkSize),
        });
      }
      send({
        type: "response.output_text.done",
        item_id: "msg_1",
        output_index: 0,
        content_index: 0,
        text,
      });
      send({ type: "response.output_item.done", output_index: 0, item: messageItem(text) });
      send({ type: "response.completed", response: completedResponse(text) });
      response.end();
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("stub server has no port");

  return {
    url: `http://127.0.0.1:${address.port}`,
    calls,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}

function messageItem(text: string) {
  return {
    type: "message",
    id: "msg_1",
    role: "assistant",
    status: "completed",
    content: [{ type: "output_text", text, annotations: [] }],
  };
}

function baseResponse(output: unknown[]) {
  return {
    id: "resp_1",
    object: "response",
    created_at: 1,
    status: "in_progress",
    model: "stub",
    output,
    usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    incomplete_details: null,
  };
}

function completedResponse(text: string) {
  return { ...baseResponse([messageItem(text)]), status: "completed" };
}
