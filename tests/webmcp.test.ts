import { describe, expect, it } from "vitest";
import { boardTools, registerBoardTools } from "../lib/webmcp";
import { invitationPrompt } from "../lib/example";
import { formatReadout } from "../lib/format";
import { newSession, seatDemoBoard } from "./helpers";

const TOOL_NAMES = [
  "inspect_board_meeting",
  "join_board_meeting",
  "contribute_to_board_meeting",
  "address_board_member",
  "request_board_synthesis",
  "get_board_meeting_readout",
];

function toolbox(session: ReturnType<typeof newSession>) {
  const tools = boardTools(session);
  return {
    names: tools.map((tool) => tool.name),
    async call(name: string, args: Record<string, unknown> = {}) {
      const tool = tools.find((entry) => entry.name === name);
      if (!tool) throw new Error(`no tool named ${name}`);
      const result = await tool.execute(args);
      return result.content[0].text;
    },
  };
}

/** The private context only the presenter's own agent knows before the demo. */
const CODEX_CONTEXT =
  "Seven of our last ten enterprise wins first entered through a free workspace shared by an existing user. Those accounts now represent 22% of ARR.";

describe("site tools", () => {
  it("exposes exactly the six locked tool names", () => {
    expect(toolbox(newSession()).names).toEqual(TOOL_NAMES);
  });

  it("reports an unsupported browser without throwing", async () => {
    const result = await registerBoardTools(newSession());
    expect(result.supported).toBe(false);
    expect(result.toolNames).toEqual(TOOL_NAMES);
  });

  it("registers every tool when the page exposes document.modelContext", async () => {
    const registered: string[] = [];
    const documentStub = {
      modelContext: {
        registerTool: (tool: { name: string }) => {
          registered.push(tool.name);
        },
      },
    };
    const globals = globalThis as unknown as { document?: unknown };
    globals.document = documentStub;
    try {
      const result = await registerBoardTools(newSession());
      expect(result.supported).toBe(true);
      expect(registered).toEqual(TOOL_NAMES);
    } finally {
      delete globals.document;
    }
  });

  it("names a seated adviser in the invitation and never dictates the guest's name", () => {
    const prompt = invitationPrompt(["Daniel Ek", "David Heinemeier Hansson"]);
    expect(prompt).toContain("Daniel Ek");
    expect(prompt).toContain("the name you know yourself by");
    expect(prompt).not.toContain("Codex");
    for (const name of TOOL_NAMES) expect(prompt).toContain(name);
  });
});

describe("the external agent's sequence", () => {
  it("inspects, joins, contributes, addresses an adviser, and gets a synthesis", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    await session.runDiscussion(3);
    const tools = toolbox(session);

    const before = JSON.parse(await tools.call("inspect_board_meeting"));
    expect(before.briefing).toContain("free tier");
    expect(before.board.map((seat: { name: string }) => seat.name)).toContain("Daniel Ek");
    expect(before.guest).toEqual({ name: null, status: "waiting" });
    expect(before.readoutReady).toBe(false);

    const joined = JSON.parse(await tools.call("join_board_meeting", { name: "Codex" }));
    expect(joined.ok).toBe(true);
    expect(session.getState().guest).toEqual({ name: "Codex", status: "joined" });
    expect(
      session.getState().transcript.some((event) => event.kind === "system" && event.text.includes("Codex")),
    ).toBe(true);

    const contributed = JSON.parse(await tools.call("contribute_to_board_meeting", { text: CODEX_CONTEXT }));
    expect(contributed.ok).toBe(true);
    const contribution = session
      .getState()
      .transcript.find((event) => event.speakerId === "guest" && event.text === CODEX_CONTEXT);
    expect(contribution?.speakerName).toBe("Codex");

    const addressed = JSON.parse(
      await tools.call("address_board_member", {
        member: "Daniel Ek",
        text: "Does that enterprise-referral evidence change your view of the free tier?",
      }),
    );
    expect(addressed.ok).toBe(true);
    const last = session.getState().transcript.filter((event) => event.kind === "message").at(-1);
    expect(last?.speakerId).toBe("daniel-ek");
    expect(addressed.message).toContain(last!.text);

    const synthesis = JSON.parse(await tools.call("request_board_synthesis"));
    expect(synthesis.ok).toBe(true);
    expect(session.getState().meetingPhase).toBe("discussion");
    expect(
      session.getState().transcript.some((event) => event.speakerId === "secretary"),
    ).toBe(true);

    expect(session.getState().agentActivity.map((entry) => entry.label)).toEqual([
      "Codex joined the guest seat",
      "Codex added context to the record",
      "Codex put a question to Daniel Ek",
      "Codex requested an interim synthesis",
    ]);
  });

  it("refuses to act before joining and refuses a second guest", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    const tools = toolbox(session);

    const early = JSON.parse(await tools.call("contribute_to_board_meeting", { text: "hello" }));
    expect(early.ok).toBe(false);
    expect(early.message).toContain("join_board_meeting");

    expect(JSON.parse(await tools.call("join_board_meeting", { name: "Codex" })).ok).toBe(true);
    const second = JSON.parse(await tools.call("join_board_meeting", { name: "Some Other Agent" }));
    expect(second.ok).toBe(false);
    expect(second.message).toContain("Codex");
  });

  it("cannot end the meeting", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    session.join("Codex");

    const attempt = session.guestEndMeeting();
    expect(attempt.ok).toBe(false);
    expect(attempt.message).toMatch(/only the human chair/i);
    expect(session.getState().phase).toBe("meeting");
  });

  it("cannot address an adviser who is not at this table", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    session.join("Codex");

    const result = JSON.parse(
      await toolbox(session).call("address_board_member", { member: "Sam Altman", text: "thoughts?" }),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Daniel Ek");
  });

  it("returns a clear not-ready status before the chair ends the meeting, then the exact memo", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    await session.runDiscussion(3);
    const tools = toolbox(session);
    await tools.call("join_board_meeting", { name: "Codex" });

    const early = JSON.parse(await tools.call("get_board_meeting_readout"));
    expect(early.ready).toBe(false);
    expect(early.message).toMatch(/chair/i);

    await session.endMeeting();

    const memo = await tools.call("get_board_meeting_readout");
    expect(memo).toBe(formatReadout(session.getState().readout!));
    expect(memo).toContain("DECISION UNDER DISCUSSION");
    expect(memo).toContain("BOARD RECOMMENDATION");
    expect(memo).toContain("OPTIONS CONSIDERED");
    expect(memo).toContain("KEY TRADEOFFS");
    expect(memo).toContain("IMPORTANT ASSUMPTIONS");
    expect(memo).toContain("OPEN QUESTIONS");
    expect(memo).toContain("RECOMMENDED NEXT ACTIONS");
    expect(memo).toContain("CLOSING COMMENTS BY BOARD MEMBER");
    expect(session.getState().readoutRetrievedBy).toBe("Codex");
  });

  it("writes the guest's contribution into the same transcript the board reads", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    session.join("Codex");
    await session.contribute(CODEX_CONTEXT);
    await session.takeOneTurn();

    const transcriptTexts = session.getState().transcript.map((event) => event.text);
    expect(transcriptTexts).toContain(CODEX_CONTEXT);
    // One record, not a parallel one: the guest's line sits inline with the board's.
    const guestIndex = transcriptTexts.indexOf(CODEX_CONTEXT);
    expect(guestIndex).toBeGreaterThan(0);
    expect(guestIndex).toBeLessThan(transcriptTexts.length - 1);
  });
});
