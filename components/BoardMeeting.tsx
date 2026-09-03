"use client";

import { useMemo, useState } from "react";
import { AGENT_INVITATION } from "@/lib/example";
import { LetterMark } from "./LetterMark";
import type { MeetingSession, MeetingState } from "@/lib/session";

const ANGLES: Record<number, number[]> = {
  3: [-40, 0, 40],
  4: [-55, -18, 18, 55],
  5: [-70, -35, 0, 35, 70],
  6: [-80, -48, -16, 16, 48, 80],
};

function statusLabel(status: string): string {
  switch (status) {
    case "thinking":
      return "Forming a view";
    case "speaking":
      return "Speaking";
    case "wants_to_respond":
      return "Wants the floor";
    case "reconnecting":
      return "Reconnecting";
    case "reacting":
      return "Reacting";
    case "ready":
      return "Ready";
    default:
      return "";
  }
}

export function BoardMeeting({
  session,
  state,
}: {
  session: MeetingSession;
  state: MeetingState;
}) {
  const [draft, setDraft] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const latest = [...state.transcript].reverse().find((e) => e.kind === "message");
  const angles = ANGLES[state.members.length] ?? ANGLES[3];

  const seats = useMemo(
    () =>
      state.members.map((m, i) => ({
        ...m,
        angle: angles[i] ?? 0,
      })),
    [angles, state.members],
  );

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <header className="flex items-center gap-6 px-8 pt-5 pb-2">
        <div className="text-[11px] tracking-[0.22em] uppercase text-[var(--brass)]">The Board</div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted)] ml-auto">
          <i className="block w-[7px] h-[7px] rounded-full bg-[var(--live)]" />
          {state.meetingPhase === "opening" ? "Independent views" : "Discussion"}
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen((v) => !v)}
          className="text-[var(--muted)] text-sm px-3 py-2"
        >
          Invite your agent
        </button>
        <button
          type="button"
          onClick={() => void session.endMeeting()}
          className="bg-[var(--brass)] text-[oklch(18%_0.03_55)] font-semibold px-4 py-2 rounded-[4px] text-sm"
        >
          End Meeting
        </button>
      </header>

      <div className="flex-1 grid grid-cols-[minmax(0,1fr)_360px] min-h-0 px-6 pb-4 gap-4">
        <section className="relative min-h-[560px]">
          <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 table-oval" />
          {seats.map((seat) => (
            <button
              type="button"
              key={seat.slug}
              onClick={() => setDraft((d) => `${d}${d && !d.endsWith(" ") ? " " : ""}@${seat.name} `)}
              className={`absolute w-[148px] text-center -ml-[74px] ${seat.status === "speaking" ? "seat-speaking" : ""}`}
              style={{
                left: `${50 + Math.sin((seat.angle * Math.PI) / 180) * 32}%`,
                top: `${18 + (1 - Math.cos((seat.angle * Math.PI) / 180)) * 18}%`,
              }}
            >
              <div className="mx-auto w-fit">
                <LetterMark initials={seat.initials} />
              </div>
              <strong className="block text-[13px] mt-2">{seat.name}</strong>
              <em className="block not-italic text-[11px] text-[var(--muted)]">
                {statusLabel(seat.status) || seat.role}
              </em>
              {seat.status === "speaking" ? (
                <span className="inline-block mt-1 bg-[var(--brass)] text-[oklch(18%_0.03_55)] text-[10px] tracking-[0.08em] uppercase px-2 py-0.5 rounded-[2px] font-semibold">
                  Speaking
                </span>
              ) : null}
            </button>
          ))}

          <div
            className="absolute left-[12%] bottom-[18%] w-[148px] text-center"
          >
            <div className="mx-auto w-fit">
              <LetterMark
                initials={state.guest.name ? initials(state.guest.name) : ""}
                dashed={!state.guest.name}
              />
            </div>
            <strong className="block text-[13px] mt-2">{state.guest.name ?? "Your agent"}</strong>
            <em className="block not-italic text-[11px] text-[var(--muted)]">
              {state.guest.name ? state.guest.status : "Empty seat"}
            </em>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 text-[12px] tracking-[0.12em] uppercase text-[var(--muted)]">
            You · Chair
          </div>

          {latest ? (
            <aside className="paper-card absolute right-4 bottom-16 w-[260px] p-4 rounded-[2px] -rotate-1">
              <p className="serif text-[16px] leading-[1.35]">{latest.text}</p>
              <cite className="block mt-2 not-italic text-[11px] tracking-[0.08em] uppercase text-[oklch(45%_0.04_55)]">
                {latest.speakerName}
              </cite>
            </aside>
          ) : null}
        </section>

        <aside className="flex flex-col min-h-0 bg-[var(--surface)] rounded-md border border-[oklch(50%_0.04_70_/_0.25)]">
          <div className="px-4 py-3 text-[11px] tracking-[0.18em] uppercase text-[var(--muted)] border-b border-[oklch(50%_0.04_70_/_0.2)]">
            Minutes
          </div>
          <div className="flex-1 overflow-auto px-4 py-3 space-y-3 text-[14px] leading-relaxed">
            {state.transcript.map((event) => (
              <div key={event.id} className={event.kind === "system" ? "text-[var(--muted)] italic text-[13px]" : ""}>
                {event.kind === "reaction" ? (
                  <span className="text-[var(--brass)] text-xs uppercase tracking-wider">
                    {event.speakerName} · {event.reaction}
                  </span>
                ) : (
                  <>
                    <span className="text-[11px] text-[var(--muted)]">{event.speakerName}</span>
                    <p>{event.text}</p>
                  </>
                )}
              </div>
            ))}
          </div>
          <form
            className="p-3 border-t border-[oklch(50%_0.04_70_/_0.2)]"
            onSubmit={(e) => {
              e.preventDefault();
              void session.sendUserMessage(draft);
              setDraft("");
            }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => session.setComposing(true)}
              onBlur={() => session.setComposing(false)}
              placeholder="Address the board, or @Name to call on someone"
              className="w-full bg-[var(--bg)] rounded px-3 py-2 text-sm min-h-[72px] outline-none"
            />
            <div className="flex justify-end mt-2">
              <button type="submit" className="text-sm text-[var(--brass)] font-medium">
                Send
              </button>
            </div>
          </form>
        </aside>
      </div>

      {inviteOpen ? (
        <div className="absolute right-8 top-16 w-[420px] paper-card p-5 z-10 rounded-[2px]">
          <h2 className="serif text-xl font-semibold mb-2">Invite your agent</h2>
          <p className="text-sm mb-3">
            A compatible agent can join through this page’s site tools. Copy the invitation and paste it
            into your agent while this meeting remains open.
          </p>
          <textarea readOnly value={AGENT_INVITATION} className="w-full text-sm h-36 p-3 bg-white/70" />
          <button
            type="button"
            className="mt-3 bg-[var(--walnut)] text-[var(--cream)] px-4 py-2 text-sm"
            onClick={async () => {
              await navigator.clipboard.writeText(AGENT_INVITATION);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy invitation"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
