import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startOpenAIStub, type StubServer } from "./openai-stub";
import { createLiveRuntime } from "../lib/runtime/live";
import type { RuntimeTurnInput } from "../lib/types";

/**
 * These drive the real live runtime — the real provider, the real streaming transport, the
 * real parsing — against a stub Responses API. Without them the live path is only reasoned
 * about; the whole demo runs on code that has never executed.
 */

const BRIEFING = "Should we eliminate the free tier and replace it with a 14-day trial?";

function turnInput(overrides: Partial<RuntimeTurnInput> = {}): RuntimeTurnInput {
  return {
    capability: "publicTurn",
    memberId: "daniel-ek",
    memberName: "Daniel Ek",
    briefing: BRIEFING,
    phase: "discussion",
    transcript: [],
    ownPriorStatements: [],
    boardNames: ["Daniel Ek", "David Heinemeier Hansson", "Lulu Cheng Meservey"],
    ...overrides,
  };
}

let stub: StubServer | undefined;
const originalKey = process.env.OPENAI_API_KEY;
const originalBase = process.env.OPENAI_BASE_URL;

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test-key";
});

afterEach(async () => {
  await stub?.close();
  stub = undefined;
  process.env.OPENAI_API_KEY = originalKey;
  if (originalBase === undefined) delete process.env.OPENAI_BASE_URL;
  else process.env.OPENAI_BASE_URL = originalBase;
});

async function withStub(reply: (call: { body: string }) => string, options = {}) {
  stub = await startOpenAIStub(reply as never, options);
  process.env.OPENAI_BASE_URL = stub.url;
  return createLiveRuntime();
}

describe("the live runtime against a stub Responses API", () => {
  it("streams a public turn, holding the control line back from the room", async () => {
    const runtime = await withStub(
      () =>
        "[to: David Heinemeier Hansson; reaction: disagree; next: Lulu Cheng Meservey]\n" +
        "David, a leaky funnel is not a strategy. Measure the shared workspaces first.",
    );

    const deltas: string[] = [];
    const turn = await runtime.publicTurn(turnInput(), (delta) => deltas.push(delta));

    expect(deltas.join("")).toBe(turn.text);
    expect(deltas.join("")).not.toContain("[");
    expect(deltas.length).toBeGreaterThan(3);
    expect(turn).toEqual({
      text: "David, a leaky funnel is not a strategy. Measure the shared workspaces first.",
      addressedTo: "David Heinemeier Hansson",
      reaction: "disagree",
      wantsToRespond: "Lulu Cheng Meservey",
    });
  });

  it("sends each member their own package and never another member's", async () => {
    const seen: string[] = [];
    const runtime = await withStub((call) => {
      seen.push(call.body);
      return "[to: -; reaction: none; next: -]\nSaid aloud.";
    });

    await runtime.publicTurn(turnInput());
    await runtime.publicTurn(turnInput({ memberId: "david-heinemeier-hansson", memberName: "David Heinemeier Hansson" }));

    expect(seen).toHaveLength(2);
    expect(seen[0]).toContain("Daniel Ek");
    expect(seen[0]).not.toContain("37signals");
    expect(seen[1]).toContain("37signals");
    expect(seen[1]).not.toContain("Spotify");
  });

  it("reads [pass] as nothing to add and emits no text to the room", async () => {
    const runtime = await withStub(() => "[pass]");
    const deltas: string[] = [];
    const turn = await runtime.publicTurn(turnInput(), (delta) => deltas.push(delta));
    expect(turn.text).toBe("");
    expect(deltas).toEqual([]);
  });

  it("parses an opening position out of a JSON reply", async () => {
    const runtime = await withStub(() =>
      'Here you go:\n{"recommendation":"Do not kill free yet.","reasoning":"The loop matters.","concern":"Losing discovery.","question":"How many came through free?"}',
    );
    const position = await runtime.formOpeningPosition(turnInput({ capability: "formOpeningPosition" }));
    expect(position).toEqual({
      memberId: "daniel-ek",
      recommendation: "Do not kill free yet.",
      reasoning: "The loop matters.",
      concern: "Losing discovery.",
      question: "How many came through free?",
    });
  });

  it("degrades to a usable position rather than leaving a seat unready", async () => {
    const runtime = await withStub(() => "I would rather talk it through than fill in a form.");
    const position = await runtime.formOpeningPosition(turnInput({ capability: "formOpeningPosition" }));
    expect(position.memberId).toBe("daniel-ek");
    expect(position.recommendation.length).toBeGreaterThan(0);
    expect(position.question.length).toBeGreaterThan(0);
  });

  it("builds the readout from the secretary's JSON, on the secretary's own model", async () => {
    const runtime = await withStub(() =>
      JSON.stringify({
        decision: "Whether to eliminate the free tier.",
        recommendation: "The board is divided.",
        divided: true,
        options: ["Kill it", "Narrow it"],
        tradeoffs: ["Support load against discovery"],
        assumptions: ["Free drives discovery"],
        openQuestions: ["Do shared workspaces convert?"],
        nextActions: ["Tag the last ten enterprise wins"],
      }),
    );

    const readout = await runtime.readout({
      briefing: BRIEFING,
      transcript: [],
      closingComments: [{ memberId: "daniel-ek", name: "Daniel Ek", comment: "Measure first." }],
      boardNames: ["Daniel Ek"],
    });

    expect(readout.divided).toBe(true);
    expect(readout.options).toEqual(["Kill it", "Narrow it"]);
    expect(readout.closingComments).toHaveLength(1);
    // The secretary runs a tier up from the board, and is not one of the advisers.
    expect(stub!.calls.at(-1)!.model).toBe("gpt-5.6-terra");
    expect(stub!.calls.at(-1)!.body).toContain("secretary");
  });

  it("surfaces a failed call instead of letting it look like a pass", async () => {
    const runtime = await withStub(() => "never reached", { failFirst: 5 });
    // A failed turn and a member passing both produce no text. They must not be confused:
    // one is retried and reported, the other is a member with nothing to add.
    await expect(runtime.publicTurn(turnInput())).rejects.toThrow();
  });

  it("asks the board's model for board turns", async () => {
    const runtime = await withStub(() => "[to: -; reaction: none; next: -]\nSaid aloud.");
    await runtime.publicTurn(turnInput());
    expect(stub!.calls[0].model).toBe("gpt-5.6-luna");
    expect(stub!.calls[0].stream).toBe(true);
  });
});
