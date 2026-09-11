"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createMeetingSession, type MeetingSession, type MeetingState } from "@/lib/session";
import { createDeferredRuntime, NO_KEY_MESSAGE } from "@/lib/runtime/client";
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
  const [live, setLive] = useState<boolean | null>(null);
  const [webmcpSupported, setWebmcpSupported] = useState<boolean | null>(null);

  const [session] = useState<MeetingSession>(() =>
    createMeetingSession({
      runtime: createDeferredRuntime((status) => setSetupMessage(status.message)),
      autoContinue: true,
      turnGapMs: 700,
      guestJoinMs: 450,
    }),
  );

  const [state, setState] = useState<MeetingState>(() => session.getState());

  useEffect(() => session.subscribe(() => setState(session.getState())), [session]);

  // The runtime itself resolves lazily, on the first agent call. Ask once up front too, so a
  // presenter without a key learns that before they start a meeting rather than after.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/runtime-status")
      .then((response) => response.json() as Promise<{ live: boolean }>)
      .then(({ live: isLive }) => {
        if (cancelled) return;
        setLive(isLive);
        if (!isLive) setSetupMessage(NO_KEY_MESSAGE);
      })
      .catch(() => {
        if (cancelled) return;
        setLive(false);
        setSetupMessage(NO_KEY_MESSAGE);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Each phase replaces the whole screen, which would otherwise drop keyboard focus back to
  // the top of the document with nothing said about it.
  const openingPhase = useRef(state.phase);
  useEffect(() => {
    if (state.phase === openingPhase.current) return;
    const region = document.querySelector("main");
    if (region instanceof HTMLElement) {
      region.tabIndex = -1;
      region.focus({ preventScroll: true });
    }
  }, [state.phase]);

  const onSupportChange = useCallback((supported: boolean) => setWebmcpSupported(supported), []);

  // The meeting owns the whole viewport and scrolls only its minutes. The paper states
  // scroll normally.
  const inRoom = state.phase === "meeting";

  return (
    <div className={inRoom ? "" : "min-h-screen"}>
      {setupMessage ? (
        <p className="border-b border-[var(--rule)] bg-[var(--soft-fill)] px-6 py-2 text-center text-[12.5px] leading-[1.45] text-[var(--ink-secondary)]">
          {setupMessage}
        </p>
      ) : null}

      {state.phase === "select" ? <SelectBoard session={session} state={state} /> : null}
      {state.phase === "brief" ? <BriefBoard session={session} state={state} live={live} /> : null}
      {state.phase === "meeting" ? (
        <BoardMeeting session={session} state={state} webmcpSupported={webmcpSupported} />
      ) : null}
      {state.phase === "readout" ? <Readout session={session} state={state} /> : null}

      <WebMcpBridge session={session} onSupportChange={onSupportChange} />
    </div>
  );
}
