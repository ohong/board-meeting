import { describe, expect, it } from "vitest";

import { EXAMPLE_DECISION } from "../lib/example";
import { createMockRuntime } from "../lib/runtime/mock";
import type {
  ClosingComment,
  RuntimeTurnInput,
  TranscriptEvent,
} from "../lib/types";

const CUSTOM_BRIEFING = `Question: Should we open a second office in Dublin?

Briefing: The current team spans five time zones. Hiring in Dublin could improve European coverage, but it adds a lease and another management layer before demand is proven.`;

const MEMBERS = [
  ["daniel-ek", "Daniel Ek"],
  ["david-heinemeier-hansson", "David Heinemeier Hansson"],
  ["lulu-cheng-meservey", "Lulu Cheng Meservey"],
] as const;

function event(
  id: string,
  speakerId: string,
  speakerName: string,
  text: string,
  addressedTo?: string,
): TranscriptEvent {
  return {
    id,
    kind: "message",
    speakerId,
    speakerName,
    text,
    addressedTo,
    createdAt: Number(id.replace(/\D/g, "")) || 1,
  };
}

function memberInput(
  memberId: string,
  memberName: string,
  overrides: Partial<RuntimeTurnInput> = {},
): RuntimeTurnInput {
  return {
    capability: "publicTurn",
    memberId,
    memberName,
    briefing: CUSTOM_BRIEFING,
    phase: "discussion",
    transcript: [],
    ownPriorStatements: [],
    boardNames: MEMBERS.map(([, name]) => name),
    ...overrides,
  };
}

const FIXTURE_LEAK =
  /2\.3%|38%|34%|6,000|420 paying|\$1\.6M|free tier|free workspace|14-day trial|padlocked|tourists|word[- ]of[- ]mouth/i;

