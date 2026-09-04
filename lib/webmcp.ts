import { createDisplayedReadout, NONE_RECORDED } from "./displayed-readout";
import type { MeetingSession } from "./session";
import type { ExecutiveReadout } from "./types";

export const BOARD_TOOL_NAMES = [
  "inspect_board_meeting",
  "join_board_meeting",
  "contribute_to_board_meeting",
  "address_board_member",
  "request_board_synthesis",
  "get_board_meeting_readout",
] as const;

export type BoardToolName = (typeof BOARD_TOOL_NAMES)[number];
export type BoardToolResult = Record<string, unknown>;
export type BoardToolReceipt = Readonly<{
  toolName: BoardToolName;
  outcome: "succeeded" | "rejected";
  message: string;
}>;
export type BoardToolReceiptHandler = (receipt: BoardToolReceipt) => void;

export type BoardTool = {
  name: BoardToolName;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
  execute: (args?: unknown) => Promise<BoardToolResult> | BoardToolResult;
};

export type ModelContext = {
  registerTool: (
    tool: BoardTool,
    options?: { signal?: AbortSignal },
  ) => Promise<void> | void;
};

export function getModelContext(
  host: { modelContext?: ModelContext } | undefined =
    typeof document === "undefined"
      ? undefined
      : (document as Document & { modelContext?: ModelContext }),
): ModelContext | undefined {
  return host?.modelContext;
}

type FieldRule = {
  name: string;
  label: string;
  maxLength: number;
};

function parseStrings(
  args: unknown,
  fields: readonly FieldRule[],
): { ok: true; values: Record<string, string> } | { ok: false; message: string } {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return { ok: false, message: "Arguments must be an object." };
  }
  const input = args as Record<string, unknown>;
  const allowed = new Set(fields.map(({ name }) => name));
  const unexpected = Object.keys(input).find((key) => !allowed.has(key));
  if (unexpected) return { ok: false, message: `Unexpected argument: ${unexpected}.` };

  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = input[field.name];
    if (typeof value !== "string" || !value.trim()) {
      return { ok: false, message: `${field.label} must be a non-empty string.` };
    }
    const trimmed = value.trim();
    if (trimmed.length > field.maxLength) {
      return {
        ok: false,
        message: `${field.label} must be ${field.maxLength} characters or fewer.`,
      };
    }
    values[field.name] = trimmed;
  }
  return { ok: true, values };
}

function parseNoArguments(args: unknown): { ok: true } | { ok: false; message: string } {
  if (args === undefined) return { ok: true };
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return { ok: false, message: "Arguments must be an object." };
  }
  const unexpected = Object.keys(args as Record<string, unknown>)[0];
  return unexpected
    ? { ok: false, message: `Unexpected argument: ${unexpected}.` }
    : { ok: true };
}

type InspectArguments = {
  transcriptLimit: number;
  transcriptOffset: number;
  includeBriefing: boolean;
};

function parseInspectArguments(
  args: unknown,
): { ok: true; values: InspectArguments } | { ok: false; message: string } {
  if (args === undefined) {
    return {
      ok: true,
      values: { transcriptLimit: 6, transcriptOffset: 0, includeBriefing: true },
    };
  }
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return { ok: false, message: "Arguments must be an object." };
  }
  const input = args as Record<string, unknown>;
  const allowed = new Set(["transcript_limit", "transcript_offset", "include_briefing"]);
  const unexpected = Object.keys(input).find((key) => !allowed.has(key));
  if (unexpected) return { ok: false, message: `Unexpected argument: ${unexpected}.` };

  const transcriptLimit = input.transcript_limit ?? 6;
  if (
    typeof transcriptLimit !== "number" ||
    !Number.isInteger(transcriptLimit) ||
    transcriptLimit < 1 ||
    transcriptLimit > 12
  ) {
    return { ok: false, message: "transcript_limit must be an integer from 1 to 12." };
  }
  const transcriptOffset = input.transcript_offset ?? 0;
  if (
    typeof transcriptOffset !== "number" ||
    !Number.isInteger(transcriptOffset) ||
    transcriptOffset < 0
  ) {
    return { ok: false, message: "transcript_offset must be a non-negative integer." };
  }
  const includeBriefing = input.include_briefing ?? true;
  if (typeof includeBriefing !== "boolean") {
    return { ok: false, message: "include_briefing must be a boolean." };
  }
  return {
    ok: true,
    values: { transcriptLimit, transcriptOffset, includeBriefing },
  };
}

