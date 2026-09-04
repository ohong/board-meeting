import { describe, expect, it } from "vitest";
import {
  MOCK_AGENT_PREVIEW_CONTRIBUTION,
  MOCK_AGENT_PREVIEW_LABEL,
  MOCK_AGENT_PREVIEW_NAME,
  MOCK_AGENT_PREVIEW_TOOL_ORDER,
  createMockAgentPreviewQuestion,
  getMockAgentPreviewAvailability,
  previewMockAgentHandoff,
} from "../lib/mock-agent-preview";
import { createMockRuntime } from "../lib/runtime/mock";
import { createMeetingSession } from "../lib/session";
import { BOARD_TOOL_NAMES, createBoardToolManifest } from "../lib/webmcp";

const BRIEFING =
  "Question: Should we move the launch to October?\n\nBriefing: The board has only the chair's supplied context.";

async function activeSession(runtime = createMockRuntime()) {
  const session = createMeetingSession({ runtime, autoContinue: false, joinDelayMs: 0 });
  session.useDemoBoard();
  session.goToBrief();
  session.setBriefing(BRIEFING);
  expect((await session.startMeeting()).ok).toBe(true);
  return session;
}

describe("local mock-agent handoff preview", () => {
  it("uses the exact six-tool manifest in the scripted order and leaves visible evidence", async () => {
    const session = await activeSession();
    expect(createBoardToolManifest(session).map(({ name }) => name)).toEqual(BOARD_TOOL_NAMES);
    expect(BOARD_TOOL_NAMES).toHaveLength(6);

    const result = await previewMockAgentHandoff(session);

    expect(result.label).toBe(MOCK_AGENT_PREVIEW_LABEL);
    expect(result.toolOrder).toEqual(MOCK_AGENT_PREVIEW_TOOL_ORDER);
    expect(result.guest).toEqual({ name: MOCK_AGENT_PREVIEW_NAME, status: "joined" });
    expect(result.contribution).toBe(MOCK_AGENT_PREVIEW_CONTRIBUTION);
    expect(result.addressedMember).toBe("Daniel Ek");
    expect(result.directReply.length).toBeGreaterThan(0);
    expect(result.synthesis.length).toBeGreaterThan(0);

    const transcript = session.getState().transcript;
    expect(transcript).toContainEqual(
      expect.objectContaining({
        kind: "message",
        speakerId: "guest",
        speakerName: MOCK_AGENT_PREVIEW_NAME,
        text: MOCK_AGENT_PREVIEW_CONTRIBUTION,
      }),
    );
    expect(transcript).toContainEqual(
      expect.objectContaining({
        kind: "message",
        speakerId: "guest",
        addressedTo: "Daniel Ek",
        text: expect.stringContaining("Should we move the launch to October?"),
      }),
    );
    expect(transcript).toContainEqual(
      expect.objectContaining({
        kind: "message",
        speakerId: "daniel-ek",
        addressedTo: MOCK_AGENT_PREVIEW_NAME,
      }),
    );
    expect(transcript).toContainEqual(
      expect.objectContaining({ kind: "system", speakerName: "Secretary", text: result.synthesis }),
    );
  });

  it("adds no fake private evidence or fabricated business facts", () => {
    expect(MOCK_AGENT_PREVIEW_CONTRIBUTION).toMatch(/^No private context is being added/);
    expect(MOCK_AGENT_PREVIEW_CONTRIBUTION).toMatch(/evidence that would most change this decision/i);
    expect(MOCK_AGENT_PREVIEW_CONTRIBUTION).not.toMatch(/\d+%|customers?|revenue|ARR|pipeline/i);
    expect(createMockAgentPreviewQuestion(BRIEFING)).toContain(
      "Should we move the launch to October?",
    );
    expect(createMockAgentPreviewQuestion(BRIEFING)).not.toMatch(/\d+%|customers?|revenue|ARR|pipeline/i);
    expect(`${MOCK_AGENT_PREVIEW_NAME} ${MOCK_AGENT_PREVIEW_LABEL}`).not.toContain("Codex");
  });

  it("rejects live, inactive, and occupied sessions before running", async () => {
    const inactive = createMeetingSession({ runtime: createMockRuntime() });
    expect(getMockAgentPreviewAvailability(inactive.getState())).toMatchObject({
      available: false,
      reason: expect.stringMatching(/start a meeting/i),
    });
    await expect(previewMockAgentHandoff(inactive)).rejects.toThrow(/start a meeting/i);

    const liveRuntime = { ...createMockRuntime(), id: "live" as const };
    const live = await activeSession(liveRuntime);
    expect(getMockAgentPreviewAvailability(live.getState())).toMatchObject({
      available: false,
      reason: expect.stringMatching(/only in demo mode/i),
    });
    await expect(previewMockAgentHandoff(live)).rejects.toThrow(/only in demo mode/i);

    const occupied = await activeSession();
    expect(occupied.join("Personal agent").ok).toBe(true);
    await Promise.resolve();
    expect(getMockAgentPreviewAvailability(occupied.getState())).toMatchObject({
      available: false,
      reason: expect.stringMatching(/already occupied/i),
    });
    await expect(previewMockAgentHandoff(occupied)).rejects.toThrow(/already occupied/i);
  });
});
