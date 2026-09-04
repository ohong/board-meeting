import { describe, expect, it } from "vitest";
import { DEMO_TRIO, FIXTURE_PERSONAS } from "@/lib/meeting/fixtures";
import {
  MAX_BRIEFING_CHARACTERS,
  MAX_CHAIR_MESSAGE_CHARACTERS,
  MeetingSession,
} from "@/lib/meeting/session";

function activeSession(count = 3) {
  const session = new MeetingSession();
  FIXTURE_PERSONAS.slice(0, count).forEach((p) => session.toggleMember(p));
  session.setBriefing("A consequential decision with enough context.");
  session.startMeeting();
  return session;
}

function markEveryMemberSpoken(session: MeetingSession) {
  session.engineSetPhase("discussion");
  for (const member of session.members()) {
    const entry = session.engineBeginMessage(member.id, {
      addressedTo: "board",
      addressedName: null,
      intent: "statement",
      interruption: false,
    });
    session.engineSetText(entry.id, `${member.persona.shortName} contributed.`);
    session.engineEndMessage(entry.id);
  }
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
    expect(active.endMeeting()).toMatchObject({ ok: false, error: { code: "NOT_ALLOWED" } });
    markEveryMemberSpoken(active);
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

  it("keeps client input within the server request limits", () => {
    const session = new MeetingSession();
    session.setBriefing("b".repeat(MAX_BRIEFING_CHARACTERS + 50));
    expect(session.getState().briefing).toHaveLength(MAX_BRIEFING_CHARACTERS);

    const active = activeSession();
    expect(active.sendChairMessage("m".repeat(MAX_CHAIR_MESSAGE_CHARACTERS + 1))).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT" },
    });
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
    markEveryMemberSpoken(s);
    s.endMeeting();
    const entry = s.getState().transcript.find((e) => e.kind === "synthesis");
    expect(entry && entry.kind === "synthesis" && !entry.streaming && entry.failed).toBe(true);
    expect(s.getState().queue).toEqual([]);
  });

  it("labels guest and chair lines for the model transcript", () => {
    const s = live();
    s.sendChairMessage("Some context");
    s.joinGuest("Codex");
    s.guestContribute("Our largest customers expanded after a second team was invited in.");
    const names = s.transcriptLines().map((l) => l.speakerName);
    expect(names).toContain("Chair (founder)");
    expect(names).toContain("Codex (external agent)");
  });

  it("merges new room input without overwriting newer chair work or replaying acknowledged input", () => {
    const chair = live();
    chair.attachRoom("abcdefghjkmn", "chair-key", 1);
    const remote = new MeetingSession(chair.getState());
    remote.joinGuest("Codex");
    remote.setGuestStatus("joined");
    remote.guestContribute("Pilot retention is twice the free cohort.");

    chair.applyRoomState(remote.getState(), true, 2, true);
    const input = chair.getState().queue[0];
    expect(input.kind).toBe("guest-context");
    chair.engineDequeue(input.id);
    expect(chair.getAcknowledgedRoomInputIds()).toEqual([input.id]);

    const member = chair.members()[0];
    const localTurn = chair.engineBeginMessage(member.id, {
      addressedTo: "board",
      addressedName: null,
      intent: "answer",
      interruption: false,
    });
    chair.engineSetText(localTurn.id, "This is newer chair-hosted model output.");
    chair.engineEndMessage(localTurn.id);
    chair.applyRoomState(remote.getState(), true, 3, true);

    expect(chair.getState().queue).toHaveLength(0);
    expect(chair.getState().transcript.some((entry) => entry.id === localTurn.id)).toBe(true);
  });
});
