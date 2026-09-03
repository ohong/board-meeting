import { describe, expect, it } from "vitest";

import {
  createBoardTools,
  MAX_OUTPUT_CHARACTERS,
  type BoardToolMap,
} from "@/components/webmcp/webmcp-tools";
import { readoutFromSections, READOUT_SECTIONS } from "@/components/webmcp/readout-format";
import { readoutToText } from "@/components/readout/readout-text";
import { FIXTURES, FIXTURE_PERSONAS, FIXTURE_READOUT } from "@/lib/meeting/fixtures";
import { MeetingSession } from "@/lib/meeting/session";
import {
  WEBMCP_TOOL_NAMES,
  type MeetingState,
  type MemberParticipant,
  type TranscriptEntry,
  type WebMcpToolName,
} from "@/lib/meeting/types";

type AnyResult = Record<string, unknown> & {
  ok?: boolean;
  error?: { code: string; message: string };
};

function toolsFor(state?: MeetingState): { session: MeetingSession; tools: BoardToolMap } {
  const session = new MeetingSession(state);
  return { session, tools: createBoardTools(() => session) };
}

/** Invokes a tool and asserts the frozen output budget on every single result. */
async function call(
  tools: BoardToolMap,
  name: WebMcpToolName,
  input: Record<string, unknown> = {},
): Promise<AnyResult> {
  const result = (await tools[name].execute(input)) as AnyResult;
  const serialized = JSON.stringify(result) ?? "";
  expect(serialized.length, `${name} result exceeded the output budget`).toBeLessThanOrEqual(
    MAX_OUTPUT_CHARACTERS,
  );
  return result;
}

/** A worst-case meeting: six members, long roles, twenty very long turns. */
function crowdedState(): MeetingState {
  const base = FIXTURES.guest();
  const members: Record<string, MemberParticipant> = { ...base.members };
  FIXTURE_PERSONAS.slice(3).forEach((persona, i) => {
    members[persona.slug] = {
      role: "member",
      id: persona.slug,
      persona,
      seat: 3 + i,
      status: "ready",
      turns: 2,
      position: null,
      positionUpdate: null,
      reaction: null,
      urgency: 5,
      lastError: null,
      retries: 0,
    };
  });
  const transcript: TranscriptEntry[] = [...base.transcript];
  for (let i = 0; i < 20; i += 1) {
    transcript.push({
      kind: "message",
      id: `bulk_${i}`,
      speakerId: "daniel-ek",
      speakerRole: "member",
      speakerName: "Daniel Ek",
      text: `Turn ${i}. ${"long-winded board commentary ".repeat(40)}`,
      addressedTo: "board",
      addressedName: null,
      intent: "statement",
      streaming: false,
      interruption: false,
      failed: false,
      ts: Date.now() + i,
    });
  }
  return { ...base, board: FIXTURE_PERSONAS, members, transcript };
}

