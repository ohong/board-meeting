"use client";

import { useMemo } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import type { MessageEntry } from "@/lib/meeting/types";
import { GuestSeat } from "./guest-seat";
import { MemberSeat } from "./member-seat";
import {
  GUEST_ANGLE,
  RING_RX,
  RING_RY,
  SCENE_H,
  SCENE_W,
  TABLE_RX,
  TABLE_RY,
  memberAngles,
  pointAt,
  speechCardPoint,
} from "./seat-layout";
import { SpeechCard } from "./speech-card";

/** Absolute placement helper: everything is positioned from the scene centre. */
function seatStyle(x: number, y: number): React.CSSProperties {
  return {
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    transform: "translate(-50%, -50%)",
  };
}

export function TableScene({ onMention }: { onMention: (mention: string) => void }) {
  const session = useSession();
  const state = useMeetingState();

  const members = useMemo(
    () => Object.values(state.members).sort((a, b) => a.seat - b.seat),
    [state.members],
  );
  const angles = useMemo(() => memberAngles(members.length), [members.length]);

  const streaming = useMemo(() => {
    if (!state.streamingEntryId) return null;
    const entry = state.transcript.find((e) => e.id === state.streamingEntryId);
    return entry && entry.kind === "message" && entry.speakerRole === "member"
      ? (entry as MessageEntry)
      : null;
  }, [state.streamingEntryId, state.transcript]);

  const speakerIndex = streaming ? members.findIndex((m) => m.id === streaming.speakerId) : -1;
  const cardPoint = speechCardPoint(speakerIndex >= 0 ? angles[speakerIndex] : 0);
  const guestPoint = pointAt(GUEST_ANGLE);

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      <div
        className="relative shrink-0 origin-center max-[1380px]:scale-90 max-[1180px]:scale-[0.78]"
        style={{ width: SCENE_W, height: SCENE_H }}
      >
        {/* Walnut table */}
        <div
          aria-hidden
          className="absolute rounded-[50%] bg-walnut shadow-[inset_0_0_0_1px_oklch(50%_0.06_70/0.45),0_22px_50px_oklch(10%_0.02_55/0.55)]"
          style={{
            width: TABLE_RX * 2,
            height: TABLE_RY * 2,
            ...seatStyle(0, 0),
          }}
        >
          <div className="absolute inset-6 rounded-[50%] shadow-[inset_0_0_0_1px_oklch(78%_0.08_80/0.18)]" />
        </div>

        {/* Board member seats */}
        {members.map((member, i) => {
          const p = pointAt(angles[i], RING_RX, RING_RY);
          return (
            <div key={member.id} className="absolute z-10" style={seatStyle(p.x, p.y)}>
              <MemberSeat
                member={member}
                onSelect={() => onMention(member.persona.mention)}
                onRetry={() => session.retryMember(member.id)}
              />
            </div>
          );
        })}

        {/* Reserved guest seat */}
        <div className="absolute z-10" style={seatStyle(guestPoint.x, guestPoint.y)}>
          <GuestSeat guest={state.guest} />
        </div>

        {/* Live speech card on the table surface, pulled in from the speaker's seat. */}
        <div className="pointer-events-none absolute z-20" style={seatStyle(cardPoint.x, cardPoint.y)}>
          {streaming ? <SpeechCard key={streaming.id} entry={streaming} /> : null}
        </div>

        {/* The chair */}
        <div
          className="absolute z-10 text-center"
          style={{ left: "50%", bottom: 0, transform: "translateX(-50%)" }}
        >
          <span
            aria-hidden
            className="mx-auto block h-1.5 w-24 rounded-full bg-brass/35 shadow-[0_0_18px_-2px_var(--color-brass)]"
          />
          <span className="mt-2 block text-[12px] tracking-[0.12em] text-muted uppercase">
            You &middot; Chair
          </span>
          {state.chairComposing ? (
            <span className="mt-1 block animate-pulse-soft text-[10px] tracking-[0.1em] text-brass uppercase">
              Typing
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
