import { describe, expect, it } from "vitest";
import { consumeTurnStream } from "../lib/runtime/turn-stream";
import { parseControlLine, publicTurnPrompt, CONTROL_LINE_SPEC } from "../lib/runtime/prompts";
import type { RuntimeTurnInput } from "../lib/types";

/** Feeds text through as a stream, split the way a model would deliver it. */
async function* chunked(text: string, size = 7): AsyncIterable<string> {
  for (let i = 0; i < text.length; i += size) yield text.slice(i, i + size);
}

async function consume(text: string, size?: number) {
  const deltas: string[] = [];
  const turn = await consumeTurnStream(chunked(text, size), (delta) => deltas.push(delta));
  return { turn, deltas, spoken: deltas.join("") };
}

describe("consuming a member's turn stream", () => {
  it("keeps the control line out of the room and streams only the spoken part", async () => {
    const { turn, spoken } = await consume(
      "[to: Daniel Ek; reaction: disagree; next: Lulu Cheng Meservey]\nDaniel, a leaky funnel is not a strategy.",
    );
    expect(spoken).toBe("Daniel, a leaky funnel is not a strategy.");
    expect(spoken).not.toContain("[");
    expect(turn).toEqual({
      text: "Daniel, a leaky funnel is not a strategy.",
      addressedTo: "Daniel Ek",
      reaction: "disagree",
      wantsToRespond: "Lulu Cheng Meservey",
    });
  });

  it("streams incrementally rather than in one lump", async () => {
    const { deltas } = await consume(
      "[to: -; reaction: none; next: -]\n" + "word ".repeat(30),
      9,
    );
    expect(deltas.length).toBeGreaterThan(5);
  });

  it("treats [pass] as nothing to add and emits no text at all", async () => {
    const { turn, deltas } = await consume("[pass]");
    expect(turn.text).toBe("");
    expect(deltas).toEqual([]);

    const trailing = await consume("[pass]\n");
    expect(trailing.turn.text).toBe("");
    expect(trailing.deltas).toEqual([]);
  });

  it("handles a reply with no control line at all", async () => {
    const { turn, spoken } = await consume("Charge for it. Fourteen days is generous.");
    expect(turn.text).toBe("Charge for it. Fourteen days is generous.");
    expect(spoken).toBe("Charge for it. Fourteen days is generous.");
    expect(turn.reaction).toBeUndefined();
  });

  it("handles a reply that arrives in a single chunk", async () => {
    const { turn, spoken } = await consume("[to: You; reaction: agree; next: -]\nSay it plainly.", 500);
    expect(turn).toEqual({ text: "Say it plainly.", addressedTo: "You", reaction: "agree" });
    expect(spoken).toBe("Say it plainly.");
  });

  it("ignores a malformed or partial control line rather than dropping the turn", async () => {
    const { turn } = await consume("[reaction: enthusiastic; to: ]\nThe point still stands.");
    expect(turn.text).toBe("The point still stands.");
    expect(turn.reaction).toBeUndefined();
    expect(turn.addressedTo).toBeUndefined();
  });

  it("returns an empty turn for an empty stream instead of throwing", async () => {
    const { turn } = await consume("");
    expect(turn.text).toBe("");
  });
});

describe("control line parsing", () => {
  it("drops placeholder values", () => {
    expect(parseControlLine("[to: -; reaction: none; next: -]\nSaid aloud.")).toEqual({
      directives: {},
      rest: "Said aloud.",
    });
  });

  it("only accepts the four known reactions", () => {
    expect(parseControlLine("[reaction: concern]\nx").directives.reaction).toBe("concern");
    expect(parseControlLine("[reaction: delighted]\nx").directives.reaction).toBeUndefined();
  });
});

describe("what a member is told", () => {
  const input: RuntimeTurnInput = {
    capability: "publicTurn",
    memberId: "daniel-ek",
    memberName: "Daniel Ek",
    briefing: "Should we kill the free tier?",
    phase: "discussion",
    transcript: [
      {
        id: "1",
        kind: "message",
        speakerId: "david-heinemeier-hansson",
        speakerName: "David Heinemeier Hansson",
        text: "Charge for it.",
        createdAt: 1,
      },
      {
        id: "2",
        kind: "message",
        speakerId: "lulu-cheng-meservey",
        speakerName: "Lulu Cheng Meservey",
        text: "Half-written thought",
        streaming: true,
        createdAt: 2,
      },
    ],
    privatePosition: {
      memberId: "daniel-ek",
      recommendation: "Measure first.",
      reasoning: "The loop matters.",
      concern: "Losing discovery.",
      question: "How many came through free?",
    },
    ownPriorStatements: ["I would not run this as a binary kill."],
    boardNames: ["Daniel Ek", "David Heinemeier Hansson", "Lulu Cheng Meservey"],
  };

  it("includes their own private position and their own prior words", () => {
    const prompt = publicTurnPrompt(input);
    expect(prompt).toContain("Measure first.");
    expect(prompt).toContain("do not read it out");
    expect(prompt).toContain("I would not run this as a binary kill.");
    expect(prompt).toContain("do not repeat yourself");
  });

  it("includes the public transcript and the protocol", () => {
    const prompt = publicTurnPrompt(input);
    expect(prompt).toContain("David Heinemeier Hansson: Charge for it.");
    expect(prompt).toContain(CONTROL_LINE_SPEC);
    expect(prompt).toContain("The chair is \"You\"");
  });

  it("frames a direct question as something to answer head-on", () => {
    const prompt = publicTurnPrompt({
      ...input,
      capability: "answerDirect",
      prompt: "Does the referral evidence change your view?",
      addressedTo: "Codex",
    });
    expect(prompt).toContain("addressed directly by Codex");
    expect(prompt).toContain("Does the referral evidence change your view?");
    expect(prompt).toContain("Do not deflect");
  });
});