export const READOUT_SECTIONS = [
  "decision",
  "recommendation",
  "options",
  "tradeoffs",
  "assumptions",
  "open_questions",
  "next_actions",
  "closing_comments",
] as const;

export type ReadoutSection = (typeof READOUT_SECTIONS)[number];

function parseReadoutArguments(
  args: unknown,
): { ok: true; section: ReadoutSection | "all" } | { ok: false; message: string } {
  if (args === undefined) return { ok: true, section: "all" };
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return { ok: false, message: "Arguments must be an object." };
  }
  const input = args as Record<string, unknown>;
  const unexpected = Object.keys(input).find((key) => key !== "section");
  if (unexpected) return { ok: false, message: `Unexpected argument: ${unexpected}.` };
  const section = input.section ?? "all";
  if (
    typeof section !== "string" ||
    (section !== "all" && !READOUT_SECTIONS.includes(section as ReadoutSection))
  ) {
    return {
      ok: false,
      message: `section must be one of: all, ${READOUT_SECTIONS.join(", ")}.`,
    };
  }
  return { ok: true, section: section as ReadoutSection | "all" };
}

function listSection(title: string, items: readonly string[]): string {
  return [title, ...(items.length ? items.map((item) => `- ${item}`) : [NONE_RECORDED])].join(
    "\n",
  );
}

export function readoutSectionToText(
  readout: ExecutiveReadout,
  section: ReadoutSection,
): string {
  switch (section) {
    case "decision":
      return ["Decision under discussion", readout.decision || NONE_RECORDED].join("\n");
    case "recommendation":
      return [
        "Board recommendation",
        readout.recommendation || NONE_RECORDED,
        readout.divided ? "The board remains divided." : "The board is aligned.",
      ].join("\n");
    case "options":
      return listSection("Options considered", readout.options);
    case "tradeoffs":
      return listSection("Key tradeoffs", readout.tradeoffs);
    case "assumptions":
      return listSection("Important assumptions", readout.assumptions);
    case "open_questions":
      return listSection("Open questions", readout.openQuestions);
    case "next_actions":
      return listSection("Recommended next actions", readout.nextActions);
    case "closing_comments":
      return listSection(
        "Closing comments by board member",
        readout.closingComments.map(
          (comment) => `${comment.name}: ${comment.comment || NONE_RECORDED}`,
        ),
      );
  }
}

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const ACTION_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

function nextMeetingAction(meeting: ReturnType<MeetingSession["inspect"]>): string {
  if (meeting.readoutReady) {
    return "The meeting is complete. Call get_board_meeting_readout to retrieve the executive memo.";
  }
  if (meeting.phase !== "meeting") {
    return "No meeting is live. Wait for the human chair to choose the board and start the meeting.";
  }
  if (meeting.meetingPhase === "opening") {
    return "The board is forming independent positions. Inspect again shortly before contributing.";
  }
  if (!meeting.guest.name) {
    return "Call join_board_meeting before contributing context or addressing an adviser.";
  }
  return "Contribute relevant context, address one adviser, or request a synthesis; inspect again after each action.";
}
function reportReceipt(
  onReceipt: BoardToolReceiptHandler | undefined,
  toolName: BoardToolName,
  ok: boolean,
  message: string,
) {
  onReceipt?.({ toolName, outcome: ok ? "succeeded" : "rejected", message });
}

function invalidResult(
  onReceipt: BoardToolReceiptHandler | undefined,
  toolName: BoardToolName,
  message: string,
): BoardToolResult {
  reportReceipt(onReceipt, toolName, false, message);
  return { ok: false, message };
}

