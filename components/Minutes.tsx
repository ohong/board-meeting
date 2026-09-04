"use client";

import { useEffect, useRef, useState } from "react";
import { Portrait, initialsFor } from "./LetterMark";
import { REACTION } from "./vocabulary";
import type { TranscriptEvent } from "@/lib/types";

/**
 * The shared record, typeset as board minutes on paper: editorial entries with a portrait,
 * a name and a recipient line, never speech bubbles. It is the bridge between the dark room
 * and the readout the meeting becomes.
 */
export function Minutes({
  transcript,
  members,
}: {
  transcript: TranscriptEvent[];
  members: { slug: string; name: string; initials: string; portrait?: boolean }[];
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    const element = scroller.current;
    if (!element || !pinned) return;
    element.scrollTop = element.scrollHeight;
  }, [transcript, pinned]);

  const jumpToLatest = () => {
    const element = scroller.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
    setPinned(true);
  };

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scroller}
        onScroll={(event) => {
          const element = event.currentTarget;
          // Never snap the reader back if they have gone up to re-read something.
          setPinned(element.scrollHeight - element.scrollTop - element.clientHeight < 72);
        }}
        className="h-full overflow-y-auto overflow-x-hidden px-6 py-5"
        role="log"
        aria-live="polite"
        aria-label="Meeting minutes"
      >
        {transcript.length === 0 ? (
          <p className="text-[14px] text-[var(--ink-secondary)]">
            The minutes fill in as the board speaks.
          </p>
        ) : null}

        {transcript.map((event) => {
          if (event.kind === "system") {
            if (event.speakerId === "secretary") {
              return (
                <section
                  key={event.id}
                  className="minutes-entry border-y border-[var(--rule)] bg-[var(--soft-fill)] px-4 py-3.5"
                >
                  <h3 className="text-[13px] font-medium">Where the board stands</h3>
                  <p className="mt-1.5 text-[14px] leading-[1.5]">{event.text}</p>
                </section>
              );
            }
            return (
              <p
                key={event.id}
                className="minutes-entry text-[13px] leading-[1.45] text-[var(--ink-secondary)]"
              >
                {event.text}
              </p>
            );
          }

          const isChair = event.speakerId === "chair";
          const isGuest = event.speakerId === "guest";
          const member = members.find((entry) => entry.slug === event.speakerId);
          const initials = isChair
            ? "YOU"
            : member?.initials ?? initialsFor(event.speakerName);
          const accent = isChair ? "var(--human)" : isGuest ? "var(--guest)" : undefined;

          return (
            <article key={event.id} className="minutes-entry flex gap-3">
              {accent ? <span className="accent-rule" style={{ background: accent }} /> : null}
              <Portrait
                initials={initials}
                slug={member?.portrait ? member.slug : undefined}
                size="xs"
                variant={isGuest ? "guest" : "member"}
                label={event.speakerName}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[14px] font-medium leading-tight">{event.speakerName}</span>
                  {isGuest ? (
                    <span className="operational text-[var(--guest)]">Guest agent</span>
                  ) : null}
                  {event.addressedTo ? (
                    <span className="text-[12.5px] text-[var(--ink-secondary)]">
                      to {event.addressedTo}
                    </span>
                  ) : null}
                  {event.reaction ? (
                    <span className="text-[12.5px] text-[var(--ink-secondary)]">
                      {REACTION[event.reaction]}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[15px] leading-[1.55]">{event.text}</p>
              </div>
            </article>
          );
        })}
      </div>

      {!pinned ? (
        <button
          type="button"
          onClick={jumpToLatest}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-[var(--radius-control)] border border-[var(--rule)] bg-[var(--paper-sheet)] px-3 py-1.5 text-[12.5px] shadow-sm"
        >
          Jump to latest
        </button>
      ) : null}
    </div>
  );
}
