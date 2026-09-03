"use client";

import { useEffect, useRef } from "react";
import { Reaction } from "./Reaction";
import type { TranscriptEvent } from "@/lib/types";

/**
 * The shared record. Everything the room can see is here in one column — the chair, the
 * advisers, the guest agent, and the secretary's compact event rows.
 */
export function Minutes({ transcript }: { transcript: TranscriptEvent[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  useEffect(() => {
    const element = scroller.current;
    if (!element || !pinned.current) return;
    element.scrollTop = element.scrollHeight;
  }, [transcript]);

  return (
    <div
      ref={scroller}
      onScroll={(event) => {
        const element = event.currentTarget;
        // Stay pinned to the bottom unless the reader has scrolled back to look at something.
        pinned.current = element.scrollHeight - element.scrollTop - element.clientHeight < 72;
      }}
      className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-4"
    >
      {transcript.length === 0 ? (
        <p className="text-[13px] text-[var(--faint)] italic">
          The minutes will fill in as the board speaks.
        </p>
      ) : null}

      {transcript.map((event) => {
        if (event.kind === "system") {
          return (
            <div key={event.id} className="minutes-row flex gap-3 items-start">
              <span className="mt-[7px] h-px w-4 shrink-0 bg-[var(--hairline-strong)]" />
              <p className="text-[12.5px] leading-relaxed text-[var(--faint)] italic">{event.text}</p>
            </div>
          );
        }

        const isChair = event.speakerId === "chair";
        const isGuest = event.speakerId === "guest";
        const accent = isChair ? "var(--brass)" : isGuest ? "var(--guest)" : "var(--ink)";

        return (
          <div key={event.id} className="minutes-row">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[11px] font-semibold tracking-[0.04em]" style={{ color: accent }}>
                {event.speakerName}
              </span>
              {event.addressedTo ? (
                <span className="text-[10.5px] text-[var(--faint)]">to {event.addressedTo}</span>
              ) : null}
              {event.reaction ? <Reaction kind={event.reaction} /> : null}
            </div>
            <p
              className={`mt-1 text-[14px] leading-[1.55] ${event.streaming ? "caret" : ""}`}
              style={{ color: isChair || isGuest ? "var(--ink)" : "var(--ink)" }}
            >
              {event.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
