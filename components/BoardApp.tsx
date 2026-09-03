"use client";

import { useEffect, useRef, useState } from "react";
import { createMeetingSession, type MeetingSession, type MeetingState } from "@/lib/session";
import { createMockRuntime } from "@/lib/runtime/mock";
import { createBrowserRuntime } from "@/lib/runtime/browser";
import { SelectBoard } from "./SelectBoard";
import { BriefBoard } from "./BriefBoard";
import { BoardMeeting } from "./BoardMeeting";
import { Readout } from "./Readout";
import { WebMcpBridge } from "./WebMcp";

function bootSession(live: boolean) {
  return createMeetingSession({
    runtime: live ? createBrowserRuntime() : createMockRuntime(),
    autoContinue: true,
  });
}

export function BoardApp() {
  const sessionRef = useRef<MeetingSession>(bootSession(false));
  const [session, setSession] = useState<MeetingSession>(sessionRef.current);
  const [state, setState] = useState<MeetingState>(() => sessionRef.current.getState());
  const [setup, setSetup] = useState<string | null>(sessionRef.current.getState().setupMessage);

  useEffect(() => {
    const unsub = session.subscribe(() => setState(session.getState()));
    return () => {
      unsub();
    };
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    async function maybeGoLive() {
      try {
        const res = await fetch("/api/runtime-status");
        const data = (await res.json()) as { live: boolean; message: string };
        if (cancelled) return;
        setSetup(data.message);
        const current = sessionRef.current.getState();
        if (data.live && current.phase === "select" && current.selected.length === 0) {
          const live = bootSession(true);
          sessionRef.current = live;
          setSession(live);
          setState(live.getState());
        }
      } catch {
        if (!cancelled) {
          setSetup(
            "OPENAI_API_KEY is not set. The board is running a deterministic mock so you can test the room, orchestration, and WebMCP.",
          );
        }
      }
    }
    void maybeGoLive();
    return () => {
      cancelled = true;
    };
  }, []);

  const view = state;

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
      <WebMcpBridge key={view.runtimeId} session={session} />
    </div>
  );
}
