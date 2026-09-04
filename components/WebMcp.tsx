"use client";

import { useEffect, useState } from "react";
import { isAbortError, registerBoardTools } from "@/lib/webmcp";
import type { MeetingSession, MeetingState } from "@/lib/session";

function latestReceipt(state: MeetingState) {
  return [...state.transcript].reverse().find((event) => event.speakerId === "webmcp");
}

export function WebMcpBridge({ session }: { session: MeetingSession }) {
  const [state, setState] = useState(() => session.getState());

  useEffect(() => {
    return session.subscribe(() => setState(session.getState()));
  }, [session]);

  useEffect(() => {
    const controller = new AbortController();
    void registerBoardTools(session, controller.signal).catch((error: unknown) => {
      controller.abort();
      if (!isAbortError(error)) console.error("Could not register board site tools.", error);
    });
    return () => {
      controller.abort();
    };
  }, [session]);

  const receipt = latestReceipt(state);
  if (!receipt) return null;

  return (
    <output
      key={receipt.id}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 left-1/2 z-50 max-w-[min(90vw,44rem)] -translate-x-1/2 border border-[var(--rule)] bg-[var(--paper)] px-4 py-2 text-center text-sm text-[var(--paper-ink)] shadow-lg"
    >
      {receipt.text}
    </output>
  );
}
