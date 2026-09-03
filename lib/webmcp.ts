import type { MeetingSession } from "./session";
import { formatReadout } from "./format";

type ToolResult = { content: { type: "text"; text: string }[] };

function textResult(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      execute: (args: Record<string, unknown>) => Promise<ToolResult> | ToolResult;
    },
    options?: { signal?: AbortSignal },
  ) => Promise<void> | void;
};

export function getModelContext(): ModelContext | undefined {
  const doc = document as Document & { modelContext?: ModelContext };
  const nav = navigator as Navigator & { modelContext?: ModelContext };
  return doc.modelContext ?? nav.modelContext;
}

export async function registerBoardTools(session: MeetingSession, signal?: AbortSignal) {
  const modelContext = getModelContext();
  if (!modelContext?.registerTool) return false;

  const tools = [
    {
      name: "inspect_board_meeting",
      description: "Inspect the active board meeting: briefing, phase, participants, and transcript.",
      inputSchema: { type: "object", properties: {} },
      execute: () => textResult(JSON.stringify(session.inspect(), null, 2)),
    },
    {
      name: "join_board_meeting",
      description: "Join the guest seat using the name you know yourself by.",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string", description: "Your display name" } },
        required: ["name"],
      },
      execute: (args: Record<string, unknown>) => {
        const result = session.join(String(args.name ?? ""));
        return textResult(JSON.stringify(result));
      },
    },
    {
      name: "contribute_to_board_meeting",
      description: "Contribute relevant context or a statement to the public meeting.",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
      execute: async (args: Record<string, unknown>) => {
        const result = await session.contribute(String(args.text ?? ""));
        return textResult(JSON.stringify(result));
      },
    },
    {
      name: "address_board_member",
      description: "Address a named board member with a focused question or statement.",
      inputSchema: {
        type: "object",
        properties: {
          member: { type: "string" },
          text: { type: "string" },
        },
        required: ["member", "text"],
      },
      execute: async (args: Record<string, unknown>) => {
        const result = await session.address(String(args.member ?? ""), String(args.text ?? ""));
        return textResult(JSON.stringify(result));
      },
    },
    {
      name: "request_board_synthesis",
      description: "Request a concise interim synthesis of agreement, disagreement, and the open question.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        const result = await session.requestSynthesis();
        return textResult(JSON.stringify(result));
      },
    },
    {
      name: "get_board_meeting_readout",
      description: "Retrieve the final executive readout after the human chair ends the meeting.",
      inputSchema: { type: "object", properties: {} },
      execute: () => {
        const result = session.getReadout();
        if (!result.ready) return textResult(JSON.stringify(result));
        return textResult(formatReadout(result.readout!));
      },
    },
  ];

  for (const tool of tools) {
    await modelContext.registerTool(tool, signal ? { signal } : undefined);
  }
  return true;
}
