"use client";

import { useEffect, useRef } from "react";
import { useMeetingState } from "@/lib/meeting/context";
import type { EventEntry, MessageEntry, SynthesisEntry, TranscriptEntry } from "@/lib/meeting/types";

function Caret() {
  return (
    <span aria-hidden className="ml-0.5 inline-block animate-caret text-brass">
      ▌
    </span>
  );
}

function Message({ entry }: { entry: MessageEntry }) {
  const isChair = entry.speakerRole === "chair";
  const isGuest = entry.speakerRole === "guest";

  return (
    <li
      className={`animate-rise-in rounded-[3px] px-3 py-2.5 ${
        isChair
          ? "border-l-2 border-brass bg-brass/8"
          : isGuest
            ? "border-l-2 border-live bg-live/8"
            : entry.interruption
              ? "border-l-2 border-dissent/70 bg-room-2/60"
              : "bg-room-2/45"
      }`}
    >
      <p className="flex flex-wrap items-baseline gap-x-2 text-[11px]">
        <span
          className={`font-semibold tracking-[0.06em] uppercase ${
            isChair ? "text-brass" : isGuest ? "text-live" : "text-ink"
          }`}
        >
          {entry.speakerName}
        </span>
        {isGuest ? (
          <span className="rounded-[2px] bg-live/20 px-1 text-[9px] tracking-[0.08em] text-live uppercase">
            External agent
          </span>
        ) : null}
        {entry.addressedName ? (
          <span className="text-faint">&rarr; {entry.addressedName}</span>
        ) : null}
        {entry.interruption ? (
          <span className="text-[10px] tracking-[0.08em] text-dissent uppercase">interrupting</span>
        ) : null}
        {entry.failed ? (
          <span className="text-[10px] tracking-[0.08em] text-dissent uppercase">connection lost</span>
        ) : null}
      </p>
      <p
        className={`mt-1.5 text-[13.5px] leading-[1.5] ${
          isChair ? "text-ink" : isGuest ? "text-ink" : "text-ink/90"
        }`}
      >
        {entry.text}
        {entry.streaming ? <Caret /> : null}
      </p>
    </li>
  );
}

function SystemRow({ entry }: { entry: EventEntry }) {
  return (
    <li className="flex items-baseline gap-2 px-3 py-1 text-[11px] text-faint">
      <span aria-hidden className="mt-[1px] h-px flex-none translate-y-[-3px] bg-room-3" style={{ width: 14 }} />
      <span className="leading-snug">{entry.text}</span>
    </li>
  );
}

function Synthesis({ entry }: { entry: SynthesisEntry }) {
  return (
    <li className="animate-rise-in rounded-[3px] border border-brass/25 bg-room-2/70 px-3 py-2.5">
      <p className="text-[10px] tracking-[0.1em] text-brass-dim uppercase">
        Secretary &middot; interim synthesis
        <span className="ml-2 normal-case text-faint tracking-normal">
          requested by {entry.requestedByName}
        </span>
      </p>
      <p className="mt-1.5 font-display text-[13.5px] leading-[1.5] text-ink/90">
        {entry.text}
        {entry.streaming ? <Caret /> : null}
      </p>
      {entry.failed ? (
        <p className="mt-1 text-[10px] tracking-[0.08em] text-dissent uppercase">Synthesis incomplete</p>
      ) : null}
    </li>
  );
}

function Row({ entry }: { entry: TranscriptEntry }) {
  if (entry.kind === "message") return <Message entry={entry} />;
  if (entry.kind === "synthesis") return <Synthesis entry={entry} />;
  return <SystemRow entry={entry} />;
}

export function Transcript() {
  const state = useMeetingState();
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);

  // Auto-follow the newest entry only while the reader is already at the bottom.
  const lastId = state.transcript.at(-1)?.id ?? "";
  const lastText =
    state.transcript.at(-1)?.kind === "event" ? "" : ((state.transcript.at(-1) as MessageEntry | undefined)?.text ?? "");

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !nearBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [lastId, lastText, state.transcript.length]);

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => {
        const el = e.currentTarget;
        nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
      }}
      className="board-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3"
    >
      <ol className="flex flex-col gap-2">
        {state.transcript.map((entry) => (
          <Row key={entry.id} entry={entry} />
        ))}
      </ol>
    </div>
  );
}
