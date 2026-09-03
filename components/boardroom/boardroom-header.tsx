"use client";

import { useEffect, useMemo, useState } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";

const PHASE_LABEL: Record<string, string> = {
  forming: "Forming positions",
  discussion: "Discussion",
  closing: "Closing",
};

export function BoardroomHeader() {
  const session = useSession();
  const state = useMeetingState();
  // The boardroom only ever mounts client-side (a fresh session always starts in
  // "selecting"), so reading the clock at mount is hydration-safe.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const members = useMemo(() => Object.values(state.members), [state.members]);
  const seated = members.filter((m) => m.status !== "failed" && m.status !== "retrying").length;
  const elapsed = state.startedAt ? Math.max(0, Math.floor((now - state.startedAt) / 60_000)) : 0;
  const live = state.phase === "forming" || state.phase === "discussion";

  const status =
    state.phase === "forming"
      ? "forming positions"
      : `${seated} of ${members.length} seated`;

  return (
    <header className="flex items-center gap-6 border-b border-room-2 px-6 py-3">
      <p className="text-[11px] font-medium tracking-[0.22em] text-brass uppercase">The Board</p>
      <p className="ml-auto flex items-center gap-2 text-[12.5px] text-muted">
        <span
          aria-hidden
          className={`h-[7px] w-[7px] rounded-full ${live ? "bg-live" : "bg-brass-dim"}`}
        />
        <span>
          {PHASE_LABEL[state.phase] ?? state.phase} &middot; {elapsed} min &middot; {status}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => session.openInvitePanel()}
          disabled={!live}
          className="rounded-[3px] px-3 py-2 text-[13px] font-medium text-muted transition-colors duration-150 hover:bg-room-2 hover:text-ink disabled:opacity-35"
        >
          Invite your agent
        </button>
        <button
          type="button"
          onClick={() => session.endMeeting()}
          disabled={!live}
          className="rounded-[3px] bg-brass px-3.5 py-2 text-[13px] font-semibold text-walnut-deep transition-opacity duration-150 hover:opacity-90 disabled:opacity-35"
        >
          End Meeting
        </button>
      </div>
    </header>
  );
}
