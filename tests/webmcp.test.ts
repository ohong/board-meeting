import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  WEBMCP_RECEIPT_DISMISS_MS,
  WebMcpReceiptView,
  dismissWebMcpReceipt,
  scheduleWebMcpReceiptDismiss,
  shouldClearWebMcpReceipt,
} from "../components/WebMcp";
import { createMockRuntime } from "../lib/runtime/mock";
import { createMeetingSession, type MeetingSession } from "../lib/session";
import {
  BOARD_TOOL_NAMES,
  createBoardToolManifest,
  getModelContext,
  registerBoardTools,
  type BoardTool,
  type BoardToolName,
  type BoardToolReceipt,
  type ModelContext,
} from "../lib/webmcp";

function selectDemo(session: MeetingSession) {
  session.toggleMember("daniel-ek");
  session.toggleMember("david-heinemeier-hansson");
  session.toggleMember("lulu-cheng-meservey");
  session.goToBrief();
  session.setBriefing("Question: Should we change course?\n\nBriefing: Customer evidence is mixed.");
}

async function started() {
  const session = createMeetingSession({
    runtime: createMockRuntime(),
    autoContinue: false,
    joinDelayMs: 0,
  });
  selectDemo(session);
  expect((await session.startMeeting()).ok).toBe(true);
  return session;
}

function tool(manifest: BoardTool[], name: BoardToolName) {
  const found = manifest.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`Missing ${name}`);
  return found;
}

function receiptText(receipt: BoardToolReceipt) {
  return `Site tool ${receipt.toolName} ${receipt.outcome}: ${receipt.message}`;
}

