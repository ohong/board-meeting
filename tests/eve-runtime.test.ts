import { Buffer } from "node:buffer";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { MessageStreamEvent } from "eve/client";

import { CATALOG } from "../lib/catalog";
import {
  createLiveRuntime,
  createEveInvoker,
  createRuntime,
  EveRuntimeContractError,
  type EveClientLike,
  type EveInvoker,
} from "../lib/runtime/live";
import { ADVISER_COUNT, PUBLIC_TURN_MAX_CHARS } from "../lib/runtime/schemas";
import type { RuntimeTurnInput } from "../lib/types";

const priorKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (priorKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = priorKey;
});

function baseInput(
  capability: RuntimeTurnInput["capability"] = "publicTurn",
): RuntimeTurnInput {
  return {
    capability,
    memberId: "daniel-ek",
    memberName: "Daniel Ek",
    briefing: "Question: Should we change the plan?",
    phase: "discussion",
    transcript: [],
    ownPriorStatements: [],
    boardNames: ["Daniel Ek", "David Heinemeier Hansson", "Lulu Cheng Meservey"],
  };
}

function routingEnvelopeFrom(message: string) {
  const encoded = message.match(/^routingEnvelope: (.+)$/m)?.[1];
  if (!encoded) throw new Error("Missing routing envelope in test invocation.");
  return {
    encoded,
    decoded: JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      capability: string;
      message: string;
      target: string;
    },
  };
}

function successfulInvoker(
  structuredResult: unknown,
  mutateTarget?: (target: string) => string,
): EveInvoker {
  return async ({ message }) => {
    const { encoded, decoded } = routingEnvelopeFrom(message);
    const target = mutateTarget?.(decoded.target) ?? decoded.target;
    return {
      status: "waiting",
      events: [
        {
          type: "actions.requested",
          data: {
            actions: [
              {
                callId: "call_workflow",
                input: { routingEnvelope: encoded },
                kind: "workflow-tool-call",
                toolName: "board_runtime",
                workflowId: "workflow_board_runtime",
              },
            ],
          },
        },
        {
          type: "subagent.called",
          data: { name: target, toolName: target },
        },
        {
          type: "action.result",
          data: {
            status: "completed",
            result: {
              callId: "call_workflow",
              kind: "tool-result",
              output: {
                capability: decoded.capability,
                target: decoded.target,
                result: structuredResult,
              },
              toolName: "board_runtime",
            },
          },
        },
      ] as never,
    };
  };
}

function eventStream(events: readonly MessageStreamEvent[], onCancel?: () => void) {
  return {
    async cancel() {
      onCancel?.();
      return { status: "accepted" };
    },
    async *[Symbol.asyncIterator]() {
      for (const event of events) yield event;
    },
  };
}

