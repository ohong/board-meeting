import { describe, expect, it } from "vitest";
import { EXAMPLE_BRIEFING, EXAMPLE_QUESTION } from "../lib/example";
import { createMockRuntime } from "../lib/runtime/mock";
import type { BoardRuntime } from "../lib/types";
import { brokenRuntime, DEMO_TRIO, flakyRuntime, newSession, seatDemoBoard } from "./helpers";

function messages(session: ReturnType<typeof newSession>) {
  return session.getState().transcript.filter((event) => event.kind === "message");
}

describe("opening positions", () => {
  it("forms one private position per adviser, in parallel, before discussion opens", async () => {
    const session = newSession();
    seatDemoBoard(session);
    expect(session.getState().briefing).toContain(EXAMPLE_QUESTION);
    expect(session.getState().briefing).toContain(EXAMPLE_BRIEFING);

    await session.startMeeting();
    const state = session.getState();

    expect(state.phase).toBe("meeting");
    expect(state.meetingPhase).toBe("discussion");
    expect(Object.keys(state.positions)).toHaveLength(3);
    expect(state.members.every((member) => member.status === "ready")).toBe(true);
    // Positions are private scaffolding, not transcript entries.
    expect(messages(session)).toHaveLength(0);
    for (const position of Object.values(state.positions)) {
      expect(position.recommendation.length).toBeGreaterThan(0);
      expect(position.question.length).toBeGreaterThan(0);
    }
  });

  it("recovers a failed opening position on one retry", async () => {
    const session = newSession({ runtime: flakyRuntime(1) });
    seatDemoBoard(session);
    await session.startMeeting();
    expect(Object.keys(session.getState().positions)).toHaveLength(3);
    expect(session.getState().meetingPhase).toBe("discussion");
  });

  it("opens discussion even when an adviser cannot form a position at all", async () => {
    const session = newSession({ runtime: brokenRuntime() });
    seatDemoBoard(session);
    const started = await session.startMeeting();

    expect(started.ok).toBe(true);
    expect(session.getState().meetingPhase).toBe("discussion");
    expect(session.getState().members.every((member) => member.status === "ready")).toBe(true);
  });
});