describe("board WebMCP manifest", () => {
  it("exposes exactly the six stable top-level tools with closed schemas", () => {
    const session = createMeetingSession();
    const manifest = createBoardToolManifest(session);

    expect(manifest.map(({ name }) => name)).toEqual(BOARD_TOOL_NAMES);
    expect(new Set(manifest.map(({ name }) => name)).size).toBe(6);
    expect(manifest.every(({ inputSchema }) => inputSchema.additionalProperties === false)).toBe(
      true,
    );
    expect(manifest.map(({ name, annotations }) => [name, annotations.readOnlyHint])).toEqual([
      ["inspect_board_meeting", true],
      ["join_board_meeting", false],
      ["contribute_to_board_meeting", false],
      ["address_board_member", false],
      ["request_board_synthesis", false],
      ["get_board_meeting_readout", true],
    ]);

    expect(tool(manifest, "join_board_meeting").inputSchema).toMatchObject({
      required: ["name"],
      properties: { name: { type: "string", minLength: 1, maxLength: 80 } },
    });
    expect(tool(manifest, "contribute_to_board_meeting").inputSchema).toMatchObject({
      required: ["text"],
      properties: { text: { type: "string", minLength: 1, maxLength: 4000 } },
    });
    expect(tool(manifest, "address_board_member").inputSchema).toMatchObject({
      required: ["member", "text"],
      properties: {
        member: { type: "string", minLength: 1, maxLength: 120 },
        text: { type: "string", minLength: 1, maxLength: 2000 },
      },
    });
  });

  it("uses the shared session for stateful actions and reports metadata-only receipts", async () => {
    const session = await started();
    const received: BoardToolReceipt[] = [];
    const manifest = createBoardToolManifest(session, (receipt) => received.push(receipt));
    const contribution = "Seven of ten enterprise wins began in shared free workspaces.";
    const question = "Does that evidence change your recommendation?";

    const beforeInspect = session.getState();
    const inspected = await tool(manifest, "inspect_board_meeting").execute({});
    expect(inspected).toMatchObject({
      ok: true,
      meeting: { meetingPhase: "discussion", readoutReady: false },
    });
    expect(session.getState()).toEqual(beforeInspect);

    expect(await tool(manifest, "join_board_meeting").execute({ name: " Codex " })).toMatchObject({
      ok: true,
      guest: { name: "Codex", status: "joining" },
    });
    const contributionResult = await tool(manifest, "contribute_to_board_meeting").execute({
      text: contribution,
    });
    expect(contributionResult).toMatchObject({
      ok: true,
      contribution: { speaker: "Codex", text: contribution },
      guest: { name: "Codex", status: "joined" },
      phase: "meeting",
      meetingPhase: "discussion",
    });
    const addressResult = await tool(manifest, "address_board_member").execute({
      member: "Daniel Ek",
      text: question,
    });
    expect(addressResult).toMatchObject({
      ok: true,
      addressedMember: { slug: "daniel-ek", name: "Daniel Ek" },
      response: { speaker: "Daniel Ek" },
    });
    expect(String((addressResult.response as { text: string }).text)).not.toHaveLength(0);
    const synthesisResult = await tool(manifest, "request_board_synthesis").execute({});
    expect(synthesisResult).toMatchObject({
      ok: true,
      message: "Interim synthesis delivered.",
      synthesis: expect.any(String),
      phase: "meeting",
      meetingPhase: "discussion",
    });
    expect(synthesisResult.synthesis).not.toBe(synthesisResult.message);

    expect(session.getState().guest).toEqual({ name: "Codex", status: "joined" });
    const transcript = session.getState().transcript;
    expect(
      transcript.filter((event) => event.kind === "message" && event.text === contribution),
    ).toHaveLength(1);
    expect(
      transcript.filter(
        (event) => event.kind === "message" && event.text === `@Daniel Ek ${question}`,
      ),
    ).toHaveLength(1);

    expect((await session.endMeeting()).ok).toBe(true);
    const beforeReadout = session.getState();
    const readoutResult = await tool(manifest, "get_board_meeting_readout").execute({});
    expect(readoutResult).toMatchObject({
      ok: true,
      ready: true,
      readout: session.getState().readout!,
    });
    expect(session.getState()).toEqual(beforeReadout);

    expect(received.map(receiptText)).toEqual([
      "Site tool inspect_board_meeting succeeded: Meeting state inspected.",
      "Site tool join_board_meeting succeeded: Join request accepted.",
      "Site tool contribute_to_board_meeting succeeded: Contribution added to the meeting.",
      "Site tool address_board_member succeeded: The addressed adviser answered.",
      "Site tool request_board_synthesis succeeded: Interim synthesis delivered.",
      "Site tool get_board_meeting_readout succeeded: Final readout retrieved.",
    ]);
    expect(JSON.stringify(received)).not.toContain(contribution);
    expect(JSON.stringify(received)).not.toContain(question);
    expect(JSON.stringify(received)).not.toContain(session.getState().readout!.recommendation);
    expect(session.getState().transcript.some((event) => event.speakerId === "webmcp")).toBe(false);
  });

  it("rejects gated and invalid calls clearly while leaving a receipt for each", async () => {
    const session = createMeetingSession({ runtime: createMockRuntime(), autoContinue: false });
    const received: BoardToolReceipt[] = [];
    const manifest = createBoardToolManifest(session, (receipt) => received.push(receipt));

    expect(await tool(manifest, "inspect_board_meeting").execute({ extra: true })).toMatchObject({
      ok: false,
      message: "Unexpected argument: extra.",
    });
    expect(await tool(manifest, "join_board_meeting").execute({ name: "   " })).toMatchObject({
      ok: false,
      message: "name must be a non-empty string.",
    });
    expect(
      await tool(manifest, "contribute_to_board_meeting").execute({ text: "Context" }),
    ).toMatchObject({ ok: false, message: "The meeting has ended." });
    expect(
      await tool(manifest, "address_board_member").execute({
        member: "Daniel Ek",
        text: "Question",
      }),
    ).toMatchObject({ ok: false, message: "The meeting has ended." });
    expect(await tool(manifest, "request_board_synthesis").execute({})).toMatchObject({
      ok: false,
      message: "The meeting has ended.",
    });
    expect(await tool(manifest, "get_board_meeting_readout").execute({})).toMatchObject({
      ok: false,
      ready: false,
    });

    expect(received).toHaveLength(6);
    expect(received.every(({ outcome }) => outcome === "rejected")).toBe(true);
    expect(session.guestEndMeeting()).toEqual({
      ok: false,
      message: "Only the human chair can end the meeting.",
    });
  });

  it("enforces one guest and does not expose roster or end-meeting authority", async () => {
    const session = await started();
    const received: BoardToolReceipt[] = [];
    const manifest = createBoardToolManifest(session, (receipt) => received.push(receipt));

    expect(await tool(manifest, "join_board_meeting").execute({ name: "Codex" })).toMatchObject({
      ok: true,
    });
    const secondJoin = await tool(manifest, "join_board_meeting").execute({
      name: "Another agent",
    });
    expect(secondJoin.ok).toBe(false);
    expect(secondJoin.message).toMatch(/already occupied by Codex/);
    expect(manifest.some(({ name }) => /end|roster|member/.test(name) && name !== "address_board_member"))
      .toBe(false);
    expect(session.getState().guest.name).toBe("Codex");
    expect(received.at(-1)).toMatchObject({
      toolName: "join_board_meeting",
      outcome: "rejected",
    });
  });

  it("validates every field at runtime even when browser schema validation is bypassed", async () => {
    const session = await started();
    const received: BoardToolReceipt[] = [];
    const manifest = createBoardToolManifest(session, (receipt) => received.push(receipt));

    const cases: Array<[BoardToolName, unknown, string]> = [
      ["join_board_meeting", { name: 42 }, "name must be a non-empty string."],
      ["join_board_meeting", { name: "A", role: "chair" }, "Unexpected argument: role."],
      ["contribute_to_board_meeting", { text: "x".repeat(4001) }, "text must be 4000 characters or fewer."],
      ["address_board_member", { member: "", text: "Question" }, "member must be a non-empty string."],
      ["request_board_synthesis", [], "Arguments must be an object."],
      ["get_board_meeting_readout", { force: true }, "Unexpected argument: force."],
    ];

    for (const [name, args, message] of cases) {
      expect(await tool(manifest, name).execute(args)).toEqual({ ok: false, message });
    }
    expect(received).toHaveLength(cases.length);
  });

  it("renders the latest receipt as a visible live status", () => {
    const receipt: BoardToolReceipt = {
      toolName: "inspect_board_meeting",
      outcome: "succeeded",
      message: "Meeting state inspected.",
    };

    const html = renderToStaticMarkup(createElement(WebMcpReceiptView, { receipt }));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Site tool inspect_board_meeting succeeded: Meeting state inspected.");
  });

  it("dismisses after four seconds and protects a newer receipt from a stale timer", () => {
    let scheduled: (() => void) | undefined;
    let delayMs: number | undefined;
    let dismissedSequence: number | undefined;
    const handle = 17 as unknown as ReturnType<typeof setTimeout>;
    const receipt: BoardToolReceipt = {
      toolName: "inspect_board_meeting",
      outcome: "succeeded",
      message: "Meeting state inspected.",
    };
    const visible = { sequence: 2, receipt };

    const cleanup = scheduleWebMcpReceiptDismiss(
      1,
      (sequence) => {
        dismissedSequence = sequence;
      },
      {
        timer: {
          schedule(callback, delay) {
            scheduled = callback;
            delayMs = delay;
            return handle;
          },
          cancel(receivedHandle) {
            expect(receivedHandle).toBe(handle);
          },
        },
      },
    );

    expect(delayMs).toBe(WEBMCP_RECEIPT_DISMISS_MS);
    expect(delayMs).toBe(4_000);
    scheduled?.();
    expect(dismissedSequence).toBe(1);
    expect(dismissWebMcpReceipt(visible, 1)).toBe(visible);
    expect(dismissWebMcpReceipt(visible, 2)).toBeNull();
    cleanup();
  });

  it("cancels a pending receipt dismissal when registration aborts", () => {
    let scheduled: (() => void) | undefined;
    let cancelCount = 0;
    let dismissed = false;
    const handle = 18 as unknown as ReturnType<typeof setTimeout>;
    const controller = new AbortController();

    const cleanup = scheduleWebMcpReceiptDismiss(1, () => {
      dismissed = true;
    }, {
      signal: controller.signal,
      timer: {
        schedule(callback) {
          scheduled = callback;
          return handle;
        },
        cancel(receivedHandle) {
          expect(receivedHandle).toBe(handle);
          cancelCount += 1;
        },
      },
    });

    controller.abort();
    scheduled?.();
    expect(dismissed).toBe(false);
    expect(cancelCount).toBe(1);
    cleanup();
    expect(cancelCount).toBe(1);
  });

  it("clears a stale receipt only when the session transitions back to selection", () => {
    expect(shouldClearWebMcpReceipt("readout", "select")).toBe(true);
    expect(shouldClearWebMcpReceipt("meeting", "select")).toBe(true);
    expect(shouldClearWebMcpReceipt("select", "select")).toBe(false);
    expect(shouldClearWebMcpReceipt("meeting", "readout")).toBe(false);
  });
});

