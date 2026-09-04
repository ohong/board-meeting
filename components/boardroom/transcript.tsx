"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMeetingState } from "@/lib/meeting/context";
import { Portrait } from "@/components/ui/portrait";
import { ChairIcon } from "@/components/ui/icons";
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
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-live-soft text-[10px] font-bold text-ink-2">
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
      className={`animate-rise-in flex gap-2.5 rounded-xl px-3 py-2.5 ${
        isChair ? "bg-accent-soft/70" : isGuest ? "bg-live-soft/70" : entry.interruption ? "bg-surface-2/80" : ""
      }`}
    >
      <Avatar entry={entry} portrait={portrait} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[12px] leading-tight">
          <span className="font-semibold text-ink">{entry.speakerName}</span>
          {isGuest ? (
            <span className="rounded-full bg-live/15 px-1.5 py-px text-[10px] font-semibold text-ink-2">
              Your agent
            </span>
          ) : null}
          {entry.addressedName ? <span className="text-muted">to {entry.addressedName}</span> : null}
          {entry.interruption ? <span className="font-semibold text-dissent">Interrupting</span> : null}
          {entry.failed ? <span className="font-semibold text-dissent">Connection lost</span> : null}
        </p>
        <p className="mt-1 text-[13.5px] leading-[1.5] text-ink-2">
          {entry.text}
          {entry.streaming ? <Caret /> : null}
        </p>
      </div>
    </li>
  );
}

function SystemRow({ entry }: { entry: EventEntry }) {
  return (
    <li className="flex items-center gap-3 px-2 py-1.5 text-[11.5px] text-muted">
      <span aria-hidden className="h-px flex-1 bg-line" />
      <span className="max-w-[80%] text-center leading-snug">{entry.text}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </li>
  );
}

function Synthesis({ entry }: { entry: SynthesisEntry }) {
  return (
    <li className="animate-rise-in rounded-xl border border-accent-line bg-accent-soft/40 px-3.5 py-3">
      <p className="flex flex-wrap items-baseline gap-x-2 text-[11.5px]">
        <span className="font-semibold tracking-[0.08em] text-accent-deep uppercase">Interim synthesis</span>
        <span className="text-muted">requested by {entry.requestedByName}</span>
      </p>
      <p className="mt-1.5 font-display text-[14px] leading-[1.5] text-ink">
        {entry.text}
        {entry.streaming ? <Caret /> : null}
      </p>
      {entry.failed ? <p className="mt-1.5 text-[11px] font-semibold text-dissent">Synthesis incomplete</p> : null}
    </li>
  );
}

export function Transcript() {
  const state = useMeetingState();
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);

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

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => {
        const el = e.currentTarget;
        nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
      }}
      className="board-scrollbar min-h-0 flex-1 overflow-y-auto px-2.5 py-3"
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
  );
}