describe("discussion", () => {
  it("gives every adviser the floor before anyone takes a third turn", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    await session.runDiscussion(6);

    const counts = new Map<string, number>();
    for (const event of messages(session)) {
      counts.set(event.speakerId, (counts.get(event.speakerId) ?? 0) + 1);
    }
    expect(counts.size).toBe(3);
    for (const member of session.getState().members) {
      expect(member.spokenCount).toBeGreaterThanOrEqual(1);
    }
    // Six turns across three seats, with nobody running away with the room.
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
  });

  it("never lets the same adviser speak twice in a row unaddressed", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    await session.runDiscussion(6);

    const speakers = messages(session).map((event) => event.speakerId);
    for (let i = 1; i < speakers.length; i += 1) {
      expect(speakers[i]).not.toBe(speakers[i - 1]);
    }
  });

  it("carries reactions and requests for the floor as orchestration metadata", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    await session.runDiscussion(3);

    const withReaction = messages(session).filter((event) => event.reaction);
    expect(withReaction.length).toBeGreaterThan(0);
    const rebuttal = messages(session).find((event) => event.addressedTo);
    expect(rebuttal).toBeTruthy();
  });

  it("gives a direct @mention the next turn, overriding the queue", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    await session.runDiscussion(1);

    await session.sendUserMessage("@Lulu how do we explain this without losing user trust?");

    const all = messages(session);
    const chairIndex = all.findIndex((event) => event.speakerId === "chair");
    expect(chairIndex).toBeGreaterThan(-1);
    expect(all[chairIndex + 1]?.speakerId).toBe("lulu-cheng-meservey");
  });

  it("keeps a failed turn out of the transcript instead of leaving it half-written", async () => {
    const session = newSession({ runtime: brokenRuntime() });
    seatDemoBoard(session);
    await session.startMeeting();
    const spoke = await session.takeOneTurn();

    expect(spoke).toBe(false);
    expect(messages(session)).toHaveLength(0);
    expect(session.getState().members.every((member) => member.status !== "speaking")).toBe(true);
    expect(session.getState().lastError).toBeTruthy();
  });

  it("clears a stale failure notice once someone speaks", async () => {
    const mock = createMockRuntime();
    const noPositions: BoardRuntime = {
      ...mock,
      formOpeningPosition() {
        throw new Error("opening position failed");
      },
    };
    const session = newSession({ runtime: noPositions });
    seatDemoBoard(session);
    await session.startMeeting();
    expect(session.getState().lastError).toBeTruthy();

    await session.runDiscussion(1);
    expect(session.getState().lastError).toBeNull();
  });

  it("names the connection, not the adviser, when nobody has managed to speak", async () => {
    const session = newSession({ runtime: brokenRuntime() });
    seatDemoBoard(session);
    await session.startMeeting();
    await session.takeOneTurn();

    expect(session.getState().lastError).toContain("No adviser could reach the model");
  });

  it("streams a turn into a single transcript row", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();

    const lengths: number[] = [];
    const unsubscribe = session.subscribe(() => {
      const streaming = session.getState().transcript.filter((event) => event.streaming);
      if (streaming.length) {
        expect(streaming).toHaveLength(1);
        lengths.push(streaming[0].text.length);
      }
    });
    await session.takeOneTurn();
    unsubscribe();

    expect(lengths.length).toBeGreaterThan(3);
    expect(lengths[lengths.length - 1]).toBeGreaterThan(lengths[0]);
    expect(session.getState().transcript.some((event) => event.streaming)).toBe(false);
  });
});

describe("ending the meeting", () => {
  it("collects a closing comment from every adviser and produces every readout section", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    await session.runDiscussion(4);
    await session.endMeeting();

    const state = session.getState();
    expect(state.phase).toBe("readout");
    expect(state.meetingPhase).toBe("closed");

    const readout = state.readout!;
    expect(readout.decision).toBeTruthy();
    expect(readout.recommendation).toBeTruthy();
    expect(readout.options.length).toBeGreaterThan(0);
    expect(readout.tradeoffs.length).toBeGreaterThan(0);
    expect(readout.assumptions.length).toBeGreaterThan(0);
    expect(readout.openQuestions.length).toBeGreaterThan(0);
    expect(readout.nextActions.length).toBeGreaterThan(0);
    expect(readout.closingComments).toHaveLength(3);
    expect(readout.closingComments.map((comment) => comment.name)).toEqual(
      state.members.map((member) => member.name),
    );
  });

  it("preserves a divided board rather than manufacturing consensus", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    await session.runDiscussion(4);
    await session.endMeeting();

    const readout = session.getState().readout!;
    expect(readout.divided).toBe(true);
    expect(readout.recommendation.toLowerCase()).toContain("divided");
  });

  it("ensures every seated adviser has spoken publicly by the time the readout exists", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    // End early, before the pump has been round the table.
    await session.takeOneTurn();
    await session.endMeeting();

    const speakers = new Set(messages(session).map((event) => event.speakerId));
    for (const member of session.getState().members) {
      expect(speakers.has(member.slug)).toBe(true);
    }
  });

  it("falls back to a transcript-derived memo when the secretary fails twice", async () => {
    const session = newSession({ runtime: flakyRuntime(99) });
    seatDemoBoard(session);
    await session.startMeeting();
    await session.endMeeting();

    const readout = session.getState().readout!;
    expect(readout.fallback).toBe(true);
    expect(readout.fallbackReason).toBe("synthesis-failed");
    expect(readout.decision).toContain("free tier");
    expect(readout.closingComments).toHaveLength(3);
    expect(session.getState().phase).toBe("readout");

    // Closing comments have their own section; the record must not print them twice.
    const digest = readout.transcriptDigest ?? [];
    for (const comment of readout.closingComments) {
      expect(digest.some((line) => line.includes(comment.comment))).toBe(false);
    }
  });

  it("says the stand-in had nothing to synthesise rather than blaming the secretary", async () => {
    const session = newSession();
    for (const slug of DEMO_TRIO) session.toggleMember(slug);
    session.goToBrief();
    session.setBriefing(
      "Question: Should we move support from email to live chat?\n\nBriefing: Three people on email, four-hour median first reply.",
    );
    await session.startMeeting();
    await session.runDiscussion(3);
    await session.endMeeting();

    const readout = session.getState().readout!;
    expect(readout.fallbackReason).toBe("stand-in");
    expect(readout.recommendation).toContain("stand-in");
  });
});

