import { describe, expect, it } from "vitest";
import { EXAMPLE_DECISION } from "../lib/example";
import { createMockRuntime } from "../lib/runtime/mock";
import { createMeetingSession, type MeetingSession } from "../lib/session";
import type { BoardRuntime, RuntimeTurnInput } from "../lib/types";

function selectDemo(session: MeetingSession) {
  session.toggleMember("daniel-ek");
  session.toggleMember("david-heinemeier-hansson");
  session.toggleMember("lulu-cheng-meservey");
  session.goToBrief();
  session.setBriefing("Question: Should we change course?\n\nBriefing: Customer evidence is mixed.");
}

async function started(
  runtime: BoardRuntime,
  options: { joinDelayMs?: number; runtimeDeadlineMs?: number } = {},
) {
  const session = createMeetingSession({ runtime, autoContinue: false, ...options });
  selectDemo(session);
  expect((await session.startMeeting()).ok).toBe(true);
  return session;
}

async function waitUntil(predicate: () => boolean, message: string) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (predicate()) return;
    await Promise.resolve();
  }
  throw new Error(message);
}

function derivedRuntime(overrides: Partial<BoardRuntime> = {}): BoardRuntime {
  const mock = createMockRuntime();
  return {
    ...mock,
    async formOpeningPosition(input) {
      return {
        memberId: input.memberId,
        recommendation: `Review ${input.briefing}`,
        reasoning: `Reasoning from ${input.briefing}`,
        concern: "The evidence is mixed.",
        question: "What would resolve it?",
      };
    },
    async publicTurn(input) {
      return { text: `${input.memberName} considered: ${input.briefing}` };
    },
    async closingComment(input) {
      return `${input.memberName} closes from the supplied briefing.`;
    },
    ...overrides,
  };
}

