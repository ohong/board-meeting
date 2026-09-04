"use client";

import { useEffect, useMemo, useState } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import { Button } from "@/components/ui/button";
import { PlugIcon } from "@/components/ui/icons";
import { Portrait } from "@/components/ui/portrait";

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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function BoardroomHeader() {
  const session = useSession();
  const state = useMeetingState();
  const chair = session.isChair();
  // The boardroom only ever mounts client-side (a fresh session always starts in
  // "selecting"), so reading the clock at mount is hydration-safe.
  const [now, setNow] = useState(() => Date.now());

  const running = state.phase === "forming" || state.phase === "discussion";
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const members = useMemo(() => Object.values(state.members).sort((a, b) => a.seat - b.seat), [state.members]);
  const seated = members.filter((m) => m.status !== "failed" && m.status !== "retrying").length;
  const guestName = state.guest && state.guest.status !== "empty" ? state.guest.name : null;
  const guestSeated = guestName !== null;
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
  const canEnd = chair && session.canEndMeeting();
  const topic = state.briefing.split("\n")[0].trim() || "Board meeting";
  const speaking = live && !waitingForChair;

  return (
    <header className="material relative z-20 flex h-[60px] shrink-0 items-center gap-3 border-b border-line px-4">
      {/* Status first: the one thing that changes on its own. */}
      <span
        className={`flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 transition-colors duration-400 ease-out ${
          speaking ? "border-live/30 bg-live-soft" : "border-line bg-surface-2"
        }`}
      >
        <span
          aria-hidden
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${speaking ? "animate-pulse-soft bg-live" : "bg-faint"}`}
        />
        <span className={`text-[12px] font-semibold ${speaking ? "text-live" : "text-muted"}`}>
          {waitingForChair ? "Waiting on you" : (PHASE_LABEL[state.phase] ?? state.phase)}
        </span>
        <span aria-hidden className="h-3 w-px bg-line-strong/60" />
        <span className="text-[12px] font-medium text-ink-2 tabular-nums">{elapsed}</span>
      </span>

      <div className="min-w-0 flex-1" title={state.briefing}>
        <p className="truncate text-[14px] leading-tight font-semibold text-ink">
          {topic}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-muted">
          {headcount} at the table
          {state.phase === "discussion" && seated < members.length ? ` · ${seated} of ${members.length} seated` : ""}
        </p>
      </div>

      {/* Who is in the room, as faces rather than a number. */}
      <span className="hidden shrink-0 items-center -space-x-2 md:flex" aria-hidden>
        {members.map((m) => (
          <Portrait
            key={m.id}
            src={m.persona.portrait}
            alt=""
            size={26}
            className="ring-2 ring-surface"
            grayscale={m.status === "failed"}
          />
        ))}
        {guestName ? (
          <span className="flex h-[26px] w-[26px] animate-pop-in items-center justify-center rounded-full bg-live-soft text-[12px] font-bold text-ink-2 ring-2 ring-surface">
            {initials(guestName)}
          </span>
        ) : null}
      </span>

      {chair ? (
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" className="h-9" onClick={() => session.openInvitePanel()} disabled={!live}>
            <PlugIcon size={14} className="text-muted" />
            <span className="hidden lg:inline">Invite your agent</span>
            <span className="lg:hidden">Invite</span>
          </Button>
          <Button
            /* Once the board has said its piece, ending is the next thing to do —
               so the button starts quiet and becomes the primary action. */
            variant={canEnd && waitingForChair ? "primary" : "outline"}
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
      ) : (
        <span className="pill shrink-0 text-live">Guest view · live sync</span>
      )}
    </header>
  );
}
