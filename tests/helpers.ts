import { createMeetingSession, type SessionOptions } from "../lib/session";
import { createMockRuntime } from "../lib/runtime/mock";
import type { BoardRuntime } from "../lib/types";

export const DEMO_TRIO = [
  "daniel-ek",
  "david-heinemeier-hansson",
  "lulu-cheng-meservey",
] as const;

export function newSession(options: SessionOptions = {}) {
  return createMeetingSession({ runtime: createMockRuntime(), autoContinue: false, ...options });
}

export function seatDemoBoard(session: ReturnType<typeof newSession>) {
  for (const slug of DEMO_TRIO) session.toggleMember(slug);
  session.goToBrief();
  session.useExampleDecision();
}

/** A runtime that fails the first `failures` calls of each capability, then behaves. */
export function flakyRuntime(failures: number): BoardRuntime {
  const mock = createMockRuntime();
  const seen = new Map<string, number>();
  const shouldFail = (key: string) => {
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    return count < failures;
  };
  return {
    id: "mock",
    formOpeningPosition(input) {
      if (shouldFail(`open:${input.memberId}`)) throw new Error("opening position failed");
      return mock.formOpeningPosition(input);
    },
    publicTurn(input, onDelta) {
      if (shouldFail(`turn:${input.memberId}`)) throw new Error("turn failed");
      return mock.publicTurn(input, onDelta);
    },
    closingComment(input) {
      if (shouldFail(`close:${input.memberId}`)) throw new Error("closing comment failed");
      return mock.closingComment(input);
    },
    synthesis(input) {
      if (shouldFail("synthesis")) throw new Error("synthesis failed");
      return mock.synthesis(input);
    },
    readout(input) {
      if (shouldFail("readout")) throw new Error("readout failed");
      return mock.readout(input);
    },
  };
}

/** A runtime whose every call fails, for the degraded paths. */
export function brokenRuntime(): BoardRuntime {
  const fail = () => {
    throw new Error("the model is unreachable");
  };
  return {
    id: "mock",
    formOpeningPosition: fail,
    publicTurn: fail,
    closingComment: fail,
    synthesis: fail,
    readout: fail,
  } as unknown as BoardRuntime;
}
