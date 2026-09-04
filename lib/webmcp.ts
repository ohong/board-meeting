import type { MeetingSession } from "./session";

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

export type BoardTool = {
  name: BoardToolName;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean };
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

function receipt(
  session: MeetingSession,
  toolName: BoardToolName,
  ok: boolean,
  message: string,
) {
  session.recordToolReceipt(toolName, ok, message);
}

function invalidResult(
  session: MeetingSession,
  toolName: BoardToolName,
  message: string,
): BoardToolResult {
  receipt(session, toolName, false, message);
  return { ok: false, message };
}

function actionResult(
  session: MeetingSession,
  toolName: BoardToolName,
  result: { ok: boolean; message?: string },
  successMessage: string,
): BoardToolResult {
  const message = result.ok ? successMessage : (result.message ?? "The action was rejected.");
  receipt(session, toolName, result.ok, message);
  return { ...result, message: result.message ?? message };
}

const NO_ARGUMENTS_SCHEMA = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

export function createBoardToolManifest(session: MeetingSession): BoardTool[] {
  return [
    {
      name: "inspect_board_meeting",
      description: "Inspect the active board meeting: briefing, phase, participants, and transcript.",
      inputSchema: NO_ARGUMENTS_SCHEMA,
      annotations: { readOnlyHint: true },
      execute: (args) => {
        const parsed = parseNoArguments(args);
        if (!parsed.ok) return invalidResult(session, "inspect_board_meeting", parsed.message);
        const meeting = session.inspect();
        receipt(session, "inspect_board_meeting", true, "Meeting state inspected.");
        return { ok: true, meeting };
      },
    },
    {
      name: "join_board_meeting",
      description: "Join the guest seat using the name you know yourself by.",
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
      annotations: { readOnlyHint: false },
      execute: (args) => {
        const parsed = parseStrings(args, [
          { name: "name", label: "name", maxLength: 80 },
        ]);
        if (!parsed.ok) return invalidResult(session, "join_board_meeting", parsed.message);
        return actionResult(
          session,
          "join_board_meeting",
          session.join(parsed.values.name),
          "Join request accepted.",
        );
      },
    },
    {
      name: "contribute_to_board_meeting",
      description: "Contribute relevant context or a statement to the public meeting.",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string", minLength: 1, maxLength: 4000 } },
        required: ["text"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (args) => {
        const parsed = parseStrings(args, [
          { name: "text", label: "text", maxLength: 4000 },
        ]);
        if (!parsed.ok) {
          return invalidResult(session, "contribute_to_board_meeting", parsed.message);
        }
        return actionResult(
          session,
          "contribute_to_board_meeting",
          await session.contribute(parsed.values.text),
          "Contribution added to the meeting.",
        );
      },
    },
    {
      name: "address_board_member",
      description: "Address a named board member with a focused question or statement.",
      inputSchema: {
        type: "object",
        properties: {
          member: { type: "string", minLength: 1, maxLength: 120 },
          text: { type: "string", minLength: 1, maxLength: 2000 },
        },
        required: ["member", "text"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (args) => {
        const parsed = parseStrings(args, [
          { name: "member", label: "member", maxLength: 120 },
          { name: "text", label: "text", maxLength: 2000 },
        ]);
        if (!parsed.ok) return invalidResult(session, "address_board_member", parsed.message);
        return actionResult(
          session,
          "address_board_member",
          await session.address(parsed.values.member, parsed.values.text),
          "The addressed adviser answered.",
        );
      },
    },
    {
      name: "request_board_synthesis",
      description: "Request a concise interim synthesis of agreement, disagreement, and the open question.",
      inputSchema: NO_ARGUMENTS_SCHEMA,
      annotations: { readOnlyHint: false },
      execute: async (args) => {
        const parsed = parseNoArguments(args);
        if (!parsed.ok) return invalidResult(session, "request_board_synthesis", parsed.message);
        return actionResult(
          session,
          "request_board_synthesis",
          await session.requestSynthesis(),
          "Interim synthesis delivered.",
        );
      },
    },
    {
      name: "get_board_meeting_readout",
      description: "Retrieve the final executive readout after the human chair ends the meeting.",
      inputSchema: NO_ARGUMENTS_SCHEMA,
      annotations: { readOnlyHint: true },
      execute: (args) => {
        const parsed = parseNoArguments(args);
        if (!parsed.ok) return invalidResult(session, "get_board_meeting_readout", parsed.message);
        const result = session.getReadout();
        receipt(
          session,
          "get_board_meeting_readout",
          result.ready,
          result.ready ? "Final readout retrieved." : result.message,
        );
        return { ok: result.ready, ...result };
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

export async function registerBoardTools(
  session: MeetingSession,
  signal?: AbortSignal,
  modelContext = getModelContext(),
) {
  if (!modelContext?.registerTool || signal?.aborted) return false;

  for (const tool of createBoardToolManifest(session)) {
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