describe("Eve-native board runtime", () => {
  it("relays only the selected child message and resets abandoned child steps", async () => {
    const childEvents = [
      {
        type: "session.started",
        data: {
          invocation: {
            kind: "subagent",
            name: "daniel-ek",
            parentCallId: "call_adviser",
            parentSessionId: "root_session",
            parentTurnId: "root_turn",
          },
        },
      },
      { type: "step.started", data: { modelId: "test", sequence: 0, stepIndex: 0, turnId: "child_turn" } },
      { type: "message.appended", data: { messageDelta: "Discard me", sequence: 0, stepIndex: 0, turnId: "child_turn" } },
      { type: "step.failed", data: { code: "retry", message: "retry", sequence: 0, stepIndex: 0, turnId: "child_turn" } },
      { type: "step.started", data: { modelId: "test", sequence: 0, stepIndex: 1, turnId: "child_turn" } },
      { type: "message.appended", data: { messageDelta: "Final ", sequence: 0, stepIndex: 1, turnId: "child_turn" } },
      { type: "message.appended", data: { messageDelta: "answer.", sequence: 0, stepIndex: 1, turnId: "child_turn" } },
      { type: "message.completed", data: { finishReason: "stop", message: "Final answer.", sequence: 0, stepIndex: 1, turnId: "child_turn" } },
      { type: "session.waiting", data: { continuationToken: "", wait: "next-user-message" } },
    ] as unknown as MessageStreamEvent[];
    const client: EveClientLike = {
      sessions: {
        async create({ message }) {
          const { encoded, decoded } = routingEnvelopeFrom(message);
          const rootEvents = [
            { type: "reasoning.appended", data: { reasoningDelta: "private root reasoning" } },
            { type: "message.appended", data: { messageDelta: "root narration" } },
            {
              type: "actions.requested",
              data: {
                actions: [{
                  callId: "call_workflow",
                  input: { routingEnvelope: encoded },
                  kind: "workflow-tool-call",
                  toolName: "board_runtime",
                  workflowId: "workflow_board_runtime",
                }],
              },
            },
            {
              type: "subagent.called",
              data: {
                callId: "call_adviser",
                childSessionId: "child_session",
                name: "daniel-ek",
                sessionId: "root_session",
                toolName: "daniel-ek",
                turnId: "root_turn",
              },
            },
            {
              type: "action.result",
              data: {
                status: "completed",
                result: {
                  callId: "call_workflow",
                  kind: "tool-result",
                  output: {
                    capability: decoded.capability,
                    target: decoded.target,
                    result: { text: "Final answer." },
                  },
                  toolName: "board_runtime",
                },
              },
            },
            { type: "session.waiting", data: { continuationToken: "", wait: "next-user-message" } },
          ] as unknown as MessageStreamEvent[];
          return { response: eventStream(rootEvents) };
        },
        attach(sessionId) {
          expect(sessionId).toBe("child_session");
          return { stream: () => eventStream(childEvents) };
        },
      },
    };
    const updates: Array<{ type: string; delta?: string }> = [];
    const runtime = createLiveRuntime({
      eveHost: "http://board.test",
      invokeEve: createEveInvoker(() => client),
    });

    await expect(
      runtime.publicTurn(baseInput(), { onStream: (update) => updates.push(update) }),
    ).resolves.toEqual({ text: "Final answer." });
    expect(updates).toEqual([
      { type: "reset" },
      { type: "append", delta: "Discard me" },
      { type: "reset" },
      { type: "reset" },
      { type: "append", delta: "Final " },
      { type: "append", delta: "answer." },
    ]);
    expect(updates.flatMap((update) => update.delta ?? []).join(""))
      .not.toContain("root narration");
    expect(updates.flatMap((update) => update.delta ?? []).join(""))
      .not.toContain("private root reasoning");
  });

  it("fails closed without relaying a child event emitted before authentication", async () => {
    const childEvents = [
      {
        type: "message.appended",
        data: {
          messageDelta: "This must never surface.",
          sequence: 0,
          stepIndex: 0,
          turnId: "child_turn",
        },
      },
      {
        type: "session.started",
        data: {
          invocation: {
            kind: "subagent",
            name: "daniel-ek",
            parentCallId: "call_adviser",
            parentSessionId: "root_session",
            parentTurnId: "root_turn",
          },
        },
      },
    ] as unknown as MessageStreamEvent[];
    const client: EveClientLike = {
      sessions: {
        async create({ message }) {
          const { encoded, decoded } = routingEnvelopeFrom(message);
          const rootEvents = [
            {
              type: "actions.requested",
              data: {
                actions: [{
                  callId: "call_workflow",
                  input: { routingEnvelope: encoded },
                  kind: "workflow-tool-call",
                  toolName: "board_runtime",
                  workflowId: "workflow_board_runtime",
                }],
              },
            },
            {
              type: "subagent.called",
              data: {
                callId: "call_adviser",
                childSessionId: "child_session",
                name: "daniel-ek",
                sessionId: "root_session",
                toolName: "daniel-ek",
                turnId: "root_turn",
              },
            },
            {
              type: "action.result",
              data: {
                status: "completed",
                result: {
                  callId: "call_workflow",
                  kind: "tool-result",
                  output: {
                    capability: decoded.capability,
                    target: decoded.target,
                    result: { text: "This result must not be accepted." },
                  },
                  toolName: "board_runtime",
                },
              },
            },
            {
              type: "session.waiting",
              data: { continuationToken: "", wait: "next-user-message" },
            },
          ] as unknown as MessageStreamEvent[];
          return { response: eventStream(rootEvents) };
        },
        attach(sessionId) {
          expect(sessionId).toBe("child_session");
          return { stream: () => eventStream(childEvents) };
        },
      },
    };
    const updates: Array<{ type: string; delta?: string }> = [];
    const runtime = createLiveRuntime({
      eveHost: "http://board.test",
      invokeEve: createEveInvoker(() => client),
    });

    await expect(
      runtime.publicTurn(baseInput(), { onStream: (update) => updates.push(update) }),
    ).rejects.toMatchObject({
      code: "EVE_SUBAGENT_CALL_INVALID",
    } satisfies Partial<EveRuntimeContractError>);
    expect(updates).toEqual([]);
  });

  it("resets and rejects oversized provisional output from an authenticated child", async () => {
    const childEvents = [
      {
        type: "session.started",
        data: {
          invocation: {
            kind: "subagent",
            name: "daniel-ek",
            parentCallId: "call_adviser",
            parentSessionId: "root_session",
            parentTurnId: "root_turn",
          },
        },
      },
      {
        type: "message.appended",
        data: {
          messageDelta: "a".repeat(2_500),
          sequence: 0,
          stepIndex: 0,
          turnId: "child_turn",
        },
      },
      {
        type: "message.appended",
        data: {
          messageDelta: "b".repeat(1_501),
          sequence: 0,
          stepIndex: 0,
          turnId: "child_turn",
        },
      },
    ] as unknown as MessageStreamEvent[];
    const client: EveClientLike = {
      sessions: {
        async create({ message }) {
          const { encoded, decoded } = routingEnvelopeFrom(message);
          const rootEvents = [
            {
              type: "actions.requested",
              data: {
                actions: [{
                  callId: "call_workflow",
                  input: { routingEnvelope: encoded },
                  kind: "workflow-tool-call",
                  toolName: "board_runtime",
                  workflowId: "workflow_board_runtime",
                }],
              },
            },
            {
              type: "subagent.called",
              data: {
                callId: "call_adviser",
                childSessionId: "child_session",
                name: "daniel-ek",
                sessionId: "root_session",
                toolName: "daniel-ek",
                turnId: "root_turn",
              },
            },
            {
              type: "action.result",
              data: {
                status: "completed",
                result: {
                  callId: "call_workflow",
                  kind: "tool-result",
                  output: {
                    capability: decoded.capability,
                    target: decoded.target,
                    result: { text: "This valid result must not be accepted." },
                  },
                  toolName: "board_runtime",
                },
              },
            },
            {
              type: "session.waiting",
              data: { continuationToken: "", wait: "next-user-message" },
            },
          ] as unknown as MessageStreamEvent[];
          return { response: eventStream(rootEvents) };
        },
        attach(sessionId) {
          expect(sessionId).toBe("child_session");
          return { stream: () => eventStream(childEvents) };
        },
      },
    };
    const updates: Array<{ type: string; delta?: string }> = [];
    const runtime = createLiveRuntime({
      eveHost: "http://board.test",
      invokeEve: createEveInvoker(() => client),
    });

    await expect(
      runtime.publicTurn(baseInput(), { onStream: (update) => updates.push(update) }),
    ).rejects.toMatchObject({
      code: "EVE_STRUCTURED_OUTPUT_INVALID",
    } satisfies Partial<EveRuntimeContractError>);
    expect(updates).toEqual([
      { type: "append", delta: "a".repeat(2_500) },
      { type: "reset" },
    ]);
    expect(updates[0]?.delta?.length).toBeLessThanOrEqual(PUBLIC_TURN_MAX_CHARS);
  });

  it("cooperatively cancels the exact Eve root turn when its AbortSignal fires", async () => {
    let cancelled = false;
    let releaseTurn: (() => void) | undefined;
    const turnReleased = new Promise<void>((resolve) => {
      releaseTurn = resolve;
    });
    const response = {
      async cancel() {
        cancelled = true;
        releaseTurn?.();
        return { status: "accepted" };
      },
      async *[Symbol.asyncIterator]() {
        yield {
          type: "turn.started",
          data: { sequence: 0, turnId: "root_turn" },
        } as unknown as MessageStreamEvent;
        await turnReleased;
        yield {
          type: "turn.cancelled",
          data: { sequence: 0, turnId: "root_turn" },
        } as unknown as MessageStreamEvent;
        yield {
          type: "session.waiting",
          data: { continuationToken: "", wait: "next-user-message" },
        } as unknown as MessageStreamEvent;
      },
    };
    const client: EveClientLike = {
      sessions: {
        async create() {
          return { response };
        },
        attach() {
          throw new Error("No child should be attached for this cancellation test.");
        },
      },
    };
    const controller = new AbortController();
    const pending = createEveInvoker(() => client)({
      host: "http://board.test",
      message: "cancel me",
      expectedTarget: "daniel-ek",
      signal: controller.signal,
    });
    await Promise.resolve();

    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(cancelled).toBe(true);
  });

  it("routes a selected member slug to the exact subagent.called identity", async () => {
    const invocations: string[] = [];
    const delegate = successfulInvoker({ text: "Run the reversible test first." });
    const invokeEve: EveInvoker = async (input) => {
      invocations.push(input.message);
      return delegate(input);
    };
    const runtime = createLiveRuntime({ eveHost: "http://board.test", invokeEve });

    await expect(runtime.publicTurn(baseInput())).resolves.toEqual({
      text: "Run the reversible test first.",
    });
    expect(invocations).toHaveLength(1);
    expect(routingEnvelopeFrom(invocations[0]!).decoded.target).toBe("daniel-ek");
  });

  it("routes synthesis and readout to secretary in separate Eve sessions", async () => {
    const targets: string[] = [];
    const results = [
      { text: "Agreement is narrow; the evidence question remains open." },
      {
        decision: "Change the plan?",
        recommendation: "Run a bounded test.",
        divided: true,
        options: ["Change", "Hold"],
        tradeoffs: ["Speed versus evidence"],
        assumptions: ["The current sample is small"],
        openQuestions: ["What converts?"],
        nextActions: ["Measure the cohort"],
      },
    ];
    let invocationIndex = 0;
    const invokeEve: EveInvoker = async (input) => {
      targets.push(routingEnvelopeFrom(input.message).decoded.target);
      return successfulInvoker(results[invocationIndex++]!)(input);
    };
    const runtime = createLiveRuntime({ eveHost: "http://board.test", invokeEve });
    const synthesisInput = {
      capability: "synthesis" as const,
      briefing: "Question: Change the plan?",
      phase: "discussion" as const,
      transcript: [],
      ownPriorStatements: [],
      boardNames: ["Daniel Ek"],
    };

    await expect(runtime.synthesis(synthesisInput)).resolves.toContain("Agreement is narrow");
    await expect(
      runtime.readout({
        briefing: synthesisInput.briefing,
        transcript: [],
        closingComments: [
          { memberId: "daniel-ek", name: "Daniel Ek", comment: "Test it." },
        ],
        boardNames: synthesisInput.boardNames,
      }),
    ).resolves.toMatchObject({
      recommendation: "Run a bounded test.",
      closingComments: [
        { memberId: "daniel-ek", name: "Daniel Ek", comment: "Test it." },
      ],
    });
    expect(targets).toEqual(["secretary", "secretary"]);
  });

  it("sends the complete public transcript to the secretary readout", async () => {
    const transcript = Array.from({ length: 30 }, (_, index) => ({
      id: `event-${index}`,
      kind: "message" as const,
      speakerId: "daniel-ek",
      speakerName: "Daniel Ek",
      text: `Public contribution ${index}`,
      createdAt: index,
    }));
    let delegatedMessage = "";
    const result = {
      decision: "Change the plan?",
      recommendation: "Run a bounded test.",
      divided: false,
      options: [],
      tradeoffs: [],
      assumptions: [],
      openQuestions: [],
      nextActions: [],
    };
    const delegate = successfulInvoker(result);
    const runtime = createLiveRuntime({
      eveHost: "http://board.test",
      invokeEve: async (input) => {
        delegatedMessage = routingEnvelopeFrom(input.message).decoded.message;
        return delegate(input);
      },
    });

    await runtime.readout({
      briefing: "Question: Change the plan?",
      transcript,
      closingComments: [],
      boardNames: ["Daniel Ek"],
    });

    expect(delegatedMessage).toContain("Public contribution 0");
    expect(delegatedMessage).toContain("Public contribution 29");
  });

  it("rejects the wrong subagent identity", async () => {
    const runtime = createLiveRuntime({
      eveHost: "http://board.test",
      invokeEve: successfulInvoker(
        { text: "Wrong seat." },
        () => "david-heinemeier-hansson",
      ),
    });

    await expect(runtime.publicTurn(baseInput())).rejects.toMatchObject({
      code: "EVE_SUBAGENT_CALL_INVALID",
    } satisfies Partial<EveRuntimeContractError>);
  });

  it("rejects missing or invalid structured workflow output", async () => {
    const missingOutput: EveInvoker = async ({ message }) => {
      const { encoded, decoded } = routingEnvelopeFrom(message);
      return {
        status: "waiting",
        events: [
          {
            type: "actions.requested",
            data: {
              actions: [
                {
                  callId: "call_workflow",
                  input: { routingEnvelope: encoded },
                  kind: "workflow-tool-call",
                  toolName: "board_runtime",
                  workflowId: "workflow_board_runtime",
                },
              ],
            },
          },
          {
            type: "subagent.called",
            data: { name: decoded.target, toolName: decoded.target },
          },
        ] as never,
      };
    };
    const runtime = createLiveRuntime({ eveHost: "http://board.test", invokeEve: missingOutput });
    await expect(runtime.publicTurn(baseInput())).rejects.toMatchObject({
      code: "EVE_STRUCTURED_OUTPUT_INVALID",
    });

    const invalid = createLiveRuntime({
      eveHost: "http://board.test",
      invokeEve: successfulInvoker({ answer: "not a member turn" }),
    });
    await expect(invalid.publicTurn(baseInput())).rejects.toMatchObject({
      code: "EVE_STRUCTURED_OUTPUT_INVALID",
    });
  });

  it("rejects a structured public turn longer than 90 words", async () => {
    const atLimit = Array.from({ length: 90 }, () => "word").join(" ");
    const overLimit = `${atLimit} overflow`;

    const valid = createLiveRuntime({
      eveHost: "http://board.test",
      invokeEve: successfulInvoker({ text: atLimit }),
    });
    await expect(valid.publicTurn(baseInput())).resolves.toEqual({ text: atLimit });

    const invalid = createLiveRuntime({
      eveHost: "http://board.test",
      invokeEve: successfulInvoker({ text: overLimit }),
    });
    await expect(invalid.publicTurn(baseInput())).rejects.toMatchObject({
      code: "EVE_STRUCTURED_OUTPUT_INVALID",
    } satisfies Partial<EveRuntimeContractError>);
  });

  it("rejects a non-completed workflow result even if its payload looks valid", async () => {
    const invokeEve: EveInvoker = async ({ message }) => {
      const delegated = await successfulInvoker({ text: "Do not accept me." })({
        host: "http://board.test",
        message,
        expectedTarget: "daniel-ek",
      });
      const events = delegated.events.map((event) =>
        event.type === "action.result"
          ? ({ ...event, data: { ...event.data, status: "rejected" } } as typeof event)
          : event,
      );
      return { ...delegated, events };
    };
    const runtime = createLiveRuntime({ eveHost: "http://board.test", invokeEve });

    await expect(runtime.publicTurn(baseInput())).rejects.toMatchObject({
      code: "EVE_STRUCTURED_OUTPUT_INVALID",
    });
  });

  it("rejects a root turn that did not call the expected workflow tool", async () => {
    const invokeEve: EveInvoker = async () => ({ status: "waiting", events: [] });
    const runtime = createLiveRuntime({ eveHost: "http://board.test", invokeEve });

    await expect(runtime.publicTurn(baseInput())).rejects.toMatchObject({
      code: "EVE_WORKFLOW_CALL_INVALID",
    });
  });

  it("keeps the deterministic mock fallback when no OpenAI key exists", () => {
    delete process.env.OPENAI_API_KEY;
    expect(createRuntime().id).toBe("mock");
  });
});

