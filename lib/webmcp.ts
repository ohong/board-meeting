import { formatReadout } from "./format";
import type { MeetingSession } from "./session";

type ToolResult = { content: { type: "text"; text: string }[] };

type ToolDescriptor = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<ToolResult> | ToolResult;
};

type ModelContext = {
  registerTool: (tool: ToolDescriptor, options?: { signal?: AbortSignal }) => Promise<void> | void;
};

function text(value: string): ToolResult {
  return { content: [{ type: "text", text: value }] };
}

function json(value: unknown): ToolResult {
  return text(JSON.stringify(value, null, 2));
}

function arg(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

/**
 * `document.modelContext` is the current imperative WebMCP surface; `navigator.modelContext`
 * is the deprecated alias still present in some builds. Both are checked so the demo works
 * in whichever the presenter's browser exposes.
 */
export function getModelContext(): ModelContext | undefined {
  if (typeof document === "undefined") return undefined;
  const fromDocument = (document as Document & { modelContext?: ModelContext }).modelContext;
  const fromNavigator =
    typeof navigator === "undefined"
      ? undefined
      : (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
  const context = fromDocument ?? fromNavigator;
  return typeof context?.registerTool === "function" ? context : undefined;
}

/**
 * The six site tools. Each one calls exactly the session action the human interface calls,
 * so there is one transcript and one source of truth. Results are written for the agent
 * reading them: they say what changed and what is now possible.
 */
export function boardTools(session: MeetingSession): ToolDescriptor[] {
  return [
    {
      name: "inspect_board_meeting",
      description:
        "Read the current state of the board meeting on this page: the chair's decision briefing, the meeting phase, who is seated, the guest seat, the public transcript, and whether a final readout exists. Read-only.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: () => json(session.inspect()),
    },
    {
      name: "join_board_meeting",
      description:
        "Take the guest seat at the live board meeting, using the name you know yourself by. One external agent may join a meeting. You cannot end the meeting.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name you know yourself by. This is shown on your seat and in the transcript.",
          },
        },
        required: ["name"],
        additionalProperties: false,
      },
      execute: (args) => json(session.join(arg(args, "name"))),
    },
    {
      name: "contribute_to_board_meeting",
      description:
        "Add context or a statement to the public meeting record, attributed to you. Every seated adviser sees it from their next turn. Use this for context you already hold that the board is missing.",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string", description: "What you want the board to know." } },
        required: ["text"],
        additionalProperties: false,
      },
      execute: async (args) => json(await session.contribute(arg(args, "text"))),
    },
    {
      name: "address_board_member",
      description:
        "Put a focused question or statement to one named adviser. They get next-turn priority and answer directly, in front of the whole room. Their answer comes back in the result.",
      inputSchema: {
        type: "object",
        properties: {
          member: { type: "string", description: "The adviser's name, as shown on their seat." },
          text: { type: "string", description: "The question or statement for them." },
        },
        required: ["member", "text"],
        additionalProperties: false,
      },
      execute: async (args) => json(await session.address(arg(args, "member"), arg(args, "text"))),
    },
    {
      name: "request_board_synthesis",
      description:
        "Ask the secretary for a short interim synthesis: where the board agrees, where it is divided and who holds which side, and the most important unresolved question. This does not end the meeting.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: async () => json(await session.requestSynthesis()),
    },
    {
      name: "get_board_meeting_readout",
      description:
        "Retrieve the complete executive readout after the human chair has ended the meeting. Returns a not-ready status if the meeting is still running.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: () => {
        const result = session.getReadout();
        if (!result.ready || !result.readout) return json({ ready: false, message: result.message });
        return text(formatReadout(result.readout));
      },
    },
  ];
}

export type RegistrationResult = { supported: boolean; toolNames: string[] };

/** Registers the tools on the top-level page. Aborting `signal` unregisters them. */
export async function registerBoardTools(
  session: MeetingSession,
  signal?: AbortSignal,
): Promise<RegistrationResult> {
  const modelContext = getModelContext();
  const tools = boardTools(session);
  if (!modelContext) return { supported: false, toolNames: tools.map((tool) => tool.name) };

  for (const tool of tools) {
    await modelContext.registerTool(tool, signal ? { signal } : undefined);
  }
  return { supported: true, toolNames: tools.map((tool) => tool.name) };
}
