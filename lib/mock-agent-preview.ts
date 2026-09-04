import type { MeetingSession, MeetingState } from "./session";
import {
  BOARD_TOOL_NAMES,
  createBoardToolManifest,
  type BoardToolName,
  type BoardToolResult,
} from "./webmcp";

export const MOCK_AGENT_PREVIEW_NAME = "Preview agent";
export const MOCK_AGENT_PREVIEW_LABEL =
  "Local scripted preview. No personal agent connected.";
export const MOCK_AGENT_PREVIEW_CONTRIBUTION =
  "No private context is being added in this scripted preview. Please identify the evidence that would most change this decision and what the chair should test first.";

export const MOCK_AGENT_PREVIEW_TOOL_ORDER = [
  "inspect_board_meeting",
  "join_board_meeting",
  "contribute_to_board_meeting",
  "address_board_member",
  "request_board_synthesis",
  "inspect_board_meeting",
] as const satisfies readonly BoardToolName[];

export type MockAgentPreviewAvailability =
  | { available: true }
  | { available: false; reason: string };

export function getMockAgentPreviewAvailability(
  state: MeetingState,
): MockAgentPreviewAvailability {
  if (state.runtimeId !== "mock") {
    return { available: false, reason: "The scripted preview is available only in demo mode." };
  }
  if (
    state.phase !== "meeting" ||
    state.meetingPhase === "ending" ||
    state.meetingPhase === "closed"
  ) {
    return { available: false, reason: "Start a meeting before previewing the handoff." };
  }
  if (state.guest.name || !["empty", "waiting"].includes(state.guest.status)) {
    return { available: false, reason: "The guest seat is already occupied." };
  }
  return { available: true };
}

function requireSuccess(name: BoardToolName, result: BoardToolResult): BoardToolResult {
  if (result.ok === true) return result;
  const detail = typeof result.message === "string" ? result.message : "The action was rejected.";
  throw new Error(`${name}: ${detail}`);
}

function decisionFromBriefing(briefing: string): string {
  const normalized = briefing.replace(/\s+/g, " ").trim();
  const question = normalized.match(/Question:\s*(.*?)(?:\s+Briefing:|$)/i)?.[1]?.trim();
  const decision = question || normalized || "the decision in the chair's brief";
  return decision.length > 280 ? `${decision.slice(0, 277).trimEnd()}…` : decision;
}

export function createMockAgentPreviewQuestion(briefing: string): string {
  return `The active decision is “${decisionFromBriefing(briefing)}” What evidence would most change your recommendation, and why?`;
}

type InspectedMeeting = {
  briefing: string;
  board: { name: string }[];
  guest: MeetingState["guest"];
};

function inspectedMeeting(result: BoardToolResult): InspectedMeeting {
  const meeting = result.meeting;
  if (!meeting || typeof meeting !== "object") {
    throw new Error("inspect_board_meeting returned no meeting state.");
  }
  const inspected = meeting as Partial<InspectedMeeting>;
  if (typeof inspected.briefing !== "string" || !Array.isArray(inspected.board)) {
    throw new Error("inspect_board_meeting returned an incomplete meeting state.");
  }
  const board = inspected.board.filter(
    (member): member is { name: string } =>
      Boolean(member) && typeof member === "object" && typeof member.name === "string",
  );
  if (!board.length) throw new Error("No seated adviser is available for the preview.");
  return {
    briefing: inspected.briefing,
    board,
    guest: inspected.guest ?? { name: null, status: "waiting" },
  };
}

export type MockAgentPreviewResult = {
  label: typeof MOCK_AGENT_PREVIEW_LABEL;
  toolOrder: readonly BoardToolName[];
  guest: MeetingState["guest"];
  contribution: string;
  addressedMember: string;
  directReply: string;
  synthesis: string;
};

/** Rehearse the public WebMCP contract without granting the script private context. */
export async function previewMockAgentHandoff(
  session: MeetingSession,
): Promise<MockAgentPreviewResult> {
  const availability = getMockAgentPreviewAvailability(session.getState());
  if (!availability.available) throw new Error(availability.reason);

  const tools = createBoardToolManifest(session);
  if (tools.map(({ name }) => name).join("|") !== BOARD_TOOL_NAMES.join("|")) {
    throw new Error("The board tool manifest no longer matches the six-tool contract.");
  }
  const completedTools: BoardToolName[] = [];
  const execute = async (name: BoardToolName, args: unknown = {}) => {
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) throw new Error(`Missing board tool: ${name}.`);
    completedTools.push(name);
    return requireSuccess(name, await tool.execute(args));
  };

  const before = inspectedMeeting(await execute("inspect_board_meeting"));
  const firstAdviser = before.board[0]!.name;
  const question = createMockAgentPreviewQuestion(before.briefing);
  await execute("join_board_meeting", { name: MOCK_AGENT_PREVIEW_NAME });
  const contribution = await execute("contribute_to_board_meeting", {
    text: MOCK_AGENT_PREVIEW_CONTRIBUTION,
  });
  const addressed = await execute("address_board_member", {
    member: firstAdviser,
    text: question,
  });
  const synthesis = await execute("request_board_synthesis");
  const after = inspectedMeeting(await execute("inspect_board_meeting"));

  return {
    label: MOCK_AGENT_PREVIEW_LABEL,
    toolOrder: completedTools,
    guest: after.guest,
    contribution:
      (contribution.contribution as { text?: string } | undefined)?.text ??
      MOCK_AGENT_PREVIEW_CONTRIBUTION,
    addressedMember:
      (addressed.addressedMember as { name?: string } | undefined)?.name ?? firstAdviser,
    directReply: (addressed.response as { text?: string } | undefined)?.text ?? "",
    synthesis: typeof synthesis.synthesis === "string" ? synthesis.synthesis : "",
  };
}
