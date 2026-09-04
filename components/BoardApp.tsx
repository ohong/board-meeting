"use client";

import { useEffect, useRef, useState } from "react";
import { createMeetingSession, type MeetingSession, type MeetingState } from "@/lib/session";
import {
  createMockRuntime,
  demoOpeningDelayMs,
  MOCK_DEMO_TIMING,
} from "@/lib/runtime/mock";
import { createBrowserRuntime } from "@/lib/runtime/browser";
import { SelectBoard } from "./SelectBoard";
import { BriefBoard } from "./BriefBoard";
import { BoardMeeting } from "./BoardMeeting";
import { Readout } from "./Readout";
import { WebMcpBridge } from "./WebMcp";

type RuntimeStatus = { live: boolean; message: string };

const RUNTIME_STATUS_FALLBACK_MS = 3_000;

type RuntimeStatusMonitorOptions = {
  request: () => Promise<RuntimeStatus>;
  waitForFallback?: () => Promise<void>;
  onFallback: () => void;
  onResponse: (status: RuntimeStatus) => void;
};

/**
 * Unblock demo mode after a bounded wait while preserving a late response so
 * pre-meeting setup can still migrate to the live runtime.
 */
export async function monitorRuntimeStatus({
  request,
  waitForFallback = () =>
    new Promise<void>((resolve) => window.setTimeout(resolve, RUNTIME_STATUS_FALLBACK_MS)),
  onFallback,
  onResponse,
}: RuntimeStatusMonitorOptions): Promise<void> {
  const response = request().then(
    (status) => ({ kind: "response", status }) as const,
    () => ({ kind: "failure" }) as const,
  );
  const first = await Promise.race([
    response,
    waitForFallback().then(() => ({ kind: "timeout" }) as const),
  ]);

  if (first.kind === "response") {
    onResponse(first.status);
    return;
  }
  if (first.kind === "failure") {
    onFallback();
    return;
  }

  onFallback();
  const eventual = await response;
  if (eventual.kind === "response") onResponse(eventual.status);
}

function bootSession(live: boolean) {
  if (live) {
    return createMeetingSession({
      runtime: createBrowserRuntime(),
      autoContinue: true,
      autoTurnGapMs: 800,
      runtimeDeadlineMs: 60_000,
    });
  }
  return createMeetingSession({
    runtime: createMockRuntime({
      openingDelayMs: demoOpeningDelayMs,
      publicTurnDelayMs: MOCK_DEMO_TIMING.publicTurnDelayMs,
      publicTurnChunkDelayMs: MOCK_DEMO_TIMING.publicTurnChunkDelayMs,
    }),
    autoContinue: true,
    autoTurnGapMs: MOCK_DEMO_TIMING.autoTurnGapMs,
  });
}

/**
 * Replace a not-yet-started session without losing the chair's setup work.
 * The source is reset before the replacement is created so any queued work is
 * invalidated before the new runtime can become active.
 */
export function migratePreMeetingSession(
  source: MeetingSession,
  createReplacement: () => MeetingSession,
): MeetingSession | null {
  const snapshot = source.getState();
  if (snapshot.phase !== "select" && snapshot.phase !== "brief") {
    return null;
  }

  source.reset();
  const replacement = createReplacement();
  replacement.setSearch(snapshot.search);
  for (const slug of snapshot.selected) {
    const result = replacement.toggleMember(slug);
    if (!result.ok) {
      throw new Error(result.message ?? `Could not restore adviser ${slug}.`);
    }
  }
  replacement.setBriefing(snapshot.briefing);
  if (snapshot.phase === "brief") {
    const result = replacement.goToBrief();
    if (!result.ok) {
      throw new Error(result.message ?? "Could not restore the briefing step.");
    }
  }

  return replacement;
}

export function BoardApp() {
  const [session, setSession] = useState<MeetingSession>(() => bootSession(false));
  const [state, setState] = useState<MeetingState>(() => session.getState());
  const activeSessionRef = useRef(session);
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [runtimeNote, setRuntimeNote] = useState("Checking meeting setup…");

  useEffect(() => {
    activeSessionRef.current = session;
    const unsub = session.subscribe(() => setState(session.getState()));
    return () => {
      unsub();
    };
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    void monitorRuntimeStatus({
      request: async () => {
        const res = await fetch("/api/runtime-status");
        if (!res.ok) throw new Error(`Runtime status failed with ${res.status}.`);
        return (await res.json()) as RuntimeStatus;
      },
      onFallback: () => {
        if (cancelled) return;
        setRuntimeReady(true);
        setRuntimeNote("Demo mode · runtime check unavailable");
      },
      onResponse: (data) => {
        if (cancelled) return;
        if (!data.live) {
          setRuntimeReady(true);
          setRuntimeNote("Demo mode · scripted responses");
          return;
        }

        const live = migratePreMeetingSession(activeSessionRef.current, () => bootSession(true));
        if (live) {
          activeSessionRef.current = live;
          setSession(live);
          setState(live.getState());
          setRuntimeNote("Live mode · responses enabled");
        }
        setRuntimeReady(true);
      },
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const view = state;

  return (
    <div
      className={`board-app min-h-screen flex flex-col ${view.phase === "meeting" ? "room-mode" : "paper-mode"}`}
    >
      {view.phase === "select" ? <SelectBoard session={session} state={view} /> : null}
      {view.phase === "brief" ? (
        <BriefBoard session={session} state={view} runtimeReady={runtimeReady} />
      ) : null}
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