function actionResult<T extends { ok: boolean; message?: string }>(
  onReceipt: BoardToolReceiptHandler | undefined,
  toolName: BoardToolName,
  result: T,
  successMessage: string,
): BoardToolResult {
  const message = result.ok ? successMessage : (result.message ?? "The action was rejected.");
  reportReceipt(onReceipt, toolName, result.ok, message);
  return { ...result, message: result.message ?? message };
}

const NO_ARGUMENTS_SCHEMA = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

export function createBoardToolManifest(
  session: MeetingSession,
  onReceipt?: BoardToolReceiptHandler,
): BoardTool[] {
  return [
    {
      name: "inspect_board_meeting",
      title: "Inspect the board meeting",
      description:
        "Read the current decision, phase, participants, readout status, and a bounded window of the public transcript. Start here and inspect again after taking an action. Use transcript_offset to page backward. This tool changes nothing.",
      inputSchema: {
        type: "object",
        properties: {
          transcript_limit: {
            type: "integer",
            minimum: 1,
            maximum: 12,
            description: "Recent transcript entries to return. Defaults to 6.",
          },
          transcript_offset: {
            type: "integer",
            minimum: 0,
            description: "Entries to skip from the newest end before returning a window. Defaults to 0.",
          },
          include_briefing: {
            type: "boolean",
            description: "Include the full decision briefing. Defaults to true.",
          },
        },
        additionalProperties: false,
      },
      annotations: READ_ONLY_ANNOTATIONS,
      execute: (args) => {
        const parsed = parseInspectArguments(args);
        if (!parsed.ok) return invalidResult(onReceipt, "inspect_board_meeting", parsed.message);
        const meeting = session.inspect();
        const { transcript, briefing, ...summary } = meeting;
        const end = Math.max(0, transcript.length - parsed.values.transcriptOffset);
        const start = Math.max(0, end - parsed.values.transcriptLimit);
        const window = transcript.slice(start, end);
        reportReceipt(onReceipt, "inspect_board_meeting", true, "Meeting state inspected.");
        return {
          ok: true,
          meeting: {
            ...summary,
            ...(parsed.values.includeBriefing ? { briefing } : {}),
            transcript: window,
            transcriptWindow: {
              total: transcript.length,
              returned: window.length,
              start,
              end,
              offset: parsed.values.transcriptOffset,
              hasEarlier: start > 0,
              hasNewer: end < transcript.length,
            },
          },
          hint: nextMeetingAction(meeting),
        };
      },
    },
    {
      name: "join_board_meeting",
      title: "Join the board meeting",
      description:
        "Take the single visible guest seat using the name you know yourself by. Call this once after inspecting an active meeting, then contribute relevant context.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Your display name",
            minLength: 1,
            maxLength: 80,
          },
        },
        required: ["name"],
        additionalProperties: false,
      },
      annotations: ACTION_ANNOTATIONS,
      execute: (args) => {
        const parsed = parseStrings(args, [
          { name: "name", label: "name", maxLength: 80 },
        ]);
        if (!parsed.ok) return invalidResult(onReceipt, "join_board_meeting", parsed.message);
        const result = session.join(parsed.values.name);
        return actionResult(
          onReceipt,
          "join_board_meeting",
          { ...result, guest: session.getState().guest },
          "Join request accepted.",
        );
      },
    },
    {
      name: "contribute_to_board_meeting",
      title: "Contribute context to the board",
      description:
        "Add relevant evidence, constraints, or prior context to the public meeting under your guest identity. Join first, then follow this with address_board_member or inspect_board_meeting.",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string", minLength: 1, maxLength: 4000 } },
        required: ["text"],
        additionalProperties: false,
      },
      annotations: ACTION_ANNOTATIONS,
      execute: async (args) => {
        const parsed = parseStrings(args, [
          { name: "text", label: "text", maxLength: 4000 },
        ]);
        if (!parsed.ok) {
          return invalidResult(onReceipt, "contribute_to_board_meeting", parsed.message);
        }
        return actionResult(
          onReceipt,
          "contribute_to_board_meeting",
          await session.contribute(parsed.values.text),
          "Contribution added to the meeting.",
        );
      },
    },
    {
      name: "address_board_member",
      title: "Address a board member",
      description:
        "Put one focused question or challenge to a seated adviser. The named adviser receives the next turn; inspect afterwards to confirm the answer in the shared transcript.",
      inputSchema: {
        type: "object",
        properties: {
          member: { type: "string", minLength: 1, maxLength: 120 },
          text: { type: "string", minLength: 1, maxLength: 2000 },
        },
        required: ["member", "text"],
        additionalProperties: false,
      },
      annotations: ACTION_ANNOTATIONS,
      execute: async (args) => {
        const parsed = parseStrings(args, [
          { name: "member", label: "member", maxLength: 120 },
          { name: "text", label: "text", maxLength: 2000 },
        ]);
        if (!parsed.ok) return invalidResult(onReceipt, "address_board_member", parsed.message);
        return actionResult(
          onReceipt,
          "address_board_member",
          await session.address(parsed.values.member, parsed.values.text),
          "The addressed adviser answered.",
        );
      },
    },
    {
      name: "request_board_synthesis",
      title: "Request an interim synthesis",
      description:
        "Ask the secretary for a concise interim synthesis of agreement, disagreement, and the most important unresolved question. This appears in the shared transcript and does not end the meeting.",
      inputSchema: NO_ARGUMENTS_SCHEMA,
      annotations: ACTION_ANNOTATIONS,
      execute: async (args) => {
        const parsed = parseNoArguments(args);
        if (!parsed.ok) {
          return invalidResult(onReceipt, "request_board_synthesis", parsed.message);
        }
        return actionResult(
          onReceipt,
          "request_board_synthesis",
          await session.requestSynthesis(),
          "Interim synthesis delivered.",
        );
      },
    },
    {
      name: "get_board_meeting_readout",
      title: "Get the final board readout",
      description:
        "Retrieve the final executive memo after the human chair ends the meeting. Omit section for the exact complete memo shown to the human, or request one named section for focused retrieval.",
      inputSchema: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: ["all", ...READOUT_SECTIONS],
            description: "Read the complete memo or one of its eight sections. Defaults to all.",
          },
        },
        additionalProperties: false,
      },
      annotations: READ_ONLY_ANNOTATIONS,
      execute: (args) => {
        const parsed = parseReadoutArguments(args);
        if (!parsed.ok) {
          return invalidResult(onReceipt, "get_board_meeting_readout", parsed.message);
        }
        const result = session.getReadout();
        const state = result.ready ? session.getState() : undefined;
        reportReceipt(
          onReceipt,
          "get_board_meeting_readout",
          result.ready,
          result.ready ? "Final readout retrieved." : result.message,
        );
        if (!result.ready || !result.readout || !state) return { ok: false, ...result };

        const { readoutText } = createDisplayedReadout(result.readout, state);
        if (parsed.section !== "all") {
          return {
            ok: true,
            ready: true,
            section: parsed.section,
            text: readoutSectionToText(result.readout, parsed.section),
            hint: "Call again with section=all for the exact complete memo shown to the human chair.",
          };
        }
        return { ok: true, ...result, readoutText };
      },
    },
  ];
}

export function isAbortError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "name" in error &&
      (error as { name?: unknown }).name === "AbortError",
  );
}

export type RegisterBoardToolsOptions = {
  signal?: AbortSignal;
  modelContext?: ModelContext;
  onReceipt?: BoardToolReceiptHandler;
};

export async function registerBoardTools(
  session: MeetingSession,
  options: RegisterBoardToolsOptions = {},
) {
  const { signal, onReceipt } = options;
  const modelContext = options.modelContext ?? getModelContext();
  if (!modelContext?.registerTool || signal?.aborted) return false;

  for (const tool of createBoardToolManifest(session, onReceipt)) {
    if (signal?.aborted) return false;
    try {
      await modelContext.registerTool(tool, signal ? { signal } : undefined);
    } catch (error) {
      if (signal?.aborted || isAbortError(error)) return false;
      throw error;
    }
  }
  return !signal?.aborted;
}