describe("static Eve adviser fleet", () => {
  it("locks the routing root and secretary to their minimal authored tool surfaces", async () => {
    const disabledDefaults = [
      "agent",
      "ask_question",
      "bash",
      "connection_search",
      "load_skill",
      "read_file",
      "task_cancel",
      "task_update",
      "todo",
      "web_fetch",
      "web_search",
      "write_file",
    ];
    const rootTools = path.join(process.cwd(), "agent", "tools");
    const secretaryTools = path.join(
      process.cwd(),
      "agent",
      "subagents",
      "secretary",
      "tools",
    );

    const rootFiles = (await readdir(rootTools)).sort();
    expect(rootFiles).toEqual(
      ["board_runtime.ts", ...disabledDefaults.map((name) => `${name}.ts`)].sort(),
    );
    const secretaryFiles = (await readdir(secretaryTools)).sort();
    expect(secretaryFiles).toEqual(
      disabledDefaults
        .filter((name) => name !== "agent")
        .map((name) => `${name}.ts`)
        .sort(),
    );

    for (const file of rootFiles) {
      if (file === "board_runtime.ts") continue;
      const source = await readFile(path.join(rootTools, file), "utf8");
      expect(source).toMatch(/export default disableTool\(\);/);
    }
    for (const file of secretaryFiles) {
      const source = await readFile(path.join(secretaryTools, file), "utf8");
      expect(source).toMatch(/export default disableTool\(\);/);
    }
  });

  it("keeps exactly 36 catalog advisers with matching direct-provider subagents", async () => {
    expect(CATALOG).toHaveLength(ADVISER_COUNT);
    expect(new Set(CATALOG.map(({ slug }) => slug)).size).toBe(ADVISER_COUNT);

    const subagentsRoot = path.join(process.cwd(), "agent", "subagents");
    const directories = (await readdir(subagentsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name !== "secretary")
      .map((entry) => entry.name)
      .sort();
    expect(directories).toEqual(CATALOG.map(({ slug }) => slug).sort());

    const gatewayConfigured: string[] = [];
    for (const slug of directories) {
      const source = await readFile(path.join(subagentsRoot, slug, "agent.ts"), "utf8");
      if (!/model:\s*openai\(/.test(source)) gatewayConfigured.push(slug);
    }
    expect(gatewayConfigured, "Every adviser must use @ai-sdk/openai directly").toEqual([]);
  });

});
