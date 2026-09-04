import { describe, expect, it } from "vitest";
import {
  createDisplayedReadout,
  deriveReadoutDisplayContext,
  formatDisplayedReadout,
} from "../lib/displayed-readout";
import type { ExecutiveReadout } from "../lib/types";

const readout: ExecutiveReadout = {
  decision: "Should we change course?",
  recommendation: "Run one bounded experiment before committing.",
  divided: true,
  options: ["Stay the course", "Run the experiment"],
  tradeoffs: [],
  assumptions: ["The experiment can finish this month."],
  openQuestions: [],
  nextActions: ["Name an owner."],
  closingComments: [
    { memberId: "ada", name: "Ada", comment: "Preserve a control group." },
  ],
};

const state = {
  members: [{ name: "Ada" }, { name: "Grace" }],
  guest: { name: "Codex" },
  transcript: [
    { createdAt: Date.parse("2026-09-04T07:00:01.000Z") },
    { createdAt: Date.parse("2026-09-04T06:59:59.000Z") },
  ],
};

describe("displayed readout formatter", () => {
  it("derives one stable meeting context without mutating session data", () => {
    const before = JSON.stringify({ readout, state });
    const context = deriveReadoutDisplayContext(state);

    expect(context).toEqual({
      meetingDate: "September 3, 2026",
      participants: ["You (chair)", "Ada", "Grace", "Codex (guest agent)"],
    });
    expect(JSON.stringify({ readout, state })).toBe(before);
  });

  it("creates the canonical plain-text memo byte-for-byte", () => {
    const context = deriveReadoutDisplayContext(state);
    const expected = [
      "Board readout",
      "Meeting date: September 3, 2026",
      "Participants: You (chair), Ada, Grace, Codex (guest agent)",
      "",
      "Decision under discussion",
      "Should we change course?",
      "",
      "Board recommendation",
      "Run one bounded experiment before committing.",
      "The board remains divided.",
      "",
      "Options considered",
      "- Stay the course",
      "- Run the experiment",
      "",
      "Key tradeoffs",
      "None recorded",
      "",
      "Important assumptions",
      "- The experiment can finish this month.",
      "",
      "Open questions",
      "None recorded",
      "",
      "Recommended next actions",
      "- Name an owner.",
      "",
      "Closing comments by board member",
      "- Ada: Preserve a control group.",
    ].join("\n");

    expect(formatDisplayedReadout(readout, context)).toBe(expected);
    expect(createDisplayedReadout(readout, state)).toEqual({
      ...context,
      readoutText: expected,
    });
  });

  it("fails clearly when an invalid completed state has no meeting timestamp", () => {
    expect(() =>
      deriveReadoutDisplayContext({ members: [], guest: { name: null }, transcript: [] }),
    ).toThrow("Cannot display a readout without a meeting timestamp.");
  });
});
