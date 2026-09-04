"use client";

import { useMemo } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import type { MessageEntry } from "@/lib/meeting/types";
import { ChairIcon } from "@/components/ui/icons";
import { Equalizer, MemberSeat } from "./member-seat";
import {
  CHAIR_ANGLE,
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

  const speaker = streaming ? members.find((m) => m.id === streaming.speakerId) : undefined;
  const speakerIndex = speaker ? members.indexOf(speaker) : -1;
  const cardPoint = speechCardPoint(speakerIndex >= 0 ? angles[speakerIndex] : 0);
  const chairPoint = pointAt(CHAIR_ANGLE);

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      <div
        className="relative shrink-0 origin-center max-[1440px]:scale-[0.92] max-[1280px]:scale-[0.82] max-[1120px]:scale-[0.72]"
        style={{ width: SCENE_W, height: SCENE_H }}
      >
        {/* The table */}
        <div
          aria-hidden
          className="absolute rounded-[50%] bg-table shadow-[inset_0_0_0_1px_var(--color-table-edge),inset_0_2px_0_0_oklch(100%_0_0/0.6),0_30px_60px_-30px_oklch(30%_0.04_60/0.35)]"
          style={{
            width: TABLE_RX * 2,
            height: TABLE_RY * 2,
            ...seatStyle(0, 0),
          }}
        >
          <div className="absolute inset-[18px] rounded-[50%] shadow-[inset_0_0_0_1px_var(--color-table-edge)]" />
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

        {/* Live speech card on the table surface, leaning toward the speaker's seat. */}
        <div className="pointer-events-none absolute z-20" style={seatStyle(cardPoint.x, cardPoint.y)}>
          {streaming ? (
            <SpeechCard key={streaming.id} entry={streaming} portrait={speaker?.persona.portrait ?? null} />
          ) : null}
        </div>

        {/* The chair */}
        <div className="absolute z-10 w-[150px] text-center" style={seatStyle(chairPoint.x, chairPoint.y - 6)}>
          <span className="relative mx-auto block w-fit">
            <span className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-surface p-[3px] shadow-[0_0_0_1px_var(--color-line),0_6px_18px_-8px_oklch(30%_0.04_60/0.35)]">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-accent-soft text-accent-deep">
                <ChairIcon size={26} />
              </span>
            </span>
            <span aria-hidden className="absolute right-[3px] bottom-[3px] h-3 w-3 rounded-full bg-live ring-2 ring-surface" />
          </span>
          <span className="mt-2 block text-[13px] leading-tight font-semibold text-ink">You</span>
          <span className="mt-0.5 block text-[11.5px] text-muted">Board Chair</span>
          <span className="mt-1.5 flex h-[22px] items-center justify-center">
            {state.chairComposing ? (
              <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-2.5 text-[11px] font-semibold text-accent-deep">
                <Equalizer />
                Typing
              </span>
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
}
