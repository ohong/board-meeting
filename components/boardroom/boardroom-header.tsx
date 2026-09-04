"use client";

import { useEffect, useMemo, useState } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import { Button } from "@/components/ui/button";
import { PlugIcon, UsersIcon } from "@/components/ui/icons";

const PHASE_LABEL: Record<string, string> = {
  forming: "Forming positions",
  discussion: "Live",
  closing: "Closing",
};

function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${String(h).padStart(2, "0")}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function BoardroomHeader() {
  const session = useSession();
  const state = useMeetingState();
  // The boardroom only ever mounts client-side (a fresh session always starts in
  // "selecting"), so reading the clock at mount is hydration-safe.
  const [now, setNow] = useState(() => Date.now());

  const running = state.phase === "forming" || state.phase === "discussion";
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const members = useMemo(() => Object.values(state.members), [state.members]);
  const seated = members.filter((m) => m.status !== "failed" && m.status !== "retrying").length;
  const guestSeated = !!state.guest && state.guest.status !== "empty";
  const headcount = seated + 1 + (guestSeated ? 1 : 0); // members + chair + guest
  const end = state.endedAt ?? now;
  const elapsed = state.startedAt ? clock(end - state.startedAt) : "00:00";
  const live = running;
  const latest = state.transcript.at(-1);
  const waitingForChair =
    state.phase === "discussion" &&
    latest?.kind === "event" &&
    latest.event === "notice" &&
    latest.text.includes("waiting for the chair");
  const canEnd = session.canEndMeeting();
  const topic = state.briefing.split("\n")[0].trim() || "Board meeting";

  return (
    <header className="flex items-center gap-3 border-b border-line px-4 py-3">
      <div
        className="flex min-w-0 max-w-[420px] items-center gap-3 rounded-xl border border-line bg-surface-2/70 px-3.5 py-2"
        title={state.briefing}
      >
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] leading-tight font-semibold text-ink">{topic}</span>
          <span className="mt-1 flex items-center gap-1.5 text-[11.5px] text-muted">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${live && !waitingForChair ? "animate-pulse-soft bg-live" : "bg-faint"}`}
            />
            <span className={live && !waitingForChair ? "font-semibold text-live" : "font-medium"}>
              {waitingForChair ? "Waiting on you" : (PHASE_LABEL[state.phase] ?? state.phase)}
            </span>
            <span aria-hidden>&middot;</span>
            <span className="tabular-nums">{elapsed}</span>
            {state.phase === "discussion" && seated < members.length ? (
              <>
                <span aria-hidden>&middot;</span>
                <span>
                  {seated} of {members.length} seated
                </span>
              </>
            ) : null}
          </span>
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="pill h-9 px-3 text-ink-2" title="Participants at the table">
          <UsersIcon size={15} className="text-muted" />
          <span className="text-[12.5px] font-semibold tabular-nums">{headcount}</span>
        </span>
        <Button size="sm" className="h-9" onClick={() => session.openInvitePanel()} disabled={!live}>
          <PlugIcon size={15} className="text-muted" />
          Invite your agent
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => {
            const result = session.endMeeting();
            if (!result.ok) session.notify(result.error.message);
          }}
          disabled={!canEnd}
          title={canEnd ? "End the meeting and prepare the readout" : "Every available member must speak before the meeting can end"}
        >
          End meeting
        </Button>
      </div>
    </header>
  );
}
