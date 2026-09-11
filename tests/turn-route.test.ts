import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "../app/api/member-turn/route";

/**
 * The endpoint holds no session and takes its meeting context from the page, so what it
 * refuses is the only bound on what a deployment's key will be asked to do. None of these
 * reach a model: every one is answered before the runtime is called.
 */
const KEY = "OPENAI_API_KEY";
let original: string | undefined;

beforeEach(() => {
  original = process.env[KEY];
  process.env[KEY] = "test-key-not-used";
});

afterEach(() => {
  if (original === undefined) delete process.env[KEY];
  else process.env[KEY] = original;
});

function post(body: unknown, raw?: string) {
  return POST(
    new Request("http://localhost/api/member-turn", {
      method: "POST",
      body: raw ?? JSON.stringify(body),
    }),
  );
}

async function refusal(response: Response) {
  return { status: response.status, ...(await response.json()) } as {
    status: number;
    ok: boolean;
    error: string;
  };
}

const turn = (over: Record<string, unknown> = {}) => ({
  capability: "publicTurn",
  input: {
    capability: "publicTurn",
    memberId: "daniel-ek",
    memberName: "Daniel Ek",
    briefing: "Should we kill the free tier?",
    phase: "discussion",
    transcript: [],
    ownPriorStatements: [],
    boardNames: ["Daniel Ek"],
    ...over,
  },
});

describe("the board-turn endpoint", () => {
  it("says so plainly when no key is configured", async () => {
    delete process.env[KEY];
    const result = await refusal(await post(turn()));
    expect(result.status).toBe(503);
    expect(result.error).toContain("OPENAI_API_KEY");
  });

  it("refuses a body larger than any meeting", async () => {
    const result = await refusal(await post(null, "x".repeat(300_000)));
    expect(result.status).toBe(413);
  });

  it("refuses malformed JSON", async () => {
    const result = await refusal(await post(null, "{not json"));
    expect(result.status).toBe(400);
  });

  it("refuses a capability it does not have", async () => {
    const result = await refusal(await post({ capability: "sudo", input: {} }));
    expect(result.status).toBe(400);
    expect(result.error).toContain("capability");
  });

  it("refuses a member who is not an authored agent", async () => {
    const result = await refusal(await post(turn({ memberId: "not-a-real-adviser" })));
    expect(result.status).toBe(400);
    expect(result.error).toContain("board member");
  });

  it("refuses a briefing, a prompt or a transcript past its bounds", async () => {
    const long = await refusal(await post(turn({ briefing: "x".repeat(20_001) })));
    expect(long.error).toContain("briefing");

    const prompt = await refusal(await post(turn({ prompt: "x".repeat(4_001) })));
    expect(prompt.error).toContain("prompt");

    const events = Array.from({ length: 201 }, (_, index) => ({
      id: String(index),
      kind: "message",
      speakerId: "chair",
      speakerName: "You",
      text: "hello",
      at: 0,
    }));
    const many = await refusal(await post(turn({ transcript: events })));
    expect(many.error).toContain("201 events");

    const heavy = await refusal(
      await post(turn({ transcript: [{ id: "1", kind: "message", text: "x".repeat(120_001) }] })),
    );
    expect(heavy.error).toContain("too long");
  });
});
