"use client";

import { Portrait } from "@/components/ui/portrait";
import type { MessageEntry } from "@/lib/meeting/types";
import { SPEECH_CARD_W } from "./seat-layout";

const MAX_CHARS = 150;

/** Keep the card a fixed shape: show the opening of the turn, the transcript has the rest. */
function head(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_CHARS) return { text, truncated: false };
  const cut = text.slice(0, MAX_CHARS);
  const space = cut.lastIndexOf(" ");
  return { text: space > MAX_CHARS * 0.6 ? cut.slice(0, space) : cut, truncated: true };
}

export function SpeechCard({ entry, portrait }: { entry: MessageEntry; portrait: string | null }) {
  const { text, truncated } = head(entry.text);
  return (
    <div
      style={{ width: SPEECH_CARD_W }}
      className="animate-rise-in rounded-2xl border border-line bg-surface px-3.5 pt-3 pb-3 text-left shadow-[var(--shadow-float)]"
    >
      <p className="flex items-center gap-2 text-[11.5px] font-medium text-muted">
        {portrait ? (
          <Portrait src={portrait} alt="" size={20} />
        ) : (
          <span aria-hidden className="h-5 w-5 rounded-full bg-accent-soft" />
        )}
        <span className="truncate">
          {entry.speakerName}
          {entry.interruption ? <span className="text-dissent"> · interrupting</span> : null}
          {!entry.interruption && entry.addressedName ? (
            <span className="text-faint"> · to {entry.addressedName}</span>
          ) : null}
        </span>
      </p>
      <p className="mt-2 text-[13.5px] leading-[1.45] text-ink">
        {text || <span className="text-faint">&hellip;</span>}
        {truncated ? <span className="text-faint">&hellip;</span> : null}
        {entry.streaming ? (
          <span aria-hidden className="ml-0.5 inline-block animate-caret text-accent">
            ▍
          </span>
        ) : null}
      </p>
    </div>
  );
}
