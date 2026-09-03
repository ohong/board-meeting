import { describe, expect, it } from "vitest";
import { DEMO_TRIO, FIXTURE_PERSONAS } from "@/lib/meeting/fixtures";
import { MeetingSession } from "@/lib/meeting/session";

function activeSession(count = 3) {
  const session = new MeetingSession();
  FIXTURE_PERSONAS.slice(0, count).forEach((p) => session.toggleMember(p));
  session.setBriefing("A consequential decision with enough context.");
  session.startMeeting();
  return session;
}

describe("MeetingSession contracts", () => {
  it("enforces minimum and maximum board size and notices a seventh selection", () => {
    const session = new MeetingSession();
    FIXTURE_PERSONAS.slice(0, 2).forEach((p) => session.toggleMember(p));
    expect(session.goToBriefing()).toMatchObject({ ok: false, error: { code: "LIMIT" } });
    FIXTURE_PERSONAS.slice(2, 6).forEach((p) => session.toggleMember(p));
    const seventh = { ...FIXTURE_PERSONAS[0], slug: "seventh", name: "Seventh Member", shortName: "Seventh" };
    expect(session.toggleMember(seventh)).toMatchObject({ ok: false, error: { code: "LIMIT" } });
    expect(session.getState().notice?.text).toContain("at most 6");
  });

  it("parses short and full-name mentions", () => {
    const session = activeSession();
    expect(session.parseMention("What do you think, @DHH?")?.id).toBe("david-heinemeier-hansson");
    expect(session.parseMention("Please answer, @Daniel Ek")?.id).toBe("daniel-ek");
  });

  it("only exposes finalization through the chair action during a live meeting", () => {
    const session = new MeetingSession();
    expect(session.endMeeting()).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
    const active = activeSession();
    expect(active.endMeeting()).toEqual({ ok: true });
    expect(active.getState().phase).toBe("closing");
  });

  it("prevents a guest joining before start or twice", () => {
    const session = new MeetingSession();
    expect(session.joinGuest("Codex")).toMatchObject({ ok: false, error: { code: "NOT_AVAILABLE" } });
    const active = activeSession();
    expect(active.joinGuest("Codex")).toMatchObject({ ok: true });
    expect(active.joinGuest("Another")).toMatchObject({ ok: false, error: { code: "ALREADY_JOINED" } });
  });

  it("reports readout not ready before end and rejects unknown guest address targets", () => {
    const session = activeSession();
    expect(session.getReadout()).toMatchObject({ ok: false, error: { code: "NOT_READY" } });
    session.joinGuest("Codex");
    expect(session.guestAddress("Nobody", "Question?")).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
  });
});

describe("review fixes", () => {
  function live() {
    const s = new MeetingSession();
    DEMO_TRIO.forEach((p) => s.toggleMember(p));
    s.setBriefing("Should we eliminate free?");
    s.startMeeting();
    s.engineSetPhase("discussion");
    return s;
  }

  it("rejects guest names that impersonate the chair, system, or a member", () => {
    const s = live();
    for (const name of ["You", "system", "Secretary", "Daniel Ek", "DHH", "lulu"]) {
      const r = s.joinGuest(name);
      expect(r.ok, name).toBe(false);
    }
    expect(s.joinGuest("Codex").ok).toBe(true);
  });

  it("marks a still-streaming synthesis as cancelled when the chair ends the meeting", () => {
    const s = live();
    expect(s.joinGuest("Codex").ok).toBe(true);
    const r = s.requestSynthesis("guest");
    expect(r.ok).toBe(true);
    s.endMeeting();
    const entry = s.getState().transcript.find((e) => e.kind === "synthesis");
    expect(entry && entry.kind === "synthesis" && !entry.streaming && entry.failed).toBe(true);
    expect(s.getState().queue).toEqual([]);
  });

  it("labels guest and chair lines for the model transcript", () => {
    const s = live();
    s.sendChairMessage("Some context");
    s.joinGuest("Codex");
    s.guestContribute("Seven of ten wins came through free.");
    const names = s.transcriptLines().map((l) => l.speakerName);
    expect(names).toContain("Chair (founder)");
    expect(names).toContain("Codex (external agent)");
  });
});