describe("meeting session serialization and recovery", () => {
  it("bounds hung opening attempts without serializing the board", async () => {
    let active = 0;
    let maxActive = 0;
    let attempts = 0;
    const runtime = derivedRuntime({
      formOpeningPosition() {
        attempts += 1;
        active += 1;
        maxActive = Math.max(maxActive, active);
        return new Promise<never>(() => undefined);
      },
    });
    const session = createMeetingSession({
      runtime,
      autoContinue: false,
      runtimeDeadlineMs: 1,
    });
    selectDemo(session);

    await expect(session.startMeeting()).resolves.toMatchObject({ ok: true });
    expect(attempts).toBe(6);
    expect(maxActive).toBeGreaterThanOrEqual(3);
    expect(Object.keys(session.getState().positions)).toHaveLength(3);
  });

  it("reset cancels every parallel runtime attempt even when promises ignore abort", async () => {
    const signals: AbortSignal[] = [];
    const runtime = derivedRuntime({
      formOpeningPosition(_input, options) {
        if (options?.signal) signals.push(options.signal);
        return new Promise<never>(() => undefined);
      },
    });
    const session = createMeetingSession({
      runtime,
      autoContinue: false,
      runtimeDeadlineMs: 10_000,
    });
    selectDemo(session);
    const pending = session.startMeeting();
    await waitUntil(() => signals.length === 3, "parallel opening attempts did not start");

    session.reset();

    await expect(pending).resolves.toMatchObject({ ok: false });
    expect(signals.every((signal) => signal.aborted)).toBe(true);
    expect(session.getState().phase).toBe("select");
  });

  it("reveals independently completed mock openings without slowing the default runtime", async () => {
    const releases = new Map<number, () => void>();
    const delays = new Map([
      ["daniel-ek", 420],
      ["david-heinemeier-hansson", 760],
      ["lulu-cheng-meservey", 1100],
    ]);
    const runtime = createMockRuntime({
      openingDelayMs: (memberId) => delays.get(memberId) ?? 0,
      wait: (milliseconds) =>
        new Promise<void>((resolve) => {
          releases.set(milliseconds, resolve);
        }),
    });
    const session = createMeetingSession({ runtime, autoContinue: false });
    selectDemo(session);

    const starting = session.startMeeting();
    await waitUntil(() => releases.size === 3, "mock openings did not begin in parallel");
    expect(session.getState().members.map(({ status }) => status)).toEqual([
      "thinking",
      "thinking",
      "thinking",
    ]);

    releases.get(420)?.();
    await waitUntil(
      () => session.getState().members[0]?.status === "ready",
      "first opening did not become ready",
    );
    expect(session.getState().members.map(({ status }) => status)).toEqual([
      "ready",
      "thinking",
      "thinking",
    ]);

    releases.get(760)?.();
    await waitUntil(
      () => session.getState().members[1]?.status === "ready",
      "second opening did not become ready",
    );
    expect(session.getState().members.map(({ status }) => status)).toEqual([
      "ready",
      "ready",
      "thinking",
    ]);

    releases.get(1100)?.();
    expect((await starting).ok).toBe(true);
    expect(session.getState().members.every(({ status }) => status === "ready")).toBe(true);

    let defaultWaitCalls = 0;
    const immediate = createMockRuntime({
      wait: async () => {
        defaultWaitCalls += 1;
      },
    });
    const immediateSession = await started(immediate);
    await immediateSession.pumpOnce();
    expect(defaultWaitCalls).toBe(0);
  });

  it("keeps the demo trio substantive and nonrepetitive across twelve turns", async () => {
    const session = createMeetingSession({ runtime: createMockRuntime(), autoContinue: false });
    selectDemo(session);
    session.setBriefing(EXAMPLE_DECISION);
    await session.startMeeting();

    await session.pumpDiscussion(12);

    const messages = session
      .getState()
      .transcript.filter((event) => event.kind === "message" && event.speakerId !== "chair");
    expect(messages).toHaveLength(12);
    expect(new Set(messages.map(({ text }) => text)).size).toBe(12);
    expect(messages.map(({ text }) => text).join(" ")).toMatch(/cohort|trial activation/i);
    expect(messages.map(({ text }) => text).join(" ")).toMatch(/sequence the message|test sentence/i);
  });

  it("resumes paced automatic discussion after composing and never exceeds twelve turns", async () => {
    const pendingGaps: Array<() => void> = [];
    const observedDelays: number[] = [];
    const session = createMeetingSession({
      runtime: derivedRuntime(),
      autoContinue: true,
      autoTurnGapMs: 700,
      wait: (milliseconds) => {
        observedDelays.push(milliseconds);
        return new Promise<void>((resolve) => pendingGaps.push(resolve));
      },
    });
    selectDemo(session);
    await session.startMeeting();
    const messageCount = () =>
      session.getState().transcript.filter((event) => event.kind === "message").length;
    await waitUntil(
      () => messageCount() === 1 && pendingGaps.length === 1,
      "automatic discussion did not reach its first turn gap",
    );

    session.setComposing(true);
    pendingGaps.shift()?.();
    for (let flush = 0; flush < 5; flush += 1) await Promise.resolve();
    expect(messageCount()).toBe(1);

    session.setComposing(false);
    while (messageCount() < 12) {
      const before = messageCount();
      await waitUntil(() => pendingGaps.length > 0, "automatic discussion did not resume");
      pendingGaps.shift()?.();
      await waitUntil(() => messageCount() > before, "automatic turn did not complete");
    }

    session.setComposing(true);
    session.setComposing(false);
    for (let flush = 0; flush < 10; flush += 1) await Promise.resolve();
    expect(messageCount()).toBe(12);
    expect(pendingGaps).toHaveLength(0);
    expect(observedDelays.every((delay) => delay === 700)).toBe(true);
  });

  it("forms private opening positions in parallel", async () => {
    const base = derivedRuntime();
    let active = 0;
    let maxActive = 0;
    const runtime = derivedRuntime({
      async formOpeningPosition(input) {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await Promise.resolve();
        active -= 1;
        return base.formOpeningPosition(input);
      },
    });

    const session = await started(runtime);
    expect(maxActive).toBe(3);
    expect(Object.keys(session.getState().positions)).toHaveLength(3);
  });

  it("does not restart an active meeting when start is requested twice", async () => {
    const session = createMeetingSession({ runtime: derivedRuntime(), autoContinue: false });
    selectDemo(session);

    const [first, second] = await Promise.all([session.startMeeting(), session.startMeeting()]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    expect(session.getState().transcript.filter((event) => /views are forming/i.test(event.text))).toHaveLength(1);
  });

  it("serializes public turns and preserves call order", async () => {
    const base = derivedRuntime();
    let active = 0;
    let maxActive = 0;
    const releases: Array<() => void> = [];
    const runtime = derivedRuntime({
      async publicTurn(input) {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise<void>((resolve) => releases.push(resolve));
        active -= 1;
        return base.publicTurn(input);
      },
    });
    const session = await started(runtime, { joinDelayMs: 0 });
    expect(session.join("Codex").ok).toBe(true);

    const actions = Promise.all([
      session.pumpOnce(),
      session.sendUserMessage("@Lulu What should we say?"),
      session.contribute("One additional piece of context."),
      session.address("Daniel Ek", "Does the context change your view?"),
    ]);
    for (let turn = 0; turn < 3; turn += 1) {
      while (!releases.length) await Promise.resolve();
      releases.shift()?.();
      await Promise.resolve();
    }
    await actions;

    expect(maxActive).toBe(1);
    const messages = session.getState().transcript.filter((event) => event.kind === "message");
    expect(messages.map((event) => event.speakerId)).toEqual([
      "daniel-ek",
      "chair",
      "lulu-cheng-meservey",
      "guest",
      "guest",
      "daniel-ek",
    ]);
    expect(messages.map((event) => event.id)).toEqual([
      "evt-4",
      "evt-5",
      "evt-6",
      "evt-7",
      "evt-8",
      "evt-9",
    ]);
  });

  it("places a contribution immediately after the board turn already streaming", async () => {
    let releaseTurn!: () => void;
    const runtime = derivedRuntime({
      publicTurn(input, options) {
        options?.onStream?.({ type: "reset" });
        options?.onStream?.({ type: "append", delta: "Streaming board turn" });
        return new Promise((resolve) => {
          releaseTurn = () => resolve({ text: `${input.memberName} committed board turn.` });
        });
      },
    });
    const session = await started(runtime, { joinDelayMs: 0 });
    expect(session.join("Codex").ok).toBe(true);
    await waitUntil(() => session.getState().guest.status === "joined", "guest did not join");

    const boardTurn = session.pumpOnce();
    await waitUntil(
      () => session.getState().inProgressPublicMessage?.text === "Streaming board turn",
      "board turn did not start streaming",
    );
    const contribution = session.contribute("Queued behind the streamed turn.");
    await Promise.resolve();
    expect(
      session.getState().transcript.some((event) => event.speakerId === "guest"),
    ).toBe(false);

    releaseTurn();
    expect(await boardTurn).toBe(true);
    expect(await contribution).toMatchObject({ ok: true });
    expect(
      session
        .getState()
        .transcript.filter((event) => event.kind === "message")
        .map(({ speakerId, text }) => [speakerId, text]),
    ).toEqual([
      ["daniel-ek", "Daniel Ek committed board turn."],
      ["guest", "Queued behind the streamed turn."],
    ]);
  });

  it("keeps streamed text ephemeral, clears failed attempts, and atomically commits the final turn", async () => {
    let attempts = 0;
    const runtime = derivedRuntime({
      async publicTurn(_input, options) {
        attempts += 1;
        options?.onStream?.({ type: "reset" });
        options?.onStream?.({
          type: "append",
          delta: attempts === 1 ? "Abandoned partial" : "Validated final turn.",
        });
        if (attempts === 1) throw new Error("retry the child turn");
        return { text: "Validated final turn." };
      },
    });
    const session = await started(runtime);
    const drafts: Array<string | null> = [];
    const unsubscribe = session.subscribe(() => {
      drafts.push(session.getState().inProgressPublicMessage?.text ?? null);
    });

    await session.pumpOnce();
    unsubscribe();

    expect(drafts).toContain("Abandoned partial");
    expect(drafts).toContain("Validated final turn.");
    expect(session.getState().inProgressPublicMessage).toBeNull();
    const committed = session
      .getState()
      .transcript.filter((event) => event.kind === "message" && event.speakerId === "daniel-ek");
    expect(committed.map((event) => event.text)).toEqual(["Validated final turn."]);
  });

  it("cancels and clears an in-progress public message when the meeting resets", async () => {
    let runtimeSignal: AbortSignal | undefined;
    const runtime = derivedRuntime({
      publicTurn(_input, options) {
        runtimeSignal = options?.signal;
        options?.onStream?.({ type: "reset" });
        options?.onStream?.({ type: "append", delta: "Never commit this" });
        return new Promise<never>((_resolve, reject) => {
          runtimeSignal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        });
      },
    });
    const session = await started(runtime);
    const pending = session.pumpOnce();
    await waitUntil(
      () => session.getState().inProgressPublicMessage?.text === "Never commit this",
      "the streamed draft did not appear",
    );

    session.reset();

    await expect(pending).resolves.toBe(false);
    expect(runtimeSignal?.aborted).toBe(true);
    expect(session.getState().inProgressPublicMessage).toBeNull();
    expect(session.getState().transcript).toEqual([]);
  });

  it("derives direct-answer recipients from the latest chair or guest message", async () => {
    const runtime = derivedRuntime({
      async publicTurn() {
        return { text: "Direct answer.", addressedTo: "Untrusted child metadata" };
      },
    });
    const chairSession = await started(runtime);
    await chairSession.sendUserMessage("@Daniel Ek Does this change your view?");
    expect(chairSession.getState().transcript.at(-1)).toMatchObject({
      speakerId: "daniel-ek",
      addressedTo: "You",
    });

    const guestSession = await started(runtime, { joinDelayMs: 0 });
    expect(guestSession.join("Codex").ok).toBe(true);
    await waitUntil(
      () => guestSession.getState().guest.status === "joined",
      "guest did not finish joining",
    );
    await guestSession.address("Daniel Ek", "Does this change your view?");
    expect(guestSession.getState().transcript.at(-1)).toMatchObject({
      speakerId: "daniel-ek",
      addressedTo: "Codex",
    });
  });

  it("returns a failed exact direct answer instead of an earlier member response", async () => {
    const runtime = derivedRuntime({
      async publicTurn(input) {
        if (input.capability === "answerDirect") throw new Error("direct answer unavailable");
        return { text: "Earlier public response." };
      },
    });
    const session = await started(runtime, { joinDelayMs: 0 });
    await session.pumpOnce();
    session.join("Codex");
    await waitUntil(() => session.getState().guest.status === "joined", "guest did not join");

    const result = await session.address("Daniel Ek", "Does this change your view?");

    expect(result).toMatchObject({ ok: false, response: null });
    expect(result.message).toMatch(/could not answer after two attempts/i);
    expect(result.response?.text).not.toBe("Earlier public response.");
  });

  it("retries openings and turns once, then records faithful nonfatal fallbacks", async () => {
    const base = derivedRuntime();
    let openingAttempts = 0;
    let turnAttempts = 0;
    const runtime = derivedRuntime({
      async formOpeningPosition(input) {
        if (input.memberId === "daniel-ek") {
          openingAttempts += 1;
          throw new Error("opening unavailable");
        }
        return base.formOpeningPosition(input);
      },
      async publicTurn(input) {
        if (input.memberId === "daniel-ek") {
          turnAttempts += 1;
          throw new Error("turn unavailable");
        }
        return base.publicTurn(input);
      },
    });
    const session = await started(runtime);

    expect(openingAttempts).toBe(2);
    expect(session.getState().positions["daniel-ek"]?.reasoning).toContain(
      "Customer evidence is mixed",
    );
    expect(await session.pumpOnce()).toBe(true);
    expect(turnAttempts).toBe(2);
    expect(session.getState().lastError).toContain("turn unavailable");
    expect(session.getState().transcript.at(-1)?.text).toMatch(/meeting will continue/i);
    expect(
      session
        .getState()
        .transcript.some(
          (event) =>
            event.kind === "message" &&
            event.speakerId === "daniel-ek" &&
            event.text.includes("Recovered from the private opening"),
        ),
    ).toBe(true);
    expect(
      session.getState().members.find((member) => member.slug === "daniel-ek")?.spokenCount,
    ).toBe(1);
    expect(await session.pumpOnce()).toBe(true);
  });

  it("preserves the every-member-spoke invariant when a final drained turn fails", async () => {
    const runtime = derivedRuntime({
      async publicTurn(input) {
        if (input.memberId === "lulu-cheng-meservey") throw new Error("turn unavailable");
        return { text: `${input.memberName} spoke before closing.` };
      },
    });
    const session = await started(runtime);

    expect((await session.endMeeting()).ok).toBe(true);
    const memberMessages = session
      .getState()
      .transcript.filter((event) => event.kind === "message" && event.speakerId !== "chair");
    expect(new Set(memberMessages.map((event) => event.speakerId))).toEqual(
      new Set(["daniel-ek", "david-heinemeier-hansson", "lulu-cheng-meservey"]),
    );
    expect(
      memberMessages.find((event) => event.speakerId === "lulu-cheng-meservey")?.text,
    ).toContain("Recovered from the private opening");
  });

  it("caps public-turn recovery statements at 90 words", async () => {
    const longField = Array.from({ length: 80 }, (_, index) => `detail-${index}`).join(" ");
    const runtime = derivedRuntime({
      async formOpeningPosition(input) {
        return {
          memberId: input.memberId,
          recommendation: longField,
          reasoning: longField,
          concern: "Concern.",
          question: "Question?",
        };
      },
      async publicTurn(input) {
        if (input.memberId === "daniel-ek") throw new Error("turn unavailable");
        return { text: `${input.memberName} spoke.` };
      },
    });
    const session = await started(runtime);

    await session.pumpOnce();

    const recovery = session
      .getState()
      .transcript.find(
        (event) => event.speakerId === "daniel-ek" && event.text.startsWith("Recovered"),
      );
    expect(recovery).toBeDefined();
    expect(recovery!.text.trim().split(/\s+/)).toHaveLength(90);
  });

  it("bounds hung public turns and interim synthesis", async () => {
    let publicAttempts = 0;
    let synthesisAttempts = 0;
    const runtime = derivedRuntime({
      publicTurn() {
        publicAttempts += 1;
        return new Promise<never>(() => undefined);
      },
      synthesis() {
        synthesisAttempts += 1;
        return new Promise<never>(() => undefined);
      },
    });
    const session = await started(runtime, {
      joinDelayMs: 0,
      runtimeDeadlineMs: 1,
    });

    await expect(session.pumpOnce()).resolves.toBe(true);
    session.join("Codex");
    await waitUntil(() => session.getState().guest.status === "joined", "guest did not join");
    await expect(session.requestSynthesis()).resolves.toMatchObject({ ok: false });

    expect(publicAttempts).toBe(2);
    expect(synthesisAttempts).toBe(2);
  }, 2_000);

  it("drains every unspoken seat before collecting parallel closing comments", async () => {
    let activeTurns = 0;
    let maxTurns = 0;
    let activeClosings = 0;
    let maxClosings = 0;
    const runtime = derivedRuntime({
      async publicTurn(input) {
        activeTurns += 1;
        maxTurns = Math.max(maxTurns, activeTurns);
        await Promise.resolve();
        activeTurns -= 1;
        return { text: `${input.memberName} spoke before closing.` };
      },
      async closingComment(input) {
        activeClosings += 1;
        maxClosings = Math.max(maxClosings, activeClosings);
        await Promise.resolve();
        activeClosings -= 1;
        return `${input.memberName} closing.`;
      },
    });
    const session = await started(runtime);

    expect((await session.endMeeting()).ok).toBe(true);
    const speakers = session
      .getState()
      .transcript.filter((event) => event.kind === "message")
      .map((event) => event.speakerId);
    expect(new Set(speakers)).toEqual(
      new Set(["daniel-ek", "david-heinemeier-hansson", "lulu-cheng-meservey"]),
    );
    expect(maxTurns).toBe(1);
    expect(maxClosings).toBe(3);
  });

  it("bounds hung parallel closings and final readout", async () => {
    let closingAttempts = 0;
    let readoutAttempts = 0;
    const runtime = derivedRuntime({
      closingComment() {
        closingAttempts += 1;
        return new Promise<never>(() => undefined);
      },
      readout() {
        readoutAttempts += 1;
        return new Promise<never>(() => undefined);
      },
    });
    const session = await started(runtime, { runtimeDeadlineMs: 1 });

    const result = await session.endMeeting();

    expect(result.ok).toBe(true);
    expect(closingAttempts).toBe(6);
    expect(readoutAttempts).toBe(2);
    expect(session.getState()).toMatchObject({ phase: "readout", meetingPhase: "closed" });
  }, 2_000);

  it("uses the latest substantive public statement when closing generation fails", async () => {
    const captured: Array<{ memberId: string; comment: string }> = [];
    const runtime = derivedRuntime({
      async publicTurn(input) {
        return { text: `${input.memberName} latest public position.` };
      },
      async closingComment() {
        throw new Error("closing unavailable");
      },
      async readout(input) {
        captured.push(...input.closingComments);
        return createMockRuntime().readout(input);
      },
    });
    const session = await started(runtime);
    await session.pumpDiscussion(4);

    await session.endMeeting();

    expect(captured.find(({ memberId }) => memberId === "daniel-ek")?.comment).toBe(
      "Daniel Ek latest public position.",
    );
  });

  it("retries readout once then builds a briefing- and transcript-faithful fallback", async () => {
    let attempts = 0;
    const runtime = derivedRuntime({
      async closingComment(input) {
        return input.memberId === "david-heinemeier-hansson"
          ? "I disagree with the other closing position."
          : `${input.memberName} closes from the supplied briefing.`;
      },
      async readout() {
        attempts += 1;
        throw new Error("synthesis offline");
      },
    });
    const session = await started(runtime);

    expect((await session.endMeeting()).ok).toBe(true);
    expect(attempts).toBe(2);
    const readout = session.getState().readout;
    expect(readout?.decision).toBe("Should we change course?");
    expect(readout?.divided).toBe(true);
    expect(readout?.closingComments).toHaveLength(3);
    expect(JSON.stringify(readout)).toContain("Customer evidence is mixed");
    expect(JSON.stringify(readout)).not.toMatch(/6,000|1\.6M|2\.3%/);
  });

  it("preserves conflicting closings and bounded guest evidence in fallback readouts", async () => {
    const guestStatement = `${"guest-evidence ".repeat(80)}tail-sentinel`;
    const runtime = derivedRuntime({
      async closingComment(input) {
        return `${input.memberName} chooses option ${input.memberId}.`;
      },
      async readout() {
        throw new Error("synthesis offline");
      },
    });
    const session = await started(runtime, { joinDelayMs: 0 });
    session.join("Witness");
    await waitUntil(() => session.getState().guest.status === "joined", "guest did not join");
    await session.contribute(guestStatement);
    await session.address("Daniel Ek", "question-only-sentinel");

    await session.endMeeting();

    const readout = session.getState().readout;
    expect(readout?.divided).toBe(true);
    expect(readout?.recommendation).toMatch(/did not reach a single recommendation/i);
    expect(readout?.options).toHaveLength(3);
    expect(readout?.assumptions.join(" ")).toContain("guest-evidence");
    expect(readout?.assumptions.join(" ")).not.toContain("tail-sentinel");
    expect(readout?.assumptions.join(" ")).not.toContain("question-only-sentinel");
  });

  it("retries interim synthesis once and leaves a clear nonfatal result", async () => {
    let attempts = 0;
    const runtime = derivedRuntime({
      async synthesis() {
        attempts += 1;
        throw new Error("summary offline");
      },
    });
    const session = await started(runtime, { joinDelayMs: 0 });
    session.join("Codex");

    const result = await session.requestSynthesis();
    expect(result.ok).toBe(false);
    expect(attempts).toBe(2);
    expect(result.message).toMatch(/meeting can continue/i);
    expect(session.getState().transcript.at(-1)?.kind).toBe("system");
  });

  it("makes joining observable, reserves exactly one guest, and orders guest tools after admission", async () => {
    let releaseJoin!: () => void;
    const wait = () => new Promise<void>((resolve) => (releaseJoin = resolve));
    const session = createMeetingSession({ runtime: derivedRuntime(), wait, joinDelayMs: 800 });
    selectDemo(session);
    await session.startMeeting();

    expect(session.join("Codex").ok).toBe(true);
    expect(session.getState().guest.status).toBe("joining");
    expect(session.join("Another agent").ok).toBe(false);
    let settled = false;
    const pendingContribution = session.contribute("Queued until admitted").then((result) => {
      settled = true;
      return result;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    releaseJoin();
    expect((await pendingContribution).ok).toBe(true);
    expect(session.getState().guest.status).toBe("joined");
    await session.endMeeting();
    expect((await session.requestSynthesis()).ok).toBe(false);
  });

  it("queues immediate guest actions until both opening and admission complete", async () => {
    let releaseOpening!: () => void;
    let releaseJoin!: () => void;
    const openingGate = new Promise<void>((resolve) => (releaseOpening = resolve));
    const base = derivedRuntime();
    const runtime = derivedRuntime({
      async formOpeningPosition(input) {
        await openingGate;
        return base.formOpeningPosition(input);
      },
      async publicTurn(input) {
        return { text: `${input.memberName} answered the queued question.` };
      },
      async synthesis() {
        return "Queued synthesis after admission.";
      },
    });
    const session = createMeetingSession({
      runtime,
      autoContinue: false,
      joinDelayMs: 800,
      wait: () => new Promise<void>((resolve) => (releaseJoin = resolve)),
    });
    selectDemo(session);
    const starting = session.startMeeting();
    await waitUntil(
      () => session.getState().meetingPhase === "opening",
      "meeting did not enter opening",
    );

    expect(session.join("Codex")).toMatchObject({ ok: true });
    expect(session.getState().guest).toEqual({ name: "Codex", status: "joining" });
    const contribution = session.contribute("Evidence queued during opening.");
    const answer = session.address("Daniel Ek", "What follows from that evidence?");
    const synthesis = session.requestSynthesis();
    let actionsSettled = false;
    void Promise.all([contribution, answer, synthesis]).then(() => {
      actionsSettled = true;
    });
    await Promise.resolve();
    expect(actionsSettled).toBe(false);

    releaseOpening();
    expect((await starting).ok).toBe(true);
    expect(session.getState().meetingPhase).toBe("discussion");
    expect(session.getState().guest.status).toBe("joining");
    releaseJoin();

    expect(await contribution).toMatchObject({ ok: true });
    expect(await answer).toMatchObject({ ok: true });
    expect(await synthesis).toMatchObject({ ok: true });
    expect(
      session
        .getState()
        .transcript.filter((event) => event.kind === "message")
        .map(({ speakerId, text }) => [speakerId, text]),
    ).toEqual([
      ["guest", "Evidence queued during opening."],
      ["guest", "@Daniel Ek What follows from that evidence?"],
      ["daniel-ek", "Daniel Ek answered the queued question."],
    ]);
    expect(session.getState().transcript.at(-1)).toMatchObject({
      speakerId: "secretary",
      text: "Queued synthesis after admission.",
    });
  });

  it("keeps guest activity statuses visible through the work they initiate", async () => {
    let holdTurn = false;
    const pendingTurns: Array<() => void> = [];
    const runtime = derivedRuntime({
      publicTurn(input) {
        if (!holdTurn) return Promise.resolve({ text: `${input.memberName} automatic turn.` });
        return new Promise((resolve) => {
          pendingTurns.push(() => resolve({ text: `${input.memberName} completed held work.` }));
        });
      },
    });
    const session = createMeetingSession({
      runtime,
      autoContinue: true,
      joinDelayMs: 0,
    });
    selectDemo(session);
    await session.startMeeting();
    await waitUntil(
      () =>
        session
          .getState()
          .transcript.filter((event) => event.kind === "message" && event.speakerId !== "guest")
          .length === 12,
      "automatic discussion did not reach its turn cap",
    );
    expect(session.join("Codex").ok).toBe(true);
    await waitUntil(() => session.getState().guest.status === "joined", "guest did not join");

    holdTurn = true;
    const contribution = session.contribute("Keep this status visible.");
    await waitUntil(
      () => session.getState().guest.status === "contributing" && pendingTurns.length === 1,
      "contributing status did not persist through response work",
    );
    pendingTurns.shift()?.();
    expect(await contribution).toMatchObject({ ok: true });
    expect(session.getState().guest.status).toBe("joined");

    const answer = session.address("Daniel Ek", "Hold while answering?");
    await waitUntil(
      () => session.getState().guest.status === "asking" && pendingTurns.length === 1,
      "asking status did not persist through the direct answer",
    );
    pendingTurns.shift()?.();
    expect(await answer).toMatchObject({ ok: true });
    expect(session.getState().guest.status).toBe("joined");
  });

  it("invalidates a pending admission and its ordered guest action on reset", async () => {
    let releaseOpening!: () => void;
    let releaseJoin!: () => void;
    const openingGate = new Promise<void>((resolve) => (releaseOpening = resolve));
    const base = derivedRuntime();
    const session = createMeetingSession({
      runtime: derivedRuntime({
        async formOpeningPosition(input) {
          await openingGate;
          return base.formOpeningPosition(input);
        },
      }),
      autoContinue: false,
      joinDelayMs: 800,
      wait: () => new Promise<void>((resolve) => (releaseJoin = resolve)),
    });
    selectDemo(session);
    const starting = session.startMeeting();
    await waitUntil(() => session.getState().meetingPhase === "opening", "opening did not start");
    expect(session.join("Codex").ok).toBe(true);
    const contribution = session.contribute("This must not survive reset.");

    session.reset();
    releaseOpening();
    releaseJoin();

    expect((await starting).ok).toBe(false);
    expect((await contribution).ok).toBe(false);
    expect(session.getState()).toMatchObject({
      phase: "select",
      meetingPhase: "idle",
      guest: { name: null, status: "empty" },
      transcript: [],
    });
  });

  it("invalidates queued work and late opening completions on reset", async () => {
    let releaseOpening!: () => void;
    const openingGate = new Promise<void>((resolve) => (releaseOpening = resolve));
    const base = derivedRuntime();
    const runtime = derivedRuntime({
      async formOpeningPosition(input: RuntimeTurnInput) {
        await openingGate;
        return base.formOpeningPosition(input);
      },
    });
    const session = createMeetingSession({ runtime, autoContinue: false });
    selectDemo(session);
    const starting = session.startMeeting();
    const queuedMessage = session.sendUserMessage("This must not survive reset.");
    await Promise.resolve();

    session.reset();
    releaseOpening();
    expect((await starting).ok).toBe(false);
    expect((await queuedMessage).ok).toBe(false);
    expect(session.getState()).toMatchObject({
      phase: "select",
      meetingPhase: "idle",
      selected: [],
      members: [],
      transcript: [],
      positions: {},
      readout: null,
    });
  });
});
