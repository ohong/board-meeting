"use client";

/**
 * UI test surface. Renders <BoardApp/> against any deterministic MeetingState,
 * with no engine and no model calls.
 *
 * The frozen fixtures all seat exactly three members, so this file adds local
 * derivatives (4/5/6 seats, member failure, closing, failed readout, notice) to
 * exercise the seat geometry and the error states. Nothing here is imported by
 * the product.
 */

import { useMemo, useState, useSyncExternalStore } from "react";
import { BoardApp } from "@/components/board-app";
import { MeetingProvider } from "@/lib/meeting/context";
import {
  FIXTURES,
  FIXTURE_PERSONAS,
  fixtureDiscussion,
  fixtureReadout,
} from "@/lib/meeting/fixtures";
import { MeetingSession } from "@/lib/meeting/session";
import type { MeetingState, MemberParticipant } from "@/lib/meeting/types";

/** Rebuild a discussion state around the first `n` catalog personas. */
function withBoardSize(n: number): MeetingState {
  const base = fixtureDiscussion();
  const board = FIXTURE_PERSONAS.slice(0, n);
  const members: Record<string, MemberParticipant> = {};
  const statuses = [
    "speaking",
    "wants-to-respond",
    "reacting",
    "ready",
    "forming",
    "failed",
  ] as const;
  board.forEach((persona, seat) => {
    const existing = Object.values(base.members)[seat];
    const status = statuses[seat % statuses.length];
    members[persona.slug] = {
      role: "member",
      id: persona.slug,
      persona,
      seat,
      status,
      turns: existing?.turns ?? 1,
      position: existing?.position ?? null,
      positionUpdate: null,
      reaction: status === "reacting" ? { kind: "disagree", toId: board[0].slug, at: Date.now() } : null,
      urgency: 5,
      lastError: status === "failed" ? "Model call failed" : null,
      retries: status === "failed" ? 2 : 0,
    };
  });
  // Keep the streaming turn attached to whoever now holds the "speaking" seat.
  const speaker = Object.values(members).find((m) => m.status === "speaking")!;
  return {
    ...base,
    board,
    members,
    transcript: base.transcript.map((e) =>
      e.id === "m4" && e.kind === "message"
        ? { ...e, speakerId: speaker.id, speakerName: speaker.persona.name }
        : e,
    ),
  };
}

const LOCAL_FIXTURES: Record<string, () => MeetingState> = {
  "board-4": () => withBoardSize(4),
  "board-5": () => withBoardSize(5),
  "board-6": () => withBoardSize(6),
  closing: () => ({ ...fixtureDiscussion(), phase: "closing", readoutStatus: "generating", endedAt: Date.now() }),
  "closing-failed": () => ({
    ...fixtureDiscussion(),
    phase: "closing",
    readoutStatus: "failed",
    endedAt: Date.now(),
  }),
  "readout-fallback": () => {
    const s = fixtureReadout();
    return {
      ...s,
      readoutRetrievedByGuestAt: Date.now(),
      readout: s.readout
        ? {
            ...s.readout,
            fallback: true,
            closingComments: s.readout.closingComments.map((c, i) =>
              i === 1 ? { ...c, fallback: true } : c,
            ),
          }
        : null,
    };
  },
  "select-notice": () => ({
    ...FIXTURES.selecting(),
    board: FIXTURE_PERSONAS.slice(0, 6),
    notice: { id: "n1", text: "A board seats at most 6 members. Deselect someone to add Rick." },
  }),
  "guest-joining": () => {
    const s = FIXTURES.guest();
    return { ...s, guest: s.guest ? { ...s.guest, status: "joining" } : null };
  },
  invite: () => ({ ...fixtureDiscussion(), invitePanelOpen: true }),
};

const ALL: Record<string, () => MeetingState> = { ...FIXTURES, ...LOCAL_FIXTURES };
const NAMES = Object.keys(ALL);

const noopSubscribe = () => () => {};

export default function FixturesPage() {
  // Mount gate: the fixtures call Date.now(), so nothing may render on the server.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [override, setOverride] = useState<string | null>(null);

  const fromUrl = mounted ? new URLSearchParams(window.location.search).get("fixture") : null;
  const name = override ?? (fromUrl && fromUrl in ALL ? fromUrl : "discussion");

  const session = useMemo(() => (mounted ? new MeetingSession(ALL[name]()) : null), [mounted, name]);

  function pick(next: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("fixture", next);
    window.history.replaceState(null, "", url);
    setOverride(next);
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="flex h-[41px] flex-wrap items-center gap-1.5 overflow-hidden border-b border-line bg-ink px-3">
        <span className="mr-2 text-[12px] tracking-[0.16em] text-faint uppercase">Fixtures</span>
        {NAMES.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => pick(n)}
            className={`rounded-full px-2.5 py-1 text-[12px] ${
              n === name ? "bg-surface text-ink font-semibold" : "text-faint hover:bg-ink-2 hover:text-surface"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1" style={{ "--app-height": "calc(100dvh - 41px)" } as React.CSSProperties}>
        {session ? (
          <MeetingProvider key={name} session={session}>
            <BoardApp catalog={FIXTURE_PERSONAS} />
          </MeetingProvider>
        ) : null}
      </div>
    </div>
  );
}
