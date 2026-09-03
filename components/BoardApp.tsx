"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createMeetingSession, type MeetingSession, type MeetingState } from "@/lib/session";
import { createMockRuntime } from "@/lib/runtime/mock";
import { createBrowserRuntime } from "@/lib/runtime/browser";
import { SelectBoard } from "./SelectBoard";
import { BriefBoard } from "./BriefBoard";
import { BoardMeeting } from "./BoardMeeting";
import { Readout } from "./Readout";
import { WebMcpBridge } from "./WebMcp";

export function BoardApp() {
  const sessionRef = useRef<MeetingSession | null>(null);
  const [state, setState] = useState<MeetingState | null>(null);
  const [setup, setSetup] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};
    async function boot() {
      let live = false;
      let message: string | null = null;
      try {
        const res = await fetch("/api/runtime-status");
        const data = (await res.json()) as { live: boolean; message: string };
        live = data.live;
        message = data.message;
      } catch {
        message =
          "OPENAI_API_KEY is not set. The board is running a deterministic mock so you can test the room, orchestration, and WebMCP.";
      }
      if (cancelled) return;
      setSetup(message);
      const runtime = live ? createBrowserRuntime() : createMockRuntime();
      const session = createMeetingSession({ runtime, autoContinue: true });
      sessionRef.current = session;
      unsub = session.subscribe(() => setState(session.getState()));
      setState(session.getState());
    }
    void boot();
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const session = sessionRef.current;
  const view = useMemo(() => state, [state]);

  if (!session || !view) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="text-[var(--muted)] tracking-[0.22em] uppercase text-xs">The table is being set</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {setup && view.runtimeId === "mock" ? (
        <div className="px-6 py-2 text-center text-xs text-[var(--brass)] border-b border-[oklch(50%_0.04_70_/_0.25)]">
          {setup}
        </div>
      ) : null}
      {view.phase === "select" ? <SelectBoard session={session} state={view} /> : null}
      {view.phase === "brief" ? <BriefBoard session={session} state={view} /> : null}
      {view.phase === "meeting" ? <BoardMeeting session={session} state={view} /> : null}
      {view.phase === "readout" ? <Readout session={session} state={view} /> : null}
      <WebMcpBridge session={session} />
    </div>
  );
}
