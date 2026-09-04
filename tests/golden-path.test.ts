import { describe, expect, it } from "vitest";
import { CATALOG, DEMO_SLUGS, searchCatalog } from "../lib/catalog";
import { EXAMPLE_BRIEFING, EXAMPLE_DECISION, EXAMPLE_QUESTION } from "../lib/example";
import { createMockRuntime } from "../lib/runtime/mock";
import { createMeetingSession } from "../lib/session";

function demo(session: ReturnType<typeof createMeetingSession>) {
  session.toggleMember("daniel-ek");
  session.toggleMember("david-heinemeier-hansson");
  session.toggleMember("lulu-cheng-meservey");
}

describe("catalog", () => {
  it("searches by name and role including demo trio aliases", () => {
    expect(searchCatalog("ek").some((m) => m.slug === "daniel-ek")).toBe(true);
    expect(searchCatalog("DHH").some((m) => m.slug === "david-heinemeier-hansson")).toBe(true);
    expect(searchCatalog("Lulu").some((m) => m.slug === "lulu-cheng-meservey")).toBe(true);
    expect(searchCatalog("Spotify").length).toBeGreaterThan(0);
    expect(CATALOG.length).toBeGreaterThanOrEqual(30);
  });

  it("gives every adviser a searchable decision lens", () => {
    expect(CATALOG.every((member) => member.decisionLens.trim().length > 0)).toBe(true);
    expect(searchCatalog("freemium consumer").map((member) => member.slug)).toContain("daniel-ek");
    expect(searchCatalog("creative candor").map((member) => member.slug)).toContain("ed-catmull");
  });

  it("blocks a seventh selection", () => {
    const session = createMeetingSession({ runtime: createMockRuntime() });
    const slugs = CATALOG.slice(0, 7).map((m) => m.slug);
    const results = slugs.map((s) => session.toggleMember(s));
    expect(results.slice(0, 6).every((r) => r.ok)).toBe(true);
    expect(results[6]?.ok).toBe(false);
    expect(session.getState().selected).toHaveLength(6);
    expect(session.getState().selectionMessage).toMatch(/six/i);
  });

  it("seats the exact demo board atomically during setup and locks it after start", async () => {
    const session = createMeetingSession({ runtime: createMockRuntime() });
    for (const member of CATALOG.slice(0, 7)) session.toggleMember(member.slug);
    session.setSearch("no match");
    expect(session.getState().selectionMessage).toMatch(/six/i);

    let notifications = 0;
    session.subscribe(() => {
      notifications += 1;
    });

    expect(session.useDemoBoard()).toEqual({ ok: true });
    expect(notifications).toBe(1);
    expect(session.getState()).toMatchObject({
      selected: [...DEMO_SLUGS],
      search: "",
      selectionMessage: null,
    });

    expect(session.goToBrief().ok).toBe(true);
    session.toggleMember(DEMO_SLUGS[0]);
    expect(session.useDemoBoard()).toEqual({ ok: true });
    expect(session.getState().selected).toEqual([...DEMO_SLUGS]);

    session.setBriefing("Question: Should we change course?");
    expect((await session.startMeeting()).ok).toBe(true);
    const activeState = session.getState();
    const beforeRejectedAction = notifications;
    expect(session.useDemoBoard()).toEqual({
      ok: false,
      message: "Board membership is locked for this meeting.",
    });
    expect(notifications).toBe(beforeRejectedAction);
    expect(session.getState()).toEqual(activeState);
  });
});

describe("golden path", () => {
  it("runs select, example briefing, start, mentions, webmcp, end, readout, reset", async () => {
    const session = createMeetingSession({
      runtime: createMockRuntime(),
      autoContinue: false,
      joinDelayMs: 0,
    });
    expect(session.getState().phase).toBe("select");

    demo(session);
    expect(session.getState().selected).toEqual([
      "daniel-ek",
      "david-heinemeier-hansson",
      "lulu-cheng-meservey",
    ]);

    session.goToBrief();
    session.useExampleDecision();
    expect(session.getState().briefing).toBe(EXAMPLE_DECISION);
    expect(session.getState().briefing).toContain(EXAMPLE_QUESTION);
    expect(session.getState().briefing).toContain(EXAMPLE_BRIEFING);

    const started = await session.startMeeting();
    expect(started.ok).toBe(true);
    const afterStart = session.getState();
    expect(afterStart.phase).toBe("meeting");
    expect(afterStart.members.every((m) => m.status === "ready")).toBe(true);
    expect(Object.keys(afterStart.positions)).toHaveLength(3);

    await session.pumpDiscussion(3);
    const speakers = session
      .getState()
      .transcript.filter((e) => e.kind === "message")
      .map((e) => e.speakerId);
    expect(speakers).toContain("daniel-ek");
    expect(speakers).toContain("david-heinemeier-hansson");
    expect(speakers).toContain("lulu-cheng-meservey");
    expect(new Set(speakers).size).toBeGreaterThanOrEqual(3);

    await session.sendUserMessage(
      "@Lulu how do we explain a free-tier change without losing user trust?",
    );
    const afterMention = session.getState().transcript.filter((e) => e.kind === "message");
    const lastBoard = [...afterMention].reverse().find((e) => e.speakerId !== "chair");
    expect(lastBoard?.speakerId).toBe("lulu-cheng-meservey");

    const joined = session.join("Codex");
    expect(joined.ok).toBe(true);
    expect(session.getState().guest.name).toBe("Codex");

    const contrib = await session.contribute(
      "Seven of our last ten enterprise wins first entered through a free workspace shared by an existing user. Those accounts now represent 22% of ARR.",
    );
    expect(contrib.ok).toBe(true);

    const addressed = await session.address(
      "Daniel Ek",
      "Does that enterprise-referral evidence change your view of killing the free tier?",
    );
    expect(addressed.ok).toBe(true);
    const afterAddress = session.getState().transcript.filter((e) => e.kind === "message");
    const last = afterAddress[afterAddress.length - 1];
    expect(last?.speakerId).toBe("daniel-ek");
    expect(last?.addressedTo).toBe("Codex");

    const synthesis = await session.requestSynthesis();
    expect(synthesis.ok).toBe(true);

    expect(session.guestEndMeeting().ok).toBe(false);

    const ended = await session.endMeeting();
    expect(ended.ok).toBe(true);
    const readout = session.getState().readout;
    expect(readout).toBeTruthy();
    expect(readout?.decision).toBeTruthy();
    expect(readout?.recommendation.toLowerCase()).toMatch(/divid/);
    expect(readout?.divided).toBe(true);
    expect(readout?.options.length).toBeGreaterThan(0);
    expect(readout?.tradeoffs.length).toBeGreaterThan(0);
    expect(readout?.assumptions.length).toBeGreaterThan(0);
    expect(readout?.openQuestions.length).toBeGreaterThan(0);
    expect(readout?.nextActions.length).toBeGreaterThan(0);
    expect(readout?.closingComments).toHaveLength(3);

    const tool = session.getReadout();
    expect(tool.ready).toBe(true);

    session.reset();
    const fresh = session.getState();
    expect(fresh.phase).toBe("select");
    expect(fresh.selected).toEqual([]);
    expect(fresh.transcript).toEqual([]);
    expect(fresh.readout).toBeNull();
  });
});
