"use client";

import { useEffect, useState } from "react";
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
  const [initialSession] = useState<MeetingSession>(() => bootSession(false));
  const [session, setSession] = useState<MeetingSession>(() => initialSession);
  const [state, setState] = useState<MeetingState>(() => initialSession.getState());
  const [runtimeNote, setRuntimeNote] = useState("Demo mode · scripted responses");

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
        setRuntimeNote(data.live ? "Live mode · responses enabled" : "Demo mode · scripted responses");
        const current = initialSession.getState();
        if (data.live && current.phase === "select" && current.selected.length === 0) {
          const live = bootSession(true);
          setSession(live);
          setState(live.getState());
        }
      } catch {
        if (!cancelled) {
          setRuntimeNote("Demo mode · runtime check unavailable");
        }
      }
    }
    void maybeGoLive();
    return () => {
      cancelled = true;
    };
  }, [initialSession]);

  const view = state;

  return (
    <div
      className={`board-app min-h-screen flex flex-col ${view.phase === "meeting" ? "room-mode" : "paper-mode"}`}
    >
      {view.lastError ? (
        <p className="app-error" role="alert">
          {view.lastError}
        </p>
      ) : null}
      {view.phase === "select" ? <SelectBoard session={session} state={view} /> : null}
      {view.phase === "brief" ? <BriefBoard session={session} state={view} /> : null}
      {view.phase === "meeting" ? <BoardMeeting session={session} state={view} /> : null}
      {view.phase === "readout" ? <Readout session={session} state={view} /> : null}
      {view.phase === "select" || view.phase === "brief" ? (
        <div className="runtime-note" aria-label="Runtime status">
          <i aria-hidden="true" /> {runtimeNote}
        </div>
      ) : null}
      <WebMcpBridge key={view.runtimeId} session={session} />
    </div>
  );
}