describe("session lifecycle", () => {
  it("resets to board selection with nothing carried over", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    await session.runDiscussion(2);
    session.join("Codex");
    await session.endMeeting();

    session.reset();
    const state = session.getState();
    expect(state.phase).toBe("select");
    expect(state.selected).toEqual([]);
    expect(state.briefing).toBe("");
    expect(state.transcript).toEqual([]);
    expect(state.members).toEqual([]);
    expect(state.readout).toBeNull();
    expect(state.guest).toEqual({ name: null, status: "empty" });
    expect(state.agentActivity).toEqual([]);
  });
});

describe("passing", () => {
  it("lets an adviser pass rather than fill airtime, and stops the room when all do", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    await session.runDiscussion(20);

    const state = session.getState();
    // Two scripted rounds each, then nothing to add — no filler on the record.
    expect(state.members.every((member) => member.spokenCount === 2)).toBe(true);
    expect(state.transcript.some((event) => event.streaming)).toBe(false);
    expect(state.transcript.filter((event) => event.kind === "message")).toHaveLength(6);
    expect(state.lastError).toBeNull();

    // A pass is not a failure: nobody is stuck speaking or reconnecting.
    expect(state.members.every((member) => member.status === "ready")).toBe(true);
    expect(await session.takeOneTurn()).toBe(false);
  });

  it("brings a passed adviser back when the chair or the guest adds something new", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    await session.runDiscussion(20);
    expect(await session.takeOneTurn()).toBe(false);

    session.join("Codex");
    await session.contribute("Seven of our last ten enterprise wins came in through a shared free workspace.");
    expect(await session.takeOneTurn()).toBe(true);
  });

  it("answers a direct mention even from an adviser who had nothing left to add", async () => {
    const session = newSession();
    seatDemoBoard(session);
    await session.startMeeting();
    await session.runDiscussion(20);

    await session.sendUserMessage("@Lulu what is the sentence we should send on Monday?");
    const last = session.getState().transcript.filter((event) => event.kind === "message").at(-1);
    expect(last?.speakerId).toBe("lulu-cheng-meservey");
  });
});

describe("the stand-in on a decision it has no script for", () => {
  it("says it has nothing to offer rather than claiming synthesis failed", async () => {
    const session = newSession();
    session.toggleMember("daniel-ek");
    session.toggleMember("rick-rubin");
    session.toggleMember("todd-graves");
    session.goToBrief();
    session.setBriefing("Should I move from London to Lisbon next year?");
    await session.startMeeting();
    await session.runDiscussion(4);
    await session.endMeeting();

    const readout = session.getState().readout!;
    expect(readout.decision).toContain("Lisbon");
    expect(readout.recommendation).toContain("scripted stand-in");
    expect(readout.recommendation).toContain("OPENAI_API_KEY");
    // The synthesis-failure wording would be a lie: nothing failed.
    expect(readout.recommendation).not.toContain("could not");
    expect(readout.closingComments).toHaveLength(3);
  });
});
