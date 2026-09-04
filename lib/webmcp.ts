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
export type BoardToolReceipt = Readonly<{
  toolName: BoardToolName;
  outcome: "succeeded" | "rejected";
  message: string;
}>;
export type BoardToolReceiptHandler = (receipt: BoardToolReceipt) => void;

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

function actionResult(
  onReceipt: BoardToolReceiptHandler | undefined,
  toolName: BoardToolName,
  result: { ok: boolean; message?: string },
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
      description: "Inspect the active board meeting: briefing, phase, participants, and transcript.",
      inputSchema: NO_ARGUMENTS_SCHEMA,
      annotations: { readOnlyHint: true },
      execute: (args) => {
        const parsed = parseNoArguments(args);
        if (!parsed.ok) return invalidResult(onReceipt, "inspect_board_meeting", parsed.message);
        const meeting = session.inspect();
        reportReceipt(onReceipt, "inspect_board_meeting", true, "Meeting state inspected.");
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
        if (!parsed.ok) return invalidResult(onReceipt, "join_board_meeting", parsed.message);
        return actionResult(
          onReceipt,
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
      description: "Request a concise interim synthesis of agreement, disagreement, and the open question.",
      inputSchema: NO_ARGUMENTS_SCHEMA,
      annotations: { readOnlyHint: false },
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
      description: "Retrieve the final executive readout after the human chair ends the meeting.",
      inputSchema: NO_ARGUMENTS_SCHEMA,
      annotations: { readOnlyHint: true },
      execute: (args) => {
        const parsed = parseNoArguments(args);
        if (!parsed.ok) {
          return invalidResult(onReceipt, "get_board_meeting_readout", parsed.message);
        }
        const result = session.getReadout();
        reportReceipt(
          onReceipt,
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
