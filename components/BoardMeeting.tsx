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

function briefingHeadline(briefing: string): { title: string; deck: string } {
  const trimmed = briefing.trim();
  if (!trimmed) return { title: "Awaiting brief", deck: "" };
  const questionMatch = trimmed.match(/Question:\s*([^\n]+)/i);
  const briefingMatch = trimmed.match(/Briefing:\s*([\s\S]+)/i);
  if (questionMatch) {
    const title = questionMatch[1].trim();
    const deck = (briefingMatch?.[1] ?? "")
      .trim()
      .split(/(?<=\.)\s+/)
      .slice(0, 2)
      .join(" ");
    return {
      title: title.length > 72 ? `${title.slice(0, 69)}…` : title,
      deck: deck.length > 110 ? `${deck.slice(0, 107)}…` : deck,
    };
  }
  const first = trimmed.split("\n").find((l) => l.trim()) ?? trimmed;
  return {
    title: first.length > 72 ? `${first.slice(0, 69)}…` : first,
    deck: "",
  };
}

function formatClock(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Los_Angeles",
  });
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
  const brief = briefingHeadline(state.briefing);

  const seats = useMemo(
    () =>
      state.members.map((m, i) => ({
        ...m,
        angle: angles[i] ?? 0,
      })),
    [angles, state.members],
  );

  const phaseLabel =
    state.meetingPhase === "opening"
      ? "Independent views"
      : state.meetingPhase === "ending"
        ? "Closing"
        : "Discussion";

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <header className="flex items-center gap-6 px-8 pt-5 pb-2">
        <div className="masthead">The Board</div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted)] ml-auto">
          <i className="block w-[7px] h-[7px] rounded-full bg-[var(--live)]" />
          {phaseLabel}
          <span className="opacity-50">·</span>
          <span>{state.members.length} seated</span>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen((v) => !v)}
          className="text-[var(--muted)] text-sm px-3 py-2 hover:text-[var(--brass)]"
        >
          Invite your agent
        </button>
        <button
          type="button"
          onClick={() => void session.endMeeting()}
          className="btn-brass !py-2 !px-4 text-sm"
        >
          End
        </button>
      </header>

      <div className="flex-1 grid grid-cols-[minmax(0,1fr)_300px] min-h-0 px-6 pb-4 gap-5">
        <section className="relative min-h-[560px] flex flex-col">
          <div className="relative flex-1 min-h-[420px]">
            <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 table-oval" />
            {seats.map((seat) => (
              <button
                type="button"
                key={seat.slug}
                onClick={() =>
                  setDraft((d) => `${d}${d && !d.endsWith(" ") ? " " : ""}@${seat.name} `)
                }
                className={`absolute w-[148px] text-center -ml-[74px] ${
                  seat.status === "speaking" ? "seat-speaking" : ""
                }`}
                style={{
                  left: `${50 + Math.sin((seat.angle * Math.PI) / 180) * 34}%`,
                  top: `${14 + (1 - Math.cos((seat.angle * Math.PI) / 180)) * 20}%`,
                }}
              >
                <div className="mx-auto w-fit">
                  <LetterMark initials={seat.initials} />
                </div>
                <strong className="block text-[13px] mt-2 serif">{seat.name}</strong>
                <em className="block not-italic text-[11px] text-[var(--muted)] tracking-wide">
                  {statusLabel(seat.status) || seat.role.split(",")[0]}
                </em>
                {seat.status === "speaking" ? (
                  <span className="speaking-tag">Speaking</span>
                ) : null}
              </button>
            ))}

            <div className="absolute left-[10%] bottom-[22%] w-[148px] text-center">
              <div className="mx-auto w-fit">
                <LetterMark
                  initials={state.guest.name ? initials(state.guest.name) : ""}
                  dashed={!state.guest.name}
                />
              </div>
              <strong className="block text-[13px] mt-2 serif">
                {state.guest.name ?? "Your agent"}
              </strong>
              <em className="block not-italic text-[11px] text-[var(--muted)]">
                {state.guest.name ? state.guest.status : "Empty seat"}
              </em>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 text-[12px] tracking-[0.14em] uppercase text-[var(--muted)]">
              You · Chair
            </div>

            {latest ? (
              <aside className="paper-card absolute right-2 top-[58%] w-[260px] p-4 -rotate-1 z-[1]">
                <p className="serif text-[16px] leading-[1.35]">{latest.text}</p>
                <cite className="block mt-2 not-italic text-[11px] tracking-[0.08em] uppercase text-[var(--paper-muted)]">
                  {latest.speakerName}
                </cite>
              </aside>
            ) : null}
          </div>

          <footer className="flex items-end justify-between gap-6 pt-2 pb-1 px-2">
            <div className="paper-card p-4 w-[min(420px,55%)] -rotate-[1deg]">
              <h2 className="serif text-[22px] font-semibold leading-[1.15]">{brief.title}</h2>
              {brief.deck ? (
                <p className="mt-1.5 text-[13px] text-[var(--paper-muted)] leading-snug">
                  {brief.deck}
                </p>
              ) : null}
            </div>
            <div className="text-right pb-1">
              <div className="text-[12px] text-[var(--muted)] mb-2">
                Call on a member, or let the table continue
              </div>
              <p className="text-[11px] text-[var(--brass-dim)] tracking-wide">
                Click a seat to @mention · type below to address the board
              </p>
            </div>
          </footer>
        </section>

        <aside className="flex flex-col min-h-0 minutes-panel">
          <div className="px-4 py-3 text-[11px] tracking-[0.18em] uppercase text-[var(--brass)] border-b border-[oklch(50%_0.04_70_/_0.22)]">
            Minutes
          </div>
          <div className="flex-1 overflow-auto px-4 py-3 space-y-0 text-[14px] leading-relaxed font-[family-name:var(--font-newsreader)]">
            {state.transcript.length === 0 ? (
              <p className="text-[var(--muted)] italic text-[13px]">The ledger is empty.</p>
            ) : null}
            {state.transcript.map((event) => (
              <div
                key={event.id}
                className="py-2.5 border-b border-[oklch(50%_0.04_70_/_0.15)] last:border-0"
              >
                {event.kind === "reaction" ? (
                  <span className="text-[var(--brass)] text-[11px] uppercase tracking-wider">
                    {formatClock(event.createdAt)} · {event.speakerName} · {event.reaction}
                  </span>
                ) : event.kind === "system" ? (
                  <p className="text-[var(--muted)] italic text-[13px]">{event.text}</p>
                ) : (
                  <>
                    <time className="block text-[10px] tracking-[0.08em] uppercase text-[var(--muted)] mb-1">
                      {formatClock(event.createdAt)} · {event.speakerName}
                    </time>
                    <p
                      className={
                        /disagree|dissent|interrupt/i.test(event.text)
                          ? "text-[var(--dissent)] italic"
                          : ""
                      }
                    >
                      {event.text}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
          <form
            className="p-3 border-t border-[oklch(50%_0.04_70_/_0.22)]"
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
              className="w-full bg-[var(--bg)] border border-[oklch(50%_0.04_70_/_0.25)] px-3 py-2 text-sm min-h-[72px] outline-none focus:border-[var(--brass)] resize-none"
            />
            <div className="flex justify-end mt-2">
              <button type="submit" className="text-sm text-[var(--brass)] font-medium tracking-wide">
                Send
              </button>
            </div>
          </form>
        </aside>
      </div>

      {inviteOpen ? (
        <div className="absolute right-8 top-16 w-[420px] paper-card p-5 z-10">
          <h2 className="serif text-xl font-semibold mb-2">Invite your agent</h2>
          <p className="text-sm mb-3 text-[var(--paper-muted)] leading-relaxed">
            A compatible agent can join through this page’s site tools. Copy the invitation and paste it
            into your agent while this meeting remains open.
          </p>
          <textarea
            readOnly
            value={AGENT_INVITATION}
            className="w-full text-sm h-36 p-3 bg-white/70 border border-[oklch(45%_0.03_55_/_0.2)] outline-none"
          />
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