describe("WebMCP board tools", () => {
  it("exposes exactly the six frozen tool names and never an end-meeting tool", () => {
    const { tools } = toolsFor(FIXTURES.discussion());
    expect(Object.keys(tools).sort()).toEqual([...WEBMCP_TOOL_NAMES].sort());
    for (const name of WEBMCP_TOOL_NAMES) {
      expect(tools[name].name).toBe(name);
      expect(tools[name].description.length).toBeLessThanOrEqual(500);
      expect(tools[name].description.length).toBeGreaterThan(80);
    }
    expect(Object.keys(tools).some((n) => n.includes("end"))).toBe(false);
  });

  it("inspects before joining and tells the agent to join", async () => {
    const { tools } = toolsFor(FIXTURES.discussion());
    const result = await call(tools, "inspect_board_meeting");
    expect(result.ok).toBe(true);
    expect(result.phase).toBe("discussion");
    expect(result.guest).toBeNull();
    expect(result.readout_ready).toBe(false);
    expect((result.board as unknown[]).length).toBe(3);
    expect(Array.isArray(result.transcript)).toBe(true);
    expect(String(result.hint)).toContain("join_board_meeting");
    expect(String(result.briefing).length).toBeLessThanOrEqual(401);
  });

  it("pages back through the transcript", async () => {
    const { tools } = toolsFor(crowdedState());
    const page1 = await call(tools, "inspect_board_meeting", {
      transcript_limit: 4,
      include_briefing: false,
    });
    expect(page1.older_available).toBe(true);
    const offset = page1.next_transcript_offset as number;
    expect(offset).toBeGreaterThan(0);
    const page2 = await call(tools, "inspect_board_meeting", {
      transcript_limit: 4,
      transcript_offset: offset,
      include_briefing: false,
    });
    expect(page2.ok).toBe(true);
    expect(JSON.stringify(page2.transcript)).not.toBe(JSON.stringify(page1.transcript));
  });

  it("keeps a crowded six-member meeting inside the output budget", async () => {
    const { tools } = toolsFor(crowdedState());
    // call() already asserts the budget; also check the largest possible request.
    const result = await call(tools, "inspect_board_meeting", { transcript_limit: 12 });
    expect(result.ok).toBe(true);
    expect((result.board as unknown[]).length).toBe(6);
  });

  it("joins, refuses a second guest, and reports the seat", async () => {
    const { session, tools } = toolsFor(FIXTURES.discussion());
    const joined = await call(tools, "join_board_meeting", { display_name: "Harness Agent" });
    expect(joined.ok).toBe(true);
    expect(joined.name).toBe("Harness Agent");
    expect(joined.seat).toBe("guest");
    expect(String(joined.hint)).toContain("contribute_to_board_meeting");
    expect(session.getState().guest?.name).toBe("Harness Agent");

    const again = await call(tools, "join_board_meeting", { display_name: "Someone Else" });
    expect(again.ok).toBe(false);
    expect(again.error?.code).toBe("ALREADY_JOINED");
  });

  it("rejects an empty display name as data, not an exception", async () => {
    const { tools } = toolsFor(FIXTURES.discussion());
    const result = await call(tools, "join_board_meeting", { display_name: "   " });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("INVALID_INPUT");
  });

  it("requires joining before contributing", async () => {
    const { tools } = toolsFor(FIXTURES.discussion());
    const result = await call(tools, "contribute_to_board_meeting", { text: "Some context." });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("NOT_ALLOWED");
    expect(result.error?.message).toContain("join_board_meeting");
  });

  it("contributes to the same transcript the humans see", async () => {
    const { session, tools } = toolsFor(FIXTURES.discussion());
    await call(tools, "join_board_meeting", { display_name: "Harness Agent" });
    const before = session.getState().transcript.length;
    const result = await call(tools, "contribute_to_board_meeting", {
      text: "Seven of our last ten enterprise wins entered through a free workspace.",
    });
    expect(result.ok).toBe(true);
    expect(typeof result.entryId).toBe("string");
    expect(String(result.hint)).toContain("next turn");
    const state = session.getState();
    expect(state.transcript.length).toBe(before + 1);
    expect(state.queue.at(-1)?.kind).toBe("guest-context");
  });

  it("returns NOT_FOUND with the member list for an unknown member", async () => {
    const { tools } = toolsFor(FIXTURES.discussion());
    await call(tools, "join_board_meeting", { display_name: "Harness Agent" });
    const result = await call(tools, "address_board_member", {
      member: "Warren Buffett",
      text: "Does this change your view?",
    });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("NOT_FOUND");
    const members = result.members as { id: string; name: string }[];
    expect(members.map((m) => m.name)).toContain("Daniel Ek");
  });

  it("addresses a known member by first name and gives them the next turn", async () => {
    const { session, tools } = toolsFor(FIXTURES.discussion());
    await call(tools, "join_board_meeting", { display_name: "Harness Agent" });
    const result = await call(tools, "address_board_member", {
      member: "Daniel",
      text: "Does the enterprise-referral evidence change your view?",
    });
    expect(result.ok).toBe(true);
    expect(result.memberId).toBe("daniel-ek");
    expect(result.memberName).toBe("Daniel Ek");
    expect(String(result.hint)).toContain("Daniel Ek will answer next");
    const queued = session.getState().queue.at(-1);
    expect(queued?.kind).toBe("guest-address");
    expect(queued?.mention).toBe("daniel-ek");
  });

  it("requests a synthesis without ending the meeting", async () => {
    const { session, tools } = toolsFor(FIXTURES.discussion());
    await call(tools, "join_board_meeting", { display_name: "Harness Agent" });
    const result = await call(tools, "request_board_synthesis");
    expect(result.ok).toBe(true);
    expect(String(result.hint)).toContain("Secretary");
    expect(session.getState().phase).toBe("discussion");
    expect(session.getState().queue.at(-1)?.kind).toBe("synthesis-request");
  });

  it("waits for a synthesis and reports it as still pending on timeout", async () => {
    const { session, tools } = toolsFor(FIXTURES.discussion());
    await call(tools, "join_board_meeting", { display_name: "Harness Agent" });
    // No engine is running here, so the entry stays streaming and the wait times out.
    const result = await call(tools, "request_board_synthesis", { wait_seconds: 1 });
    expect(result.ok).toBe(true);
    expect(result.pending).toBe(true);
    expect(typeof result.entryId).toBe("string");
    const entry = session.getState().transcript.find((e) => e.id === result.entryId);
    expect(entry?.kind).toBe("synthesis");
  });

  it("refuses a synthesis from an agent that has not joined", async () => {
    const { tools } = toolsFor(FIXTURES.discussion());
    const result = await call(tools, "request_board_synthesis");
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("NOT_ALLOWED");
  });

  it("reports NOT_READY for the readout while the meeting is live", async () => {
    const { tools } = toolsFor(FIXTURES.discussion());
    const result = await call(tools, "get_board_meeting_readout");
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("NOT_READY");
    expect(result.error?.message).toContain("chair");
  });

  it("returns the readout once it exists and records the retrieval exactly once", async () => {
    const { session, tools } = toolsFor(FIXTURES.readout());
    expect(session.getState().readoutRetrievedByGuestAt).toBeNull();

    const result = await call(tools, "get_board_meeting_readout");
    expect(result.ok).toBe(true);
    const body = String(result.text ?? result.decision ?? "");
    expect(body.length).toBeGreaterThan(0);
    expect(session.getState().readoutRetrievedByGuestAt).not.toBeNull();
    const events = session
      .getState()
      .transcript.filter((e) => e.kind === "event" && e.event === "readout-retrieved");
    expect(events.length).toBe(1);

    await call(tools, "get_board_meeting_readout");
    const eventsAfter = session
      .getState()
      .transcript.filter((e) => e.kind === "event" && e.event === "readout-retrieved");
    expect(eventsAfter.length).toBe(1);
  });

  it("returns every readout section on the first call, compacted, inside the budget", async () => {
    const { tools } = toolsFor(FIXTURES.readout());
    const result = await call(tools, "get_board_meeting_readout");
    expect(result.ok).toBe(true);
    expect(result.compact).toBe(true);

    // All eight sections are present; none is ever dropped.
    for (const section of READOUT_SECTIONS) {
      expect(result, `missing readout section "${section}"`).toHaveProperty(section);
    }
    const recommendation = result.recommendation as { summary: string; divided: boolean; detail: string };
    expect(recommendation.summary).toBe(FIXTURE_READOUT.recommendation.summary);
    expect(recommendation.divided).toBe(true);
    expect(recommendation.detail.length).toBeLessThanOrEqual(160);

    for (const section of ["options", "tradeoffs", "assumptions", "open_questions", "next_actions", "closing_comments"] as const) {
      const list = result[section] as { total: number; items: string[] };
      expect(list.total).toBeGreaterThan(0);
      expect(list.items.length).toBeGreaterThan(0);
      expect(list.items.length).toBeLessThanOrEqual(list.total);
      for (const item of list.items) expect(item.length).toBeLessThanOrEqual(90);
    }
    expect(String(result.hint)).toBe("Call again with section=<name> for the full text");
    expect((JSON.stringify(result) ?? "").length).toBeLessThanOrEqual(MAX_OUTPUT_CHARACTERS);
  });

  it("serves the same readout text the human copy action produces", () => {
    expect(readoutFromSections(FIXTURE_READOUT)).toBe(readoutToText(FIXTURE_READOUT));
  });

  it("returns a single readout section on request and rejects unknown sections", async () => {
    const { tools } = toolsFor(FIXTURES.readout());
    const section = await call(tools, "get_board_meeting_readout", { section: "next_actions" });
    expect(section.ok).toBe(true);
    expect(section.section).toBe("next_actions");
    expect(String(section.text)).toContain("NEXT ACTIONS");

    const bad = await call(tools, "get_board_meeting_readout", { section: "vibes" });
    expect(bad.ok).toBe(false);
    expect(bad.error?.code).toBe("INVALID_INPUT");
    expect(bad.error?.message).toContain("closing_comments");
  });

  it("blocks guest actions before the meeting is in session", async () => {
    const { tools } = toolsFor(FIXTURES.briefing());
    const inspect = await call(tools, "inspect_board_meeting");
    expect(inspect.ok).toBe(true);
    expect(String(inspect.hint)).toContain("still choosing");

    const join = await call(tools, "join_board_meeting", { display_name: "Harness Agent" });
    expect(join.ok).toBe(false);
    expect(join.error?.code).toBe("NOT_AVAILABLE");
  });

  it("never throws, even on hostile input", async () => {
    const { tools } = toolsFor(FIXTURES.discussion());
    const results = await Promise.all([
      call(tools, "inspect_board_meeting", { transcript_limit: "banana", transcript_offset: -50 }),
      call(tools, "join_board_meeting", {}),
      call(tools, "contribute_to_board_meeting", { text: 12345 }),
      call(tools, "address_board_member", { member: "", text: "" }),
      call(tools, "request_board_synthesis", { wait_seconds: "9999" }),
      call(tools, "get_board_meeting_readout", { section: null }),
    ]);
    for (const result of results) expect(typeof result.ok).toBe("boolean");
  });
});
