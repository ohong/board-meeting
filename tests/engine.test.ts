import { afterEach, describe, expect, it } from "vitest";
import {
  compactTranscriptForModel,
  createEngine,
  MAX_MODEL_CONTEXT_CHARACTERS,
  MAX_MODEL_CONTEXT_LINES,
  type MeetingEngine,
} from "@/lib/meeting/engine";
import { DEMO_TRIO } from "@/lib/meeting/fixtures";
import { createMockRuntime } from "@/lib/meeting/runtime/mock";
import { MeetingSession } from "@/lib/meeting/session";
import type { BoardRuntime, TranscriptLine } from "@/lib/meeting/types";

const engines: MeetingEngine[] = [];
afterEach(() => { engines.splice(0).forEach((e) => e.dispose()); });

function setupWithRuntime(runtime: BoardRuntime) {
  const session = new MeetingSession(); DEMO_TRIO.forEach((p) => session.toggleMember(p)); session.setBriefing("Should we eliminate free? Invited teams may be material.");
  const engine = createEngine(session, runtime); engines.push(engine); session.startMeeting(); return session;
}

function setup(failure?: NonNullable<Parameters<typeof createMockRuntime>[0]>["failOnce"]) {
  return setupWithRuntime(createMockRuntime({ delayScale: 0.002, failOnce: failure }));
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

  it("reaches a natural pause, stays idle, and resumes after chair input", async () => {
    const session = setup();
    const pauseCount = () => session.getState().transcript.filter(
      (entry) => entry.kind === "event" && entry.event === "notice" && entry.text.includes("natural pause"),
    ).length;

    await until(() => pauseCount() === 1);
    const turnsAtPause = memberMessages(session).length;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(memberMessages(session)).toHaveLength(turnsAtPause);

    session.sendChairMessage("One more constraint: the migration must finish this quarter.");
    await until(() => memberMessages(session).length > turnsAtPause);
    await until(() => pauseCount() === 2);
  });

  it("caps an autonomous burst even when every reaction has high urgency", async () => {
    const runtime = createMockRuntime({ delayScale: 0.002 });
    runtime.reactMany = async (inputs) => inputs.map(() => ({ reaction: "concern", urgency: 10, wantsToRebut: false }));
    const session = setupWithRuntime(runtime);

    await until(() => session.getState().transcript.some(
      (entry) => entry.kind === "event" && entry.event === "notice" && entry.text.includes("natural pause"),
    ));
    expect(memberMessages(session)).toHaveLength(10);
  });

  it("does not continue while the chair has a non-empty draft", async () => {
    const session = setup();
    await until(() => memberMessages(session).length >= 1 && !session.getState().streamingEntryId);
    session.setChairComposing(true);
    const turnsWhileTyping = memberMessages(session).length;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(memberMessages(session)).toHaveLength(turnsWhileTyping);

    session.setChairComposing(false);
    await until(() => memberMessages(session).length > turnsWhileTyping);
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

  it("bounds the transcript sent to repeated model calls", () => {
    const lines: TranscriptLine[] = Array.from({ length: 60 }, (_, index) => ({
      speakerId: `member-${index}`,
      speakerName: `Member ${index}`,
      role: "member",
      text: `${index}: ${"x".repeat(2_500)}`,
      addressedName: null,
    }));

    const compact = compactTranscriptForModel(lines);
    expect(compact.length).toBeLessThanOrEqual(MAX_MODEL_CONTEXT_LINES);
    expect(compact.reduce((sum, line) => sum + line.text.length, 0)).toBeLessThanOrEqual(MAX_MODEL_CONTEXT_CHARACTERS);
    expect(compact[0]).toMatchObject({ speakerId: "system", role: "system" });
    expect(compact.at(-1)?.speakerName).toBe("Member 59");
    expect(compact.at(-1)?.text.length).toBeLessThanOrEqual(2_000);
  });
});
