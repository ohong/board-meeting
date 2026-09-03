"use client";

import { useCallback, useEffect, useState } from "react";
import { createMeetingSession, type MeetingSession, type MeetingState } from "@/lib/session";
import { createDeferredRuntime } from "@/lib/runtime/client";
import { SelectBoard } from "./SelectBoard";
import { BriefBoard } from "./BriefBoard";
import { BoardMeeting } from "./BoardMeeting";
import { Readout } from "./Readout";
import { WebMcpBridge } from "./WebMcp";

/**
 * One session per page load, and nothing outside it. There is no storage, no cookie and no
 * server session, so a refresh genuinely starts a new meeting.
 */
export function BoardApp() {
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [webmcpSupported, setWebmcpSupported] = useState<boolean | null>(null);

  const [session] = useState<MeetingSession>(() =>
    createMeetingSession({
      runtime: createDeferredRuntime((status) => setSetupMessage(status.message)),
      autoContinue: true,
      turnGapMs: 700,
    }),
  );

  const [state, setState] = useState<MeetingState>(() => session.getState());

  useEffect(() => session.subscribe(() => setState(session.getState())), [session]);

  const onSupportChange = useCallback((supported: boolean) => setWebmcpSupported(supported), []);

  return (
    <div className="min-h-screen flex flex-col">
      {setupMessage ? (
        <div className="px-6 py-2 text-center text-[11.5px] leading-relaxed text-[var(--brass)] border-b border-[var(--hairline)] bg-[oklch(18%_0.02_55)]">
          {setupMessage}
        </div>
      ) : null}

      {state.phase === "select" ? <SelectBoard session={session} state={state} /> : null}
      {state.phase === "brief" ? <BriefBoard session={session} state={state} /> : null}
      {state.phase === "meeting" ? (
        <BoardMeeting session={session} state={state} webmcpSupported={webmcpSupported} />
      ) : null}
      {state.phase === "readout" ? <Readout session={session} state={state} /> : null}

      <WebMcpBridge session={session} onSupportChange={onSupportChange} />
    </div>
  );
}
