export type BoardMeetingPhase = 'select' | 'brief' | 'meeting' | 'summary';

export type BoardMeetingSnapshot = {
  question: string;
  context: string;
  phase: BoardMeetingPhase;
  board: string[];
  participants: string[];
  transcript: Array<{ speaker: string; text: string }>;
  readoutReady: boolean;
};

export type BoardMeetingReadout = {
  recommendation: string;
  options: string[];
  agreement: string[];
  tensions: string[];
  assumptions: string[];
  openQuestions: string[];
  nextActions: string[];
};

export type BoardMeetingToolAdapter = {
  inspect: () => BoardMeetingSnapshot;
  join: (name: string) => { status: string; participant: string };
  contribute: (text: string) => { status: string; contribution: string };
  address: (
    member: string,
    text: string,
  ) => Promise<{ status: string; member: string; response: string }>;
  requestSynthesis: () => { status: string; synthesis: string };
  getReadout: () =>
    | { ready: false; message: string }
    | { ready: true; readout: BoardMeetingReadout };
};

type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute: (input: unknown) => unknown;
};

type ModelContext = {
  registerTool: (
    tool: ToolDefinition,
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

declare global {
  interface Document {
    readonly modelContext?: ModelContext;
  }
}

function inputRecord(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Tool input must be an object.');
  }
  return input as Record<string, unknown>;
}

function requiredText(input: unknown, key: string, maximumLength = 2_000) {
  const value = inputRecord(input)[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} must be a non-empty string.`);
  }
  const normalized = value.trim();
  if (normalized.length > maximumLength) {
    throw new Error(`${key} must be ${maximumLength} characters or fewer.`);
  }
  return normalized;
}

const emptyInputSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
};

export async function registerBoardMeetingTools(
  getAdapter: () => BoardMeetingToolAdapter,
  signal: AbortSignal,
) {
  const context =
    typeof document === 'undefined' ? undefined : document.modelContext;
  if (!context?.registerTool) return false;

  const tools: ToolDefinition[] = [
    {
      name: 'inspect_board_meeting',
      title: 'Inspect board meeting',
      description:
        'Read the active board meeting briefing, participants, public transcript, and current phase. This never changes the meeting.',
      inputSchema: emptyInputSchema,
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => getAdapter().inspect(),
    },
    {
      name: 'join_board_meeting',
      title: 'Join board meeting',
      description:
        'Join the active meeting in its single guest seat using the name you know yourself by. Use before contributing.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 60,
            description: 'Your display name.',
          },
        },
        required: ['name'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => getAdapter().join(requiredText(input, 'name', 60)),
    },
    {
      name: 'contribute_to_board_meeting',
      title: 'Contribute to board meeting',
      description:
        'Add relevant context or a concise statement to the shared meeting transcript after joining.',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            minLength: 1,
            maxLength: 2_000,
            description: 'Context or statement to share with the room.',
          },
        },
        required: ['text'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: (input) => getAdapter().contribute(requiredText(input, 'text')),
    },
    {
      name: 'address_board_member',
      title: 'Address board member',
      description:
        'Ask one selected board member a focused question or share a statement that should receive a direct response.',
      inputSchema: {
        type: 'object',
        properties: {
          member: {
            type: 'string',
            minLength: 1,
            maxLength: 80,
            description: 'Name of a selected board member.',
          },
          text: {
            type: 'string',
            minLength: 1,
            maxLength: 2_000,
            description: 'Focused question or statement for that member.',
          },
        },
        required: ['member', 'text'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: (input) =>
        getAdapter().address(
          requiredText(input, 'member', 80),
          requiredText(input, 'text'),
        ),
    },
    {
      name: 'request_board_synthesis',
      title: 'Request board synthesis',
      description:
        'Add a concise interim synthesis of agreement, disagreement, and the key unresolved question without ending the meeting.',
      inputSchema: emptyInputSchema,
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: () => getAdapter().requestSynthesis(),
    },
    {
      name: 'get_board_meeting_readout',
      title: 'Get board meeting readout',
      description:
        'Retrieve the final executive readout after the human chair ends the meeting. Returns an explicit not-ready result before then.',
      inputSchema: emptyInputSchema,
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () => getAdapter().getReadout(),
    },
  ];

  for (const tool of tools) {
    await context.registerTool(tool, { signal });
  }
  return true;
}
