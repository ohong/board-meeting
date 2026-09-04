import { describe, expect, it, vi } from "vitest";
import { monitorRuntimeStatus } from "../components/BoardApp";
import { shouldPauseForComposer } from "../components/BoardMeeting";
import { startMeetingControl } from "../components/BriefBoard";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("chair composer focus boundary", () => {
  it("keeps automatic discussion paused while an unsent draft moves within the composer", () => {
    expect(shouldPauseForComposer("A pending message", true)).toBe(true);
    expect(shouldPauseForComposer("A pending message", false)).toBe(false);
    expect(shouldPauseForComposer("   ", true)).toBe(false);
  });
});

describe("runtime readiness monitor", () => {
  it("keeps Start visibly gated until the runtime check settles", () => {
    expect(startMeetingControl(false, true)).toEqual({
      disabled: true,
      label: "Checking setup…",
    });
    expect(startMeetingControl(true, true)).toEqual({
      disabled: false,
      label: "Start board meeting",
    });
  });

  it("falls back after a bounded wait and still applies a late live response", async () => {
    const request = deferred<{ live: boolean; message: string }>();
    const fallback = deferred<void>();
    const onFallback = vi.fn();
    const onResponse = vi.fn();
    const monitoring = monitorRuntimeStatus({
      request: () => request.promise,
      waitForFallback: () => fallback.promise,
      onFallback,
      onResponse,
    });

    fallback.resolve();
    for (let flush = 0; flush < 3; flush += 1) await Promise.resolve();
    expect(onFallback).toHaveBeenCalledOnce();
    expect(onResponse).not.toHaveBeenCalled();

    request.resolve({ live: true, message: "Live runtime available." });
    await monitoring;
    expect(onResponse).toHaveBeenCalledWith({
      live: true,
      message: "Live runtime available.",
    });
  });

  it("uses a timely response without entering fallback mode", async () => {
    const fallback = deferred<void>();
    const onFallback = vi.fn();
    const onResponse = vi.fn();

    await monitorRuntimeStatus({
      request: async () => ({ live: false, message: "Demo runtime." }),
      waitForFallback: () => fallback.promise,
      onFallback,
      onResponse,
    });

    expect(onFallback).not.toHaveBeenCalled();
    expect(onResponse).toHaveBeenCalledWith({ live: false, message: "Demo runtime." });
  });

  it("falls back immediately when the status request fails", async () => {
    const onFallback = vi.fn();

    await monitorRuntimeStatus({
      request: async () => {
        throw new Error("unavailable");
      },
      waitForFallback: () => new Promise<void>(() => undefined),
      onFallback,
      onResponse: vi.fn(),
    });

    expect(onFallback).toHaveBeenCalledOnce();
  });
});
