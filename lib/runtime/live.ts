import { Buffer } from "node:buffer";
import { getVercelOidcToken } from "@vercel/oidc";
import {
  Client,
  isCurrentTurnBoundaryEvent,
  type MessageStreamEvent,
} from "eve/client";

import { createMockRuntime } from "./mock";
import {
  adviserSlugSchema,
  boardWorkflowResultSchema,
  executiveReadoutCoreSchema,
  memberTurnSchema,
  openingPositionSchema,
  outputSchemaForCapability,
  textResultSchema,
} from "./schemas";
import type {
  BoardRuntime,
  PublicTurnOptions,
  RuntimeTurnInput,
  TranscriptEvent,
  TurnCapability,
} from "../types";

const BOARD_RUNTIME_TOOL = "board_runtime";
const SECRETARY_TARGET = "secretary";

type WorkflowCapability = TurnCapability;
type WorkflowTarget = string;

export type EveInvocationResult = {
  status: "completed" | "failed" | "waiting";
  events: readonly MessageStreamEvent[];
};

export type EveInvoker = (input: {
  host: string;
  message: string;
  expectedTarget: string;
  signal?: AbortSignal;
  onStream?: PublicTurnOptions["onStream"];
}) => Promise<EveInvocationResult>;

export type LiveRuntimeOptions = {
  eveHost?: string;
  invokeEve?: EveInvoker;
};

export class EveRuntimeContractError extends Error {
  constructor(
    readonly code:
      | "EVE_SESSION_FAILED"
      | "EVE_WORKFLOW_CALL_INVALID"
      | "EVE_SUBAGENT_CALL_INVALID"
      | "EVE_STRUCTURED_OUTPUT_INVALID"
      | "EVE_ROUTING_MISMATCH",
    message: string,
  ) {
    super(message);
    this.name = "EveRuntimeContractError";
  }
}

export function hasLiveKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function resolveEveHost(request?: Request, explicitHost = process.env.EVE_HOST): string {
  const candidate = explicitHost?.trim() || (request ? new URL(request.url).origin : "");
  if (!candidate) {
    throw new Error("The Eve host is required for a server-side live runtime call.");
  }

  const url = new URL(candidate);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("The Eve host must use http or https.");
  }
  return url.toString().replace(/\/$/, "");
}

function shouldUseVercelOidc(): boolean {
  return process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "development";
}

function createEveClient(host: string): Client {
  if (!shouldUseVercelOidc()) return new Client({ host });

  return new Client({
    host,
    auth: {
      vercelOidc: {
        token: async () => {
          try {
            return await getVercelOidcToken();
          } catch (error) {
            throw new Error("Could not obtain same-project Vercel OIDC credentials for Eve.", {
              cause: error,
            });
          }
        },
      },
    },
    redirect: "error",
  });
}

type EveResponseLike = AsyncIterable<MessageStreamEvent> & {
  cancel(): Promise<unknown>;
};

export type EveClientLike = {
  sessions: {
    create(input: {
      message: string;
      signal?: AbortSignal;
    }): Promise<{ response: EveResponseLike }>;
    attach(sessionId: string): {
      stream(options: { signal?: AbortSignal; startIndex?: number }): AsyncIterable<MessageStreamEvent>;
    };
  };
};

function statusFromEvents(events: readonly MessageStreamEvent[]): EveInvocationResult["status"] {
  if (events.some((event) => event.type === "session.failed")) return "failed";
  if (events.some((event) => event.type === "session.completed")) return "completed";
  return "waiting";
}

