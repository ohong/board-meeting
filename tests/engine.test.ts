import { afterEach, describe, expect, it } from "vitest";
import { createEngine, type MeetingEngine } from "@/lib/meeting/engine";
import { DEMO_TRIO } from "@/lib/meeting/fixtures";
import { createMockRuntime } from "@/lib/meeting/runtime/mock";
import { MeetingSession } from "@/lib/meeting/session";

const engines: MeetingEngine[] = [];
afterEach(() => { engines.splice(0).forEach((e) => e.dispose()); });

function setup(failure?: NonNullable<Parameters<typeof createMockRuntime>[0]>["failOnce"]) {
  const session = new MeetingSession(); DEMO_TRIO.forEach((p) => session.toggleMember(p)); session.setBriefing("Should we eliminate free? Invited teams may be material.");
  const engine = createEngine(session, createMockRuntime({ delayScale: 0.002, failOnce: failure })); engines.push(engine); session.startMeeting(); return session;
}

async function until(check: () => boolean, timeout = 3000) {
  const started = Date.now(); while (!check()) { if (Date.now() - started > timeout) throw new Error("Timed out waiting for engine state"); await new Promise((r) => setTimeout(r, 2)); }
}

function memberMessages(session: MeetingSession) { return session.getState().transcript.filter((e) => e.kind === "message" && e.speakerRole === "member" && !e.streaming); }

describe("meeting engine", () => {
  it("runs the golden path through direct address, guest input, synthesis, and readout", async () => {
    const session = setup();
    await until(() => session.getState().phase === "discussion" && memberMessages(session).length >= 1);
    session.sendChairMessage("@Lulu how do we explain this without losing trust?");
    await until(() => memberMessages(session).some((e) => e.kind === "message" && e.speakerId === "lulu-cheng-meservey" && e.addressedTo === "chair"));
    expect(session.joinGuest("Codex").ok).toBe(true);
    session.guestContribute("Context the board does not have: our five largest customers by ARR each expanded only after a second team was invited into their workspace, and the median time from first invite to paid was 41 days.");
    await until(() => session.getState().guest?.status === "joined");
    session.guestAddress("Daniel Ek", "Does the invite-to-paid evidence change your view of the free tier?");
    await until(() => memberMessages(session).some((e) => e.kind === "message" && e.speakerId === "daniel-ek" && e.addressedTo === "guest"));
    const synthesis = session.requestSynthesis("guest"); expect(synthesis.ok).toBe(true);
    await until(() => session.getState().transcript.some((e) => e.kind === "synthesis" && !e.streaming && /Agreement:/.test(e.text)));
    session.endMeeting(); await until(() => session.getState().readoutStatus === "ready");
    const readout = session.getState().readout!;
    expect(readout.recommendation.divided).toBe(true);
    expect(readout.options.length).toBeGreaterThan(0); expect(readout.tradeoffs.length).toBeGreaterThan(0); expect(readout.assumptions.length).toBeGreaterThan(0); expect(readout.openQuestions.length).toBeGreaterThan(0); expect(readout.nextActions.length).toBeGreaterThan(0);
    expect(readout.closingComments).toHaveLength(3);
  });

  it("does not give anyone a third turn before every available member speaks", async () => {
    const session = setup(); await until(() => memberMessages(session).length >= 4);
    const firstFour = memberMessages(session).slice(0, 4).map((e) => e.kind === "message" ? e.speakerId : "");
    expect(new Set(firstFour.slice(0, 3)).size).toBe(3);
    expect(firstFour.slice(0, 3).every((id) => firstFour.filter((x) => x === id).length <= 2)).toBe(true);
  });

  it("recovers from one injected turn failure and still produces a readout", async () => {
    const session = setup({ method: "turn", slug: "david-heinemeier-hansson" });
    await until(() => memberMessages(session).length >= 3);
    expect(session.member("david-heinemeier-hansson")?.turns).toBeGreaterThan(0);
    session.endMeeting(); await until(() => session.getState().readoutStatus === "ready");
    expect(session.getState().readout).not.toBeNull();
  });

  it("aborts work and leaves a clean initial state after reset", async () => {
    const session = setup(); await until(() => session.getState().phase === "discussion"); session.reset(); await new Promise((r) => setTimeout(r, 30));
    expect(session.getState().phase).toBe("selecting"); expect(session.getState().transcript).toEqual([]); expect(session.getState().streamingEntryId).toBeNull();
  });
});
