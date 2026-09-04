"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { MeetingSession } from "./session";
import type { MeetingState } from "./types";

const SessionContext = createContext<MeetingSession | null>(null);

/**
 * Provides one local MeetingSession projection for the life of the page. RoomSync
 * hydrates it from the shared room when the URL identifies an active meeting.
 */
export function MeetingProvider({ children, session }: { children: ReactNode; session?: MeetingSession }) {
  const value = useMemo(() => session ?? new MeetingSession(), [session]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): MeetingSession {
  const s = useContext(SessionContext);
  if (!s) throw new Error("useSession must be used inside <MeetingProvider>");
  return s;
}

/** Subscribe to the whole meeting state (re-renders on every change). */
export function useMeetingState(): MeetingState {
  const session = useSession();
  return useSyncExternalStore(session.subscribe, session.getState, session.getState);
}

/** Subscribe to a derived slice; `select` must return a referentially stable value when unchanged. */
export function useMeetingSelector<T>(select: (state: MeetingState) => T): T {
  const session = useSession();
  return useSyncExternalStore(
    session.subscribe,
    () => select(session.getState()),
    () => select(session.getState()),
  );
}