async function relayExpectedChild(
  client: EveClientLike,
  call: Extract<MessageStreamEvent, { type: "subagent.called" }>,
  expectedTarget: string,
  signal: AbortSignal,
  onStream: NonNullable<PublicTurnOptions["onStream"]>,
) {
  const child = client.sessions.attach(call.data.childSessionId);
  let authenticatedChild = false;
  let visibleMessage = "";
  for await (const event of child.stream({ signal, startIndex: 0 })) {
    signal.throwIfAborted();
    if (!authenticatedChild && event.type !== "session.started") {
      throw new EveRuntimeContractError(
        "EVE_SUBAGENT_CALL_INVALID",
        "The Eve child stream emitted an event before authenticating its delegated subagent invocation.",
      );
    }
    if (event.type === "session.started") {
      const invocation = event.data.invocation;
      if (
        invocation?.kind !== "subagent" ||
        invocation.name !== expectedTarget ||
        invocation.parentCallId !== call.data.callId ||
        invocation.parentSessionId !== call.data.sessionId ||
        invocation.parentTurnId !== call.data.turnId
      ) {
        throw new EveRuntimeContractError(
          "EVE_SUBAGENT_CALL_INVALID",
          `The attached Eve child session was not the expected subagent '${expectedTarget}'.`,
        );
      }
      authenticatedChild = true;
    } else if (event.type === "step.started" || event.type === "step.failed") {
      visibleMessage = "";
      onStream({ type: "reset" });
    } else if (event.type === "message.appended") {
      visibleMessage += event.data.messageDelta;
      onStream({ type: "append", delta: event.data.messageDelta });
    } else if (
      event.type === "message.completed" &&
      event.data.finishReason !== "tool-calls" &&
      event.data.message !== null &&
      event.data.message !== visibleMessage
    ) {
      // Eve can retain abandoned provider-attempt deltas. The completed block
      // is authoritative, so reconcile the ephemeral projection before the
      // workflow result is validated and made durable by the caller.
      visibleMessage = event.data.message;
      onStream({ type: "reset" });
      onStream({ type: "append", delta: visibleMessage });
    }
    if (isCurrentTurnBoundaryEvent(event)) break;
  }
  if (!authenticatedChild) {
    throw new EveRuntimeContractError(
      "EVE_SUBAGENT_CALL_INVALID",
      "The Eve child stream did not identify its delegated subagent invocation.",
    );
  }
}

export function createEveInvoker(
  clientFactory: (host: string) => EveClientLike = createEveClient,
): EveInvoker {
  return async ({ host, message, expectedTarget, signal, onStream }) => {
    signal?.throwIfAborted();
    const client = clientFactory(host);
    const transportController = new AbortController();
    const transportSignal = transportController.signal;
    let response: EveResponseLike | undefined;
    let aborting: Promise<void> | undefined;
    const abortTurn = () => {
      if (!response) {
        transportController.abort(signal?.reason);
        return;
      }
      aborting ??= response
        .cancel()
        .catch(() => undefined)
        .then(() => transportController.abort(signal?.reason));
    };
    signal?.addEventListener("abort", abortTurn, { once: true });
    try {
      // Every capability starts a fresh Eve session; lib/session.ts still owns
      // meeting-level Promise.all concurrency.
      ({ response } = await client.sessions.create({ message, signal: transportSignal }));
      if (signal?.aborted) abortTurn();

      const events: MessageStreamEvent[] = [];
      let childRelay: Promise<void> | undefined;
      let childError: unknown;
      for await (const event of response) {
        events.push(event);
        if (
          onStream &&
          childRelay === undefined &&
          event.type === "subagent.called" &&
          event.data.name === expectedTarget &&
          event.data.toolName === expectedTarget
        ) {
          childRelay = relayExpectedChild(
            client,
            event,
            expectedTarget,
            transportSignal,
            onStream,
          ).catch((error: unknown) => {
            childError = error;
          });
        }
      }
      await childRelay;
      if (childError) throw childError;
      signal?.throwIfAborted();
      return { status: statusFromEvents(events), events };
    } finally {
      signal?.removeEventListener("abort", abortTurn);
      if (aborting) await aborting;
    }
  };
}

const defaultEveInvoker = createEveInvoker();

function recentTranscript(events: TranscriptEvent[]): TranscriptEvent[] {
  return events.slice(-24);
}