describe("board WebMCP registration", () => {
  it("discovers the model context from the top-level document host", () => {
    const modelContext: ModelContext = { registerTool() {} };

    expect(getModelContext({ modelContext })).toBe(modelContext);
  });

  it("registers exactly the manifest on the imperative model context", async () => {
    const registered: BoardTool[] = [];
    const received: BoardToolReceipt[] = [];
    const modelContext: ModelContext = {
      registerTool(candidate) {
        registered.push(candidate);
      },
    };

    expect(
      await registerBoardTools(createMeetingSession(), {
        modelContext,
        onReceipt: (receipt) => received.push(receipt),
      }),
    ).toBe(true);
    expect(registered.map(({ name }) => name)).toEqual(BOARD_TOOL_NAMES);
    await tool(registered, "inspect_board_meeting").execute({});
    expect(received).toEqual([
      {
        toolName: "inspect_board_meeting",
        outcome: "succeeded",
        message: "Meeting state inspected.",
      },
    ]);
  });

  it("is StrictMode-safe: aborted setup is removed before the replacement registers", async () => {
    const active = new Map<BoardToolName, BoardTool>();
    const modelContext: ModelContext = {
      registerTool(candidate, options) {
        active.set(candidate.name, candidate);
        options?.signal?.addEventListener(
          "abort",
          () => {
            if (active.get(candidate.name) === candidate) active.delete(candidate.name);
          },
          { once: true },
        );
      },
    };
    const session = createMeetingSession();
    const first = new AbortController();
    const firstSetup = registerBoardTools(session, {
      signal: first.signal,
      modelContext,
    });

    first.abort();
    expect(await firstSetup).toBe(false);
    expect(active.size).toBe(0);

    const replacement = new AbortController();
    expect(
      await registerBoardTools(session, {
        signal: replacement.signal,
        modelContext,
      }),
    ).toBe(true);
    expect([...active.keys()]).toEqual(BOARD_TOOL_NAMES);
    replacement.abort();
    expect(active.size).toBe(0);
  });

  it("turns an AbortError raised during cleanup into a handled false result", async () => {
    const modelContext: ModelContext = {
      registerTool(_candidate, options) {
        return new Promise<void>((_resolve, reject) => {
          options?.signal?.addEventListener(
            "abort",
            () => reject(Object.assign(new Error("registration aborted"), { name: "AbortError" })),
            { once: true },
          );
        });
      },
    };
    const controller = new AbortController();
    const setup = registerBoardTools(createMeetingSession(), {
      signal: controller.signal,
      modelContext,
    });

    controller.abort();
    await expect(setup).resolves.toBe(false);
  });
});
