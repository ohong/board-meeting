import { describe, expect, it } from "vitest";

import { handleMemberTurnPost, POST } from "../app/api/member-turn/route";
import { createMockRuntime } from "../lib/runtime/mock";

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://board.test/api/member-turn", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function validPublicTurnBody() {
  return {
    capability: "publicTurn" as const,
    input: {
      capability: "publicTurn" as const,
      memberId: "daniel-ek",
      memberName: "Daniel Ek",
      briefing: "Question: Change?",
      phase: "discussion" as const,
      transcript: [],
      ownPriorStatements: [],
      boardNames: ["Daniel Ek", "David Heinemeier Hansson", "Lulu Cheng Meservey"],
    },
  };
}

describe("member-turn API boundary", () => {
  it("relays public turns as NDJSON but keeps the final result explicit", async () => {
    const runtime = {
      ...createMockRuntime(),
      async publicTurn(_input, options) {
        options?.onStream?.({ type: "reset" });
        options?.onStream?.({ type: "append", delta: "Streamed " });
        options?.onStream?.({ type: "append", delta: "answer." });
        return { text: "Streamed answer." };
      },
    } satisfies ReturnType<typeof createMockRuntime>;
    const response = await handleMemberTurnPost(
      request(validPublicTurnBody(), { origin: "https://board.test", "sec-fetch-site": "same-origin" }),
      { createRuntime: () => runtime, hasLiveKey: () => true },
    );

    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    expect(await response.text()).toBe(
      [
        JSON.stringify({ type: "reset" }),
        JSON.stringify({ type: "append", delta: "Streamed " }),
        JSON.stringify({ type: "append", delta: "answer." }),
        JSON.stringify({ type: "complete", result: { text: "Streamed answer." } }),
        "",
      ].join("\n"),
    );
  });

  it("preserves JSON responses for structured non-public capabilities", async () => {
    const runtime = {
      ...createMockRuntime(),
      async synthesis() {
        return "Structured synthesis.";
      },
    } satisfies ReturnType<typeof createMockRuntime>;
    const response = await handleMemberTurnPost(
      request(
        {
          capability: "synthesis",
          input: {
            capability: "synthesis",
            briefing: "Question: Change?",
            phase: "discussion",
            transcript: [],
            ownPriorStatements: [],
            boardNames: ["Daniel Ek"],
          },
        },
        { origin: "https://board.test", "sec-fetch-site": "same-origin" },
      ),
      { createRuntime: () => runtime, hasLiveKey: () => true },
    );

    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      result: "Structured synthesis.",
    });
  });

  it("passes request cancellation to structured live runtime calls", async () => {
    let runtimeSignal: AbortSignal | undefined;
    const runtime = {
      ...createMockRuntime(),
      async synthesis(_input, options) {
        runtimeSignal = options?.signal;
        return "Structured synthesis.";
      },
    } satisfies ReturnType<typeof createMockRuntime>;
    const controller = new AbortController();
    const signalRequest = new Request("https://board.test/api/member-turn", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://board.test",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({
        capability: "synthesis",
        input: {
          capability: "synthesis",
          briefing: "Question: Change?",
          phase: "discussion",
          transcript: [],
          ownPriorStatements: [],
          boardNames: ["Daniel Ek"],
        },
      }),
      signal: controller.signal,
    });

    await handleMemberTurnPost(signalRequest, {
      createRuntime: () => runtime,
      hasLiveKey: () => true,
    });
    controller.abort();

    expect(runtimeSignal?.aborted).toBe(true);
  });

  it("aborts the live runtime when the response consumer disconnects", async () => {
    let runtimeSignal: AbortSignal | undefined;
    const runtime = {
      ...createMockRuntime(),
      publicTurn(_input, options) {
        runtimeSignal = options?.signal;
        return new Promise<never>((_resolve, reject) => {
          runtimeSignal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        });
      },
    } satisfies ReturnType<typeof createMockRuntime>;
    const response = await handleMemberTurnPost(
      request(validPublicTurnBody(), { origin: "https://board.test", "sec-fetch-site": "same-origin" }),
      { createRuntime: () => runtime, hasLiveKey: () => true },
    );

    await response.body?.cancel("test disconnect");

    expect(runtimeSignal?.aborted).toBe(true);
  });

  it("rejects cross-origin browser requests", async () => {
    const response = await POST(request({}, { origin: "https://attacker.test" }));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "CROSS_ORIGIN_REQUEST" });
  });

  it("rejects cross-site fetch metadata even when Origin is absent", async () => {
    const response = await POST(request({}, { "sec-fetch-site": "cross-site" }));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: "CROSS_ORIGIN_REQUEST" });
  });

  it("requires JSON content", async () => {
    const response = await POST(
      new Request("https://board.test/api/member-turn", {
        method: "POST",
        headers: { "content-type": "text/plain", origin: "https://board.test" },
        body: "hello",
      }),
    );
    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toMatchObject({ code: "UNSUPPORTED_MEDIA_TYPE" });
  });

  it("validates member routing fields before checking live configuration", async () => {
    const response = await POST(
      request(
        {
          capability: "publicTurn",
          input: {
            capability: "publicTurn",
            memberId: "not-a-declared-adviser",
            memberName: "Unknown",
            briefing: "Question: Change?",
            phase: "discussion",
            transcript: [],
            ownPriorStatements: [],
            boardNames: ["Unknown"],
          },
        },
        { origin: "https://board.test", "sec-fetch-site": "same-origin" },
      ),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: "INVALID_REQUEST" });
  });

  it("keeps secretary inputs distinct from member inputs", async () => {
    const response = await POST(
      request(
        {
          capability: "synthesis",
          input: {
            capability: "synthesis",
            memberId: "daniel-ek",
            memberName: "Daniel Ek",
            briefing: "Question: Change?",
            phase: "discussion",
            transcript: [],
            ownPriorStatements: [],
            boardNames: ["Daniel Ek"],
          },
        },
        { origin: "https://board.test", "sec-fetch-site": "same-origin" },
      ),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: "INVALID_REQUEST" });
  });

  it("rejects oversized bodies before parsing", async () => {
    const response = await POST(
      request({}, { origin: "https://board.test", "content-length": "999999" }),
    );
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({ code: "REQUEST_TOO_LARGE" });
  });

  it("fails explicitly when a valid live request has no OpenAI key", async () => {
    const priorKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const response = await POST(
        request(
          {
            capability: "publicTurn",
            input: {
              capability: "publicTurn",
              memberId: "daniel-ek",
              memberName: "Daniel Ek",
              briefing: "Question: Change?",
              phase: "discussion",
              transcript: [],
              ownPriorStatements: [],
              boardNames: ["Daniel Ek", "David Heinemeier Hansson", "Lulu Cheng Meservey"],
            },
          },
          { origin: "https://board.test", "sec-fetch-site": "same-origin" },
        ),
      );
      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toMatchObject({
        code: "LIVE_RUNTIME_NOT_CONFIGURED",
      });
    } finally {
      if (priorKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = priorKey;
    }
  });
});