function memberMessage(input: RuntimeTurnInput): string {
  const instructions = {
    formOpeningPosition:
      "Form a private opening position. Be specific. Keep every field under 80 words.",
    publicTurn: "Take the next public turn in 30-70 words and never exceed 90 words.",
    answerDirect:
      "Answer the chair or named participant directly in 30-70 words and never exceed 90 words.",
    closingComment:
      "Give a 40-70 word closing comment with the most important recommendation, unresolved concern, or next action.",
  } as const;

  const responseContract =
    input.capability === "publicTurn" || input.capability === "answerDirect"
      ? "Return only the words you would say aloud. Do not return JSON, routing metadata, or markdown."
      : "Return only the structured value required by the output schema.";
  return [
    `Board capability: ${input.capability}.`,
    instructions[input.capability as keyof typeof instructions],
    "Use only the supplied meeting state and your authored adviser instructions.",
    responseContract,
    JSON.stringify({ ...input, transcript: recentTranscript(input.transcript) }),
  ].join("\n\n");
}

function secretaryMessage(capability: "synthesis" | "readout", input: unknown): string {
  const task =
    capability === "synthesis"
      ? "Write a concise interim synthesis covering current agreement, current disagreement, and the most important unresolved question. Return it in the text field."
      : "Produce the executive readout. Preserve disagreement and do not invent facts. Closing comments are source material and are attached unchanged by the caller after your structured result.";
  return [
    `Board capability: ${capability}.`,
    task,
    "Use only the supplied meeting state and your authored secretary instructions.",
    "Return only the structured value required by the output schema.",
    JSON.stringify(input),
  ].join("\n\n");
}

function encodeRoutingEnvelope(
  capability: WorkflowCapability,
  target: WorkflowTarget,
  message: string,
): string {
  return Buffer.from(
    JSON.stringify({ version: 1, capability, target, message }),
    "utf8",
  ).toString("base64url");
}

function rootMessage(routingEnvelope: string): string {
  return [
    "Call board_runtime exactly once with the immutable routing envelope below.",
    "Do not decode or alter it. Do not call another tool. Do not answer substantively.",
    `routingEnvelope: ${routingEnvelope}`,
  ].join("\n");
}

function extractWorkflowOutput(
  invocation: EveInvocationResult,
  expected: {
    capability: WorkflowCapability;
    target: WorkflowTarget;
    routingEnvelope: string;
  },
): unknown {
  if (invocation.status === "failed") {
    throw new EveRuntimeContractError(
      "EVE_SESSION_FAILED",
      "The Eve root session failed before producing a board result.",
    );
  }

  const requestedActions = invocation.events.flatMap((event) =>
    event.type === "actions.requested" ? [...event.data.actions] : [],
  );
  const workflowCall = requestedActions[0];
  if (
    requestedActions.length !== 1 ||
    !workflowCall ||
    workflowCall.kind !== "workflow-tool-call" ||
    workflowCall.toolName !== BOARD_RUNTIME_TOOL ||
    workflowCall.input.routingEnvelope !== expected.routingEnvelope
  ) {
    throw new EveRuntimeContractError(
      "EVE_WORKFLOW_CALL_INVALID",
      "The Eve root must call board_runtime exactly once with the caller's immutable routing envelope.",
    );
  }

  const subagentCalls = invocation.events.filter(
    (event): event is Extract<MessageStreamEvent, { type: "subagent.called" }> =>
      event.type === "subagent.called",
  );
  if (
    subagentCalls.length !== 1 ||
    subagentCalls[0]?.data.name !== expected.target ||
    subagentCalls[0]?.data.toolName !== expected.target
  ) {
    throw new EveRuntimeContractError(
      "EVE_SUBAGENT_CALL_INVALID",
      `The Eve workflow did not call the expected subagent '${expected.target}'.`,
    );
  }

  const workflowResults = invocation.events
    .filter(
      (event): event is Extract<MessageStreamEvent, { type: "action.result" }> =>
        event.type === "action.result",
    )
    .filter(
      (event) =>
        event.data.result.kind === "tool-result" &&
        event.data.result.toolName === BOARD_RUNTIME_TOOL,
    );
  const workflowResult = workflowResults[0];
  const toolResult = workflowResult?.data.result;
  if (
    workflowResults.length !== 1 ||
    !workflowResult ||
    workflowResult.data.status !== "completed" ||
    !toolResult ||
    toolResult.kind !== "tool-result" ||
    toolResult.callId !== workflowCall.callId ||
    toolResult.isError
  ) {
    throw new EveRuntimeContractError(
      "EVE_STRUCTURED_OUTPUT_INVALID",
      "The board_runtime workflow did not produce one successful structured result.",
    );
  }

  const workflowOutput = boardWorkflowResultSchema.safeParse(toolResult.output);
  if (!workflowOutput.success) {
    throw new EveRuntimeContractError(
      "EVE_STRUCTURED_OUTPUT_INVALID",
      "The board_runtime workflow result did not match its output envelope schema.",
    );
  }
  if (
    workflowOutput.data.capability !== expected.capability ||
    workflowOutput.data.target !== expected.target
  ) {
    throw new EveRuntimeContractError(
      "EVE_ROUTING_MISMATCH",
      "The board_runtime workflow returned a result for a different route.",
    );
  }

  const parsed = outputSchemaForCapability(expected.capability).safeParse(
    workflowOutput.data.result,
  );
  if (!parsed.success) {
    throw new EveRuntimeContractError(
      "EVE_STRUCTURED_OUTPUT_INVALID",
      `The ${expected.capability} result failed its structured output schema.`,
    );
  }
  return parsed.data;
}

