import { describe, expect, it } from "vitest";

import { POST } from "../app/api/member-turn/route";

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://board.test/api/member-turn", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("member-turn API boundary", () => {
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
