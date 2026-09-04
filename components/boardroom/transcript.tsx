"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMeetingState } from "@/lib/meeting/context";
import { Portrait } from "@/components/ui/portrait";
import { ArrowDownIcon, ChairIcon } from "@/components/ui/icons";
import type { EventEntry, MessageEntry, SynthesisEntry } from "@/lib/meeting/types";

function Caret() {
  return (
    <span aria-hidden className="ml-0.5 inline-block animate-caret text-accent">
      ▍
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function Avatar({ entry, portrait }: { entry: MessageEntry; portrait: string | null }) {
  if (entry.speakerRole === "chair") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
        <ChairIcon size={14} />
      </span>
    );
  }
  if (entry.speakerRole === "guest") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-live-soft text-[12px] font-bold text-ink-2">
        {initials(entry.speakerName)}
      </span>
    );
  }
  return portrait ? (
    <Portrait src={portrait} alt="" size={28} />
  ) : (
    <span className="h-7 w-7 shrink-0 rounded-full bg-surface-3" />
  );
}

function Message({ entry, portrait }: { entry: MessageEntry; portrait: string | null }) {
  const isChair = entry.speakerRole === "chair";
  const isGuest = entry.speakerRole === "guest";

  return (
    <li
      className={`animate-rise-in relative flex gap-2.5 rounded-lg py-2.5 pr-3 ${
        isChair
          ? "bg-accent-soft/70 pl-3"
          : isGuest
            ? "bg-live-soft/70 pl-3"
            : entry.interruption
              ? "border-l-2 border-dissent/40 bg-surface-2/70 pl-2.5"
              : "pl-3"
      }`}
    >
      <Avatar entry={entry} portrait={portrait} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[12px] leading-tight">
          <span className="font-semibold text-ink">{entry.speakerName}</span>
          {isGuest ? (
            <span className="rounded-full bg-live/15 px-1.5 py-px text-[12px] font-semibold text-ink-2">
              Your agent
            </span>
          ) : null}
          {entry.addressedName ? <span className="text-muted">to {entry.addressedName}</span> : null}
          {entry.interruption ? <span className="font-semibold text-dissent">Interrupting</span> : null}
          {entry.failed ? <span className="font-semibold text-dissent">Connection lost</span> : null}
        </p>
        <p className="mt-1 text-[13px] leading-[1.55] text-ink-2">
          {entry.text}
          {entry.streaming ? <Caret /> : null}
        </p>
      </div>
    </li>
  );
}

function SystemRow({ entry }: { entry: EventEntry }) {
  return (
    <li className="flex items-center gap-3 px-2 py-2 text-[12px] text-muted">
      <span aria-hidden className="h-px flex-1 bg-line" />
      <span className="max-w-[80%] text-center leading-snug">{entry.text}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </li>
  );
}

function Synthesis({ entry }: { entry: SynthesisEntry }) {
  return (
    <li className="animate-rise-in rounded-lg border border-accent-line bg-accent-soft/40 px-3.5 py-3">
      <p className="flex flex-wrap items-baseline gap-x-2 text-[12px]">
        <span className="font-semibold tracking-[0.08em] text-accent-deep uppercase">Interim synthesis</span>
        <span className="text-muted">requested by {entry.requestedByName}</span>
      </p>
      <p className="mt-1.5 text-[14px] leading-[1.5] text-ink">
        {entry.text}
        {entry.streaming ? <Caret /> : null}
      </p>
      {entry.failed ? <p className="mt-1.5 text-[12px] font-semibold text-dissent">Synthesis incomplete</p> : null}
    </li>
  );
}

export function Transcript() {
  const state = useMeetingState();
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  // Mirrored into state only when it flips, so scrolling doesn't re-render on
  // every wheel event.
  const [pinned, setPinned] = useState(true);

  const portraits = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of Object.values(state.members)) map[m.id] = m.persona.portrait;
    return map;
  }, [state.members]);

  // Auto-follow the newest entry only while the reader is already at the bottom.
  const last = state.transcript.at(-1);
  const lastId = last?.id ?? "";
  const lastText = last && last.kind !== "event" ? last.text : "";

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !nearBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [lastId, lastText, state.transcript.length]);

  const toLatest = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottom.current = true;
    setPinned(true);
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const near = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
          nearBottom.current = near;
          setPinned((was) => (was === near ? was : near));
        }}
        className="board-scrollbar scroll-edges h-full overflow-y-auto px-2.5 py-3"
      >
        <ol className="flex flex-col gap-1">
          {state.transcript.map((entry) =>
            entry.kind === "message" ? (
              <Message key={entry.id} entry={entry} portrait={portraits[entry.speakerId] ?? null} />
            ) : entry.kind === "synthesis" ? (
              <Synthesis key={entry.id} entry={entry} />
            ) : (
              <SystemRow key={entry.id} entry={entry} />
            ),
          )}
        </ol>
      </div>

      {/* Reading back shouldn't cost you the live edge. */}
      {pinned ? null : (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={toLatest}
            className="press flex h-8 animate-rise-in items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[12px] font-semibold text-ink-2 shadow-[var(--shadow-float)] transition-[color,border-color,transform] duration-200 ease-out hover:border-line-strong hover:text-ink"
          >
            <ArrowDownIcon size={14} />
            Jump to latest
          </button>
        </div>
      )}
    </div>
  );
}
