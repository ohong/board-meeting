import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WebMcpBridge } from "../components/WebMcp";
import { createMockRuntime } from "../lib/runtime/mock";
import { createMeetingSession, type MeetingSession } from "../lib/session";
import {
  BOARD_TOOL_NAMES,
  createBoardToolManifest,
  getModelContext,
  registerBoardTools,
  type BoardTool,
  type BoardToolName,
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

function receipts(session: MeetingSession) {
  return session
    .getState()
    .transcript.filter((event) => event.kind === "system" && event.speakerId === "webmcp");
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

  it("uses the shared session for every successful interaction and records metadata-only receipts", async () => {
    const session = await started();
    const manifest = createBoardToolManifest(session);
    const contribution = "Seven of ten enterprise wins began in shared free workspaces.";
    const question = "Does that evidence change your recommendation?";

    const inspected = await tool(manifest, "inspect_board_meeting").execute({});
    expect(inspected).toMatchObject({
      ok: true,
      meeting: { meetingPhase: "discussion", readoutReady: false },
    });

    expect(await tool(manifest, "join_board_meeting").execute({ name: " Codex " })).toMatchObject({
      ok: true,
    });
    expect(
      await tool(manifest, "contribute_to_board_meeting").execute({ text: contribution }),
    ).toMatchObject({ ok: true });
    expect(
      await tool(manifest, "address_board_member").execute({
        member: "Daniel Ek",
        text: question,
      }),
    ).toMatchObject({ ok: true });
    expect(await tool(manifest, "request_board_synthesis").execute({})).toMatchObject({
      ok: true,
    });

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
    const readoutResult = await tool(manifest, "get_board_meeting_readout").execute({});
    expect(readoutResult).toMatchObject({
      ok: true,
      ready: true,
      readout: session.getState().readout!,
    });

    expect(receipts(session).map(({ text }) => text)).toEqual([
      "Site tool inspect_board_meeting succeeded: Meeting state inspected.",
      "Site tool join_board_meeting succeeded: Join request accepted.",
      "Site tool contribute_to_board_meeting succeeded: Contribution added to the meeting.",
      "Site tool address_board_member succeeded: The addressed adviser answered.",
      "Site tool request_board_synthesis succeeded: Interim synthesis delivered.",
      "Site tool get_board_meeting_readout succeeded: Final readout retrieved.",
    ]);
    expect(receipts(session).map(({ text }) => text).join("\n")).not.toContain(contribution);
    expect(receipts(session).map(({ text }) => text).join("\n")).not.toContain(question);
    expect(receipts(session).map(({ text }) => text).join("\n")).not.toContain(
      session.getState().readout!.recommendation,
    );
  });

  it("rejects gated and invalid calls clearly while leaving a receipt for each", async () => {
    const session = createMeetingSession({ runtime: createMockRuntime(), autoContinue: false });
    const manifest = createBoardToolManifest(session);

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

    expect(receipts(session)).toHaveLength(6);
    expect(receipts(session).every(({ text }) => /rejected/.test(text))).toBe(true);
    expect(session.guestEndMeeting()).toEqual({
      ok: false,
      message: "Only the human chair can end the meeting.",
    });
  });

  it("enforces one guest and does not expose roster or end-meeting authority", async () => {
    const session = await started();
    const manifest = createBoardToolManifest(session);

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
    expect(receipts(session).at(-1)?.text).toMatch(/join_board_meeting rejected/);
  });

  it("validates every field at runtime even when browser schema validation is bypassed", async () => {
    const session = await started();
    const manifest = createBoardToolManifest(session);

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
    expect(receipts(session)).toHaveLength(cases.length);
  });

  it("renders the latest receipt as a visible live status", () => {
    const session = createMeetingSession();
    session.recordToolReceipt("inspect_board_meeting", true, "Meeting state inspected.");

    const html = renderToStaticMarkup(createElement(WebMcpBridge, { session }));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Site tool inspect_board_meeting succeeded: Meeting state inspected.");
  });
});

describe("board WebMCP registration", () => {
  it("discovers the model context from the top-level document host", () => {
    const modelContext: ModelContext = { registerTool() {} };

    expect(getModelContext({ modelContext })).toBe(modelContext);
  });

  it("registers exactly the manifest on the imperative model context", async () => {
    const registered: BoardTool[] = [];
    const modelContext: ModelContext = {
      registerTool(candidate) {
        registered.push(candidate);
      },
    };

    expect(await registerBoardTools(createMeetingSession(), undefined, modelContext)).toBe(true);
    expect(registered.map(({ name }) => name)).toEqual(BOARD_TOOL_NAMES);
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
    const firstSetup = registerBoardTools(session, first.signal, modelContext);

    first.abort();
    expect(await firstSetup).toBe(false);
    expect(active.size).toBe(0);

    const replacement = new AbortController();
    expect(await registerBoardTools(session, replacement.signal, modelContext)).toBe(true);
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
    const setup = registerBoardTools(createMeetingSession(), controller.signal, modelContext);

    controller.abort();
    await expect(setup).resolves.toBe(false);
  });
});