export function createLiveRuntime(options: LiveRuntimeOptions = {}): BoardRuntime {
  const host = resolveEveHost(undefined, options.eveHost);
  const invokeEve = options.invokeEve ?? defaultEveInvoker;

  async function invoke(
    capability: WorkflowCapability,
    target: WorkflowTarget,
    message: string,
    options?: PublicTurnOptions,
  ): Promise<unknown> {
    const routingEnvelope = encodeRoutingEnvelope(capability, target, message);
    const invocation = await invokeEve({
      host,
      message: rootMessage(routingEnvelope),
      expectedTarget: target,
      signal: options?.signal,
      onStream: options?.onStream,
    });
    return extractWorkflowOutput(invocation, { capability, target, routingEnvelope });
  }

  return {
    id: "live",
    async formOpeningPosition(input) {
      const target = adviserSlugSchema.parse(input.memberId);
      const result = openingPositionSchema.parse(
        await invoke("formOpeningPosition", target, memberMessage(input)),
      );
      if (result.memberId !== target) {
        throw new EveRuntimeContractError(
          "EVE_ROUTING_MISMATCH",
          "The opening position identified a different adviser than the selected seat.",
        );
      }
      return result;
    },
    async publicTurn(input, options) {
      const target = adviserSlugSchema.parse(input.memberId);
      if (input.capability !== "publicTurn" && input.capability !== "answerDirect") {
        throw new EveRuntimeContractError(
          "EVE_ROUTING_MISMATCH",
          "The public-turn runtime received a non-public capability.",
        );
      }
      return memberTurnSchema.parse(
        await invoke(input.capability, target, memberMessage(input), options),
      );
    },
    async closingComment(input) {
      const target = adviserSlugSchema.parse(input.memberId);
      return textResultSchema.parse(
        await invoke("closingComment", target, memberMessage(input)),
      ).text;
    },
    async synthesis(input) {
      return textResultSchema.parse(
        await invoke("synthesis", SECRETARY_TARGET, secretaryMessage("synthesis", input)),
      ).text;
    },
    async readout(input) {
      const result = executiveReadoutCoreSchema.parse(
        await invoke(
          "readout",
          SECRETARY_TARGET,
          secretaryMessage("readout", input),
        ),
      );
      return { ...result, closingComments: input.closingComments };
    },
  };
}

export function createRuntime(options: LiveRuntimeOptions = {}): BoardRuntime {
  return hasLiveKey() ? createLiveRuntime(options) : createMockRuntime();
}
