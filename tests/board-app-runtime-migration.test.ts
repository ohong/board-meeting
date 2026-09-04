import { describe, expect, it } from "vitest";
import { migratePreMeetingSession } from "../components/BoardApp";
import { createMockRuntime } from "../lib/runtime/mock";
import { createMeetingSession, type MeetingSession } from "../lib/session";

const DEMO_BOARD = ["daniel-ek", "david-heinemeier-hansson", "lulu-cheng-meservey"];

function createSession(runtimeId: "mock" | "live" = "mock") {
  const runtime = createMockRuntime();
  return createMeetingSession({
    runtime: runtimeId === "live" ? { ...runtime, id: "live" as const } : runtime,
    autoContinue: false,
  });
}

function selectDemoBoard(session: MeetingSession) {
  for (const slug of DEMO_BOARD) {
    expect(session.toggleMember(slug).ok).toBe(true);
  }
}

function setupSnapshot(session: MeetingSession) {
  const { phase, search, selected, briefing } = session.getState();
  return { phase, search, selected, briefing };
}

describe("pre-meeting runtime migration", () => {
  it("replays an in-progress selection exactly after resetting the old session", () => {
    const source = createSession();
    source.setSearch("founder operator");
    expect(source.toggleMember(DEMO_BOARD[1]).ok).toBe(true);
    expect(source.toggleMember(DEMO_BOARD[0]).ok).toBe(true);
    source.setBriefing("A draft decision that has not reached the briefing step.");
    const before = setupSnapshot(source);
    let resetBeforeReplacement = false;

    const migrated = migratePreMeetingSession(source, () => {
      resetBeforeReplacement = setupSnapshot(source).selected.length === 0;
      return createSession("live");
    });

    expect(resetBeforeReplacement).toBe(true);
    expect(migrated).not.toBeNull();
    expect(setupSnapshot(migrated!)).toEqual(before);
    expect(migrated!.getState().runtimeId).toBe("live");
    expect(setupSnapshot(source)).toEqual({ phase: "select", search: "", selected: [], briefing: "" });
  });

  it("restores the selected roster, search, briefing, and brief phase", () => {
    const source = createSession();
    selectDemoBoard(source);
    source.setSearch("strategy");
    source.setBriefing("Should we enter the market this quarter?");
    expect(source.goToBrief().ok).toBe(true);
    const before = setupSnapshot(source);

    const migrated = migratePreMeetingSession(source, () => createSession("live"));

    expect(migrated).not.toBeNull();
    expect(setupSnapshot(migrated!)).toEqual(before);
  });

  it("does not replace or reset an active meeting", async () => {
    const source = createSession();
    selectDemoBoard(source);
    source.setBriefing("Should we change course?");
    expect(source.goToBrief().ok).toBe(true);
    expect((await source.startMeeting()).ok).toBe(true);
    let replacementCreated = false;

    const migrated = migratePreMeetingSession(source, () => {
      replacementCreated = true;
      return createSession("live");
    });

    expect(migrated).toBeNull();
    expect(replacementCreated).toBe(false);
    expect(source.getState().phase).toBe("meeting");
    expect(source.getState().selected).toEqual(DEMO_BOARD);
  });

  it("does not replace or reset a completed readout", async () => {
    const source = createSession();
    selectDemoBoard(source);
    source.setBriefing("Should we change course?");
    expect(source.goToBrief().ok).toBe(true);
    expect((await source.startMeeting()).ok).toBe(true);
    expect((await source.endMeeting()).ok).toBe(true);

    const migrated = migratePreMeetingSession(source, () => createSession("live"));

    expect(migrated).toBeNull();
    expect(source.getState().phase).toBe("readout");
    expect(source.getState().readout).not.toBeNull();
  });
});