describe("deterministic mock grounding", () => {
  it("routes every non-fixture capability through briefing- and transcript-grounded fallbacks", async () => {
    const runtime = createMockRuntime();
    const transcript = [
      event(
        "evt-1",
        "daniel-ek",
        "Daniel Ek",
        "Start with a remote European sales pod and promote it only after demand clears a written threshold.",
      ),
      event(
        "evt-2",
        "david-heinemeier-hansson",
        "David Heinemeier Hansson",
        "Do not sign a lease before the hiring and customer evidence exists.",
      ),
    ];
    const turns: string[] = [];
    const closings: ClosingComment[] = [];

    for (const [memberId, memberName] of MEMBERS) {
      const opening = await runtime.formOpeningPosition(
        memberInput(memberId, memberName, { capability: "formOpeningPosition" }),
      );
      expect(JSON.stringify(opening)).toContain("Dublin");

      for (let turnIndex = 0; turnIndex < 4; turnIndex += 1) {
        const turn = await runtime.publicTurn(
          memberInput(memberId, memberName, {
            transcript,
            ownPriorStatements: Array.from(
              { length: turnIndex },
              (_, index) => `Prior statement ${index + 1}`,
            ),
          }),
        );
        turns.push(turn.text);
      }

      const comment = await runtime.closingComment(
        memberInput(memberId, memberName, {
          capability: "closingComment",
          transcript,
        }),
      );
      closings.push({ memberId, name: memberName, comment });
    }

    const synthesis = await runtime.synthesis({
      capability: "synthesis",
      briefing: CUSTOM_BRIEFING,
      phase: "discussion",
      transcript,
      ownPriorStatements: [],
      boardNames: MEMBERS.map(([, name]) => name),
    });
    const readout = await runtime.readout({
      briefing: CUSTOM_BRIEFING,
      transcript,
      closingComments: closings,
      boardNames: MEMBERS.map(([, name]) => name),
    });
    const allOutput = JSON.stringify({ turns, closings, synthesis, readout });

    expect(new Set(turns).size).toBe(12);
    expect(allOutput).toMatch(/Dublin|lease|European/i);
    expect(allOutput).not.toMatch(FIXTURE_LEAK);
    expect(readout.decision).toBe("Should we open a second office in Dublin?");
    expect(Math.max(...turns.map((text) => text.trim().split(/\s+/).length))).toBeLessThanOrEqual(
      90,
    );
  });

  it("requires an exact fixture match before using a handcrafted opening", async () => {
    const runtime = createMockRuntime();
    const exact = await runtime.formOpeningPosition(
      memberInput("daniel-ek", "Daniel Ek", {
        capability: "formOpeningPosition",
        briefing: EXAMPLE_DECISION,
      }),
    );
    const nearMatch = await runtime.formOpeningPosition(
      memberInput("daniel-ek", "Daniel Ek", {
        capability: "formOpeningPosition",
        briefing: `${EXAMPLE_DECISION}\n`,
      }),
    );

    expect(exact.reasoning).toContain("2.3%");
    expect(nearMatch.reasoning).not.toContain("2.3%");
    expect(nearMatch.recommendation).not.toBe(exact.recommendation);
  });

  it("derives Daniel's direct evidence from bounded guest context and invents none without it", async () => {
    const runtime = createMockRuntime();
    const noGuest = await runtime.publicTurn(
      memberInput("daniel-ek", "Daniel Ek", {
        capability: "answerDirect",
        briefing: EXAMPLE_DECISION,
        prompt: "Does the new evidence change your view?",
        transcript: [event("evt-1", "chair", "You", "Does the new evidence change your view?")],
      }),
    );
    expect(noGuest.text).toMatch(/do not see new guest evidence/i);
    expect(noGuest.text).not.toMatch(/seven|22%/i);

    const directedQuestionOnly = await runtime.publicTurn(
      memberInput("daniel-ek", "Daniel Ek", {
        capability: "answerDirect",
        briefing: EXAMPLE_DECISION,
        prompt: "Does quarterly churn change your view?",
        transcript: [
          event(
            "evt-1",
            "guest",
            "Codex",
            "@Daniel Ek Does quarterly churn change your view?",
            "Daniel Ek",
          ),
        ],
      }),
    );
    expect(directedQuestionOnly.addressedTo).toBe("Codex");
    expect(directedQuestionOnly.text).toMatch(/do not see new guest evidence/i);
    expect(directedQuestionOnly.text).not.toContain("quarterly churn");

    const guestFact =
      "Three of our last five European renewals began with an invitation from an existing customer. " +
      "TRAILING_MARKER_SHOULD_NOT_ESCAPE_".repeat(8);
    const withGuest = await runtime.publicTurn(
      memberInput("daniel-ek", "Daniel Ek", {
        capability: "answerDirect",
        briefing: EXAMPLE_DECISION,
        prompt: "Does that evidence change your view?",
        transcript: [
          event("evt-1", "guest", "Codex", guestFact),
          event(
            "evt-2",
            "guest",
            "Codex",
            "@Daniel Ek Does that evidence change your view?",
            "Daniel Ek",
          ),
        ],
      }),
    );

    expect(withGuest.addressedTo).toBe("Codex");
    expect(withGuest.text).toContain(
      "Three of our last five European renewals began with an invitation",
    );
    expect(withGuest.text).not.toContain("TRAILING_MARKER_SHOULD_NOT_ESCAPE_TRAILING_MARKER");
    expect(withGuest.text).not.toMatch(/seven|22%/i);
    expect(withGuest.text.trim().split(/\s+/).length).toBeLessThanOrEqual(90);
  });

  it("carries bounded guest evidence into fixture and generic summaries only when supplied", async () => {
    const runtime = createMockRuntime();
    const latestEvidence =
      "Four European pilot teams expanded after a customer invited a collaborator, while two direct signups remained inactive. " +
      "Additional qualification detail ".repeat(8) +
      "READOUT_BOUNDARY_MARKER";
    const transcript = [
      event(
        "evt-1",
        "guest",
        "Research Agent",
        "An earlier observation that should be superseded by the latest contribution.",
      ),
      event("evt-2", "guest", "Research Agent", latestEvidence),
      event(
        "evt-3",
        "guest",
        "Research Agent",
        "@Daniel Ek How should the board interpret that evidence?",
        "Daniel Ek",
      ),
    ];
    const synthesisInput = {
      capability: "synthesis" as const,
      briefing: EXAMPLE_DECISION,
      phase: "discussion" as const,
      transcript,
      ownPriorStatements: [],
      boardNames: MEMBERS.map(([, name]) => name),
    };
    const readoutInput = {
      briefing: EXAMPLE_DECISION,
      closingComments: [] as ClosingComment[],
      boardNames: MEMBERS.map(([, name]) => name),
    };

    const synthesis = await runtime.synthesis(synthesisInput);
    const readout = await runtime.readout({ ...readoutInput, transcript });
    expect(synthesis).toContain("Guest-supplied evidence (Research Agent)");
    expect(synthesis).toContain("Four European pilot teams expanded");
    expect(synthesis).not.toContain("earlier observation");
    expect(synthesis).not.toContain("READOUT_BOUNDARY_MARKER");
    expect(readout.assumptions).toContainEqual(
      expect.stringContaining("Guest-supplied evidence (Research Agent)"),
    );
    expect(readout.assumptions.join(" ")).toContain("Four European pilot teams expanded");
    expect(readout.assumptions.join(" ")).not.toContain("READOUT_BOUNDARY_MARKER");

    const genericSynthesis = await runtime.synthesis({
      ...synthesisInput,
      briefing: CUSTOM_BRIEFING,
    });
    const genericReadout = await runtime.readout({
      ...readoutInput,
      briefing: CUSTOM_BRIEFING,
      transcript,
    });
    expect(genericSynthesis).toContain("Guest-supplied evidence (Research Agent)");
    expect(genericSynthesis).toContain("Four European pilot teams expanded");
    expect(genericSynthesis).not.toContain("READOUT_BOUNDARY_MARKER");
    expect(genericReadout.assumptions).toContainEqual(
      expect.stringContaining("Guest-supplied evidence (Research Agent)"),
    );
    expect(genericReadout.assumptions.join(" ")).toContain(
      "Four European pilot teams expanded",
    );
    expect(genericReadout.assumptions.join(" ")).not.toContain("READOUT_BOUNDARY_MARKER");

    const synthesisWithoutGuest = await runtime.synthesis({
      ...synthesisInput,
      transcript: [],
    });
    const readoutWithoutGuest = await runtime.readout({
      ...readoutInput,
      transcript: [],
    });
    expect(synthesisWithoutGuest).not.toContain("Guest-supplied evidence");
    expect(readoutWithoutGuest.assumptions).toEqual([
      "Free is a major source of paying-customer discovery (34%)",
      "Free is a major source of support cost (38% of tickets)",
      "An 18-person team cannot operate two products indefinitely",
    ]);

    const genericSynthesisWithoutGuest = await runtime.synthesis({
      ...synthesisInput,
      briefing: CUSTOM_BRIEFING,
      transcript: [],
    });
    const genericReadoutWithoutGuest = await runtime.readout({
      ...readoutInput,
      briefing: CUSTOM_BRIEFING,
      transcript: [],
    });
    expect(genericSynthesisWithoutGuest).not.toContain("Guest-supplied evidence");
    expect(genericReadoutWithoutGuest.assumptions).not.toEqual(
      expect.arrayContaining([expect.stringContaining("Guest-supplied evidence")]),
    );
  });

  it("preserves twelve distinct, streamable, sub-90-word fixture turns", async () => {
    const runtime = createMockRuntime();
    const turns: string[] = [];

    for (const [memberId, memberName] of MEMBERS) {
      for (let turnIndex = 0; turnIndex < 4; turnIndex += 1) {
        const updates: string[] = [];
        const turn = await runtime.publicTurn(
          memberInput(memberId, memberName, {
            briefing: EXAMPLE_DECISION,
            ownPriorStatements: Array.from(
              { length: turnIndex },
              (_, index) => `Prior statement ${index + 1}`,
            ),
          }),
          {
            onStream: (update) => {
              if (update.type === "append") updates.push(update.delta);
            },
          },
        );
        expect(updates.join("")).toBe(turn.text);
        turns.push(turn.text);
      }
    }

    expect(new Set(turns).size).toBe(12);
    expect(turns.join(" ")).toMatch(/2\.3%|6,000|word-of-mouth/i);
    expect(Math.max(...turns.map((text) => text.trim().split(/\s+/).length))).toBeLessThanOrEqual(
      90,
    );
  });
});
