"use client";

import { useEffect, useRef, useState } from "react";
import { isAbortError, registerBoardTools } from "@/lib/webmcp";
import type { BoardToolReceipt } from "@/lib/webmcp";
import type { MeetingSession } from "@/lib/session";

export const WEBMCP_RECEIPT_DISMISS_MS = 4_000;

type ReceiptTimerHandle = ReturnType<typeof setTimeout>;
type ReceiptTimer = {
  schedule: (callback: () => void, delayMs: number) => ReceiptTimerHandle;
  cancel: (handle: ReceiptTimerHandle) => void;
};
type ReceiptDismissOptions = {
  timer?: ReceiptTimer;
  signal?: AbortSignal;
};
type VisibleReceipt = { sequence: number; receipt: BoardToolReceipt };
type MeetingPhase = ReturnType<MeetingSession["getState"]>["phase"];

const receiptTimer: ReceiptTimer = {
  schedule: (callback, delayMs) => setTimeout(callback, delayMs),
  cancel: (handle) => clearTimeout(handle),
};

export function scheduleWebMcpReceiptDismiss(
  sequence: number,
  onDismiss: (sequence: number) => void,
  options: ReceiptDismissOptions = {},
) {
  if (options.signal?.aborted) return () => undefined;
  const timer = options.timer ?? receiptTimer;
  let active = true;
  const handle = timer.schedule(() => {
    if (!active) return;
    active = false;
    options.signal?.removeEventListener("abort", cancel);
    onDismiss(sequence);
  }, WEBMCP_RECEIPT_DISMISS_MS);
  function cancel() {
    if (!active) return;
    active = false;
    timer.cancel(handle);
    options.signal?.removeEventListener("abort", cancel);
  }
  options.signal?.addEventListener("abort", cancel, { once: true });
  return cancel;
}

export function dismissWebMcpReceipt(
  current: VisibleReceipt | null,
  sequence: number,
): VisibleReceipt | null {
  return current?.sequence === sequence ? null : current;
}

export function shouldClearWebMcpReceipt(previous: MeetingPhase, current: MeetingPhase) {
  return current === "select" && previous !== "select";
}

export function WebMcpReceiptView({ receipt }: { receipt: BoardToolReceipt }) {
  return (
    <output
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 left-1/2 z-50 max-w-[min(90vw,44rem)] -translate-x-1/2 border border-[var(--rule)] bg-[var(--paper)] px-4 py-2 text-center text-sm text-[var(--paper-ink)] shadow-lg"
    >
      Site tool {receipt.toolName} {receipt.outcome}: {receipt.message}
    </output>
  );
}

export function WebMcpBridge({ session }: { session: MeetingSession }) {
  const [visibleReceipt, setVisibleReceipt] = useState<VisibleReceipt | null>(null);
  const previousPhase = useRef<MeetingPhase>(session.getState().phase);
  const registrationController = useRef<AbortController | null>(null);

  useEffect(() => {
    previousPhase.current = session.getState().phase;
    return session.subscribe(() => {
      const currentPhase = session.getState().phase;
      if (shouldClearWebMcpReceipt(previousPhase.current, currentPhase)) {
        setVisibleReceipt(null);
      }
      previousPhase.current = currentPhase;
    });
  }, [session]);

  useEffect(() => {
    const controller = new AbortController();
    registrationController.current = controller;
    void registerBoardTools(session, {
      signal: controller.signal,
      onReceipt(receipt) {
        if (controller.signal.aborted) return;
        setVisibleReceipt((current) => ({
          sequence: (current?.sequence ?? 0) + 1,
          receipt,
        }));
      },
    }).catch((error: unknown) => {
      controller.abort();
      if (!isAbortError(error)) console.error("Could not register board site tools.", error);
    });
    return () => {
      controller.abort();
      if (registrationController.current === controller) registrationController.current = null;
    };
  }, [session]);

  useEffect(() => {
    if (!visibleReceipt) return;
    return scheduleWebMcpReceiptDismiss(
      visibleReceipt.sequence,
      (sequence) => {
        setVisibleReceipt((current) => dismissWebMcpReceipt(current, sequence));
      },
      { signal: registrationController.current?.signal },
    );
  }, [visibleReceipt]);

  return visibleReceipt ? (
    <WebMcpReceiptView key={visibleReceipt.sequence} receipt={visibleReceipt.receipt} />
  ) : null;
}
