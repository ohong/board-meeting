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
  SPOTLIGHT_H,
  SPOTLIGHT_W,
  TABLE_RX,
  TABLE_RY,
  memberAngles,
  pointAt,
  speechCardPoint,
  spotlightPoint,
} from "./seat-layout";
import { SpeechCard } from "./speech-card";

/** Absolute placement helper for anything that never moves after it is placed. */
function seatStyle(x: number, y: number): React.CSSProperties {
  return {
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    transform: "translate(-50%, -50%)",
  };
}

/**
 * Placement for things that DO move between positions. Left/top can't be
 * transitioned smoothly (they hit layout every frame), so the position is
 * carried entirely on a transform from the scene centre.
 */
function movingStyle(x: number, y: number): React.CSSProperties {
  return {
    left: "50%",
    top: "50%",
    transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`,
  };
}

export function TableScene({ onMention }: { onMention: (mention: string) => void }) {
  const session = useSession();
  const state = useMeetingState();
  const chair = session.isChair();

  const members = useMemo(
    () => Object.values(state.members).sort((a, b) => a.seat - b.seat),
    [state.members],
  );
  const angles = useMemo(() => memberAngles(members.length), [members.length]);

  /**
   * Whoever last held the floor — streaming or finished. Deriving this from the
   * transcript rather than remembering it in a ref means the light and the card
   * stay put between turns instead of snapping back to the centre of the table.
   */
  const lastTurn = useMemo(() => {
    for (let i = state.transcript.length - 1; i >= 0; i--) {
      const entry = state.transcript[i];
      if (entry.kind === "message" && entry.speakerRole === "member") return entry;
    }
    return null;
  }, [state.transcript]) as MessageEntry | null;

  const speakingNow = state.streamingEntryId !== null && lastTurn?.id === state.streamingEntryId;
  const holder = lastTurn ? members.find((m) => m.id === lastTurn.speakerId) : undefined;
  const holderIndex = holder ? members.indexOf(holder) : -1;
  const focus = holderIndex >= 0 ? angles[holderIndex] : 0;

  const light = spotlightPoint(focus);
  const cardPoint = speechCardPoint(focus);
  const chairPoint = pointAt(CHAIR_ANGLE);

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      {/* The room: brightest above the table, deepening toward the walls. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(105% 78% at 50% 14%, var(--color-room) 0%, var(--color-room-deep) 58%, var(--color-room-wall) 100%)",
        }}
      />
      <div aria-hidden className="room-grain absolute inset-0 opacity-[0.035] mix-blend-multiply" />

      <div
        className="relative shrink-0 origin-center max-[1440px]:scale-[0.92] max-[1280px]:scale-[0.82] max-[1120px]:scale-[0.72]"
        style={{ width: SCENE_W, height: SCENE_H }}
      >
        {/* The table: lit from above, so the near edge falls into shade. */}
        <div
          aria-hidden
          className="absolute rounded-[50%]"
          style={{
            width: TABLE_RX * 2,
            height: TABLE_RY * 2,
            background:
              "linear-gradient(to bottom, var(--color-table-lit) 0%, var(--color-table) 58%, var(--color-table-shade) 100%)",
            boxShadow:
              "inset 0 0 0 1px var(--color-table-edge), inset 0 2px 0 0 rgb(255 255 255 / 0.9), inset 0 -18px 32px -20px rgb(0 0 0 / 0.16), 0 2px 0 0 rgb(255 255 255 / 0.5), 0 26px 44px -26px rgb(0 0 0 / 0.2), 0 60px 90px -50px rgb(0 0 0 / 0.18)",
            ...seatStyle(0, 0),
          }}
        >
          <div className="absolute inset-[18px] rounded-[50%] shadow-[inset_0_0_0_1px_var(--color-table-edge)]" />
        </div>

        {/* The pool of light in front of whoever holds the floor. It travels to
            the next speaker rather than being re-lit from scratch. */}
        <div
          aria-hidden
          className="motion-travel pointer-events-none absolute z-[5] rounded-[50%]"
          style={{
            width: SPOTLIGHT_W,
            height: SPOTLIGHT_H,
            opacity: speakingNow ? 1 : 0,
            transition: "transform 520ms var(--ease-in-out), opacity 380ms var(--ease-out)",
            background:
              "radial-gradient(closest-side, rgb(255 255 255 / 0.98) 0%, rgb(255 255 255 / 0.5) 34%, rgb(255 255 255 / 0) 70%)",
            ...movingStyle(light.x, light.y),
          }}
        />

        {/* Board member seats. They arrive one after another when the room opens. */}
        {members.map((member, i) => {
          const p = pointAt(angles[i], RING_RX, RING_RY);
          return (
            /* The entrance animation MUST live on an inner element: its
               fill-mode keeps `transform: none` applied after it finishes,
               which would wipe the translate(-50%, -50%) that centres the seat
               on its point. */
            <div key={member.id} className="absolute z-10" style={seatStyle(p.x, p.y)}>
              <div className="animate-seat-in" style={{ animationDelay: `${i * 70}ms` }}>
                <MemberSeat
                  member={member}
                  dimmed={speakingNow && member.id !== holder?.id}
                  onSelect={() => onMention(member.persona.mention)}
                  onRetry={() => session.retryMember(member.id)}
                />
              </div>
            </div>
          );
        })}

        {/* The live turn, on the table surface in front of its speaker. The card
            stays mounted and slides to the next speaker as it fades back in, so
            the floor visibly passes from one person to the next. */}
        {lastTurn ? (
          <div
            className="motion-travel pointer-events-none absolute z-20"
            style={{
              transition: "transform 520ms var(--ease-in-out)",
              ...movingStyle(cardPoint.x, cardPoint.y),
            }}
          >
            <SpeechCard entry={lastTurn} portrait={holder?.persona.portrait ?? null} visible={speakingNow} />
          </div>
        ) : null}

        {/* The chair */}
        <div className="absolute z-10 w-[150px] text-center" style={seatStyle(chairPoint.x, chairPoint.y - 6)}>
          <span className="relative mx-auto block w-fit">
            <span className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-surface p-[3px] shadow-[var(--shadow-seat)]">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-accent-soft text-accent-deep">
                <ChairIcon size={20} />
              </span>
            </span>
            <span aria-hidden className="absolute right-[3px] bottom-[3px] h-3 w-3 rounded-full bg-live ring-2 ring-surface" />
          </span>
          <span className="mt-2 block text-[13px] leading-tight font-semibold text-ink">
            {chair ? "You" : "Human chair"}
          </span>
          <span className="mt-0.5 block text-[12px] text-muted">Board Chair</span>
          <span className="mt-1.5 flex h-[22px] items-center justify-center">
            {state.chairComposing ? (
              <span className="inline-flex h-[22px] animate-pop-in items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-2.5 text-[12px] font-semibold text-accent-deep">
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
