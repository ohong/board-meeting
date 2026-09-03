"use client";

import type { MessageEntry } from "@/lib/meeting/types";
import { SPEECH_CARD_W } from "./seat-layout";

const MAX_CHARS = 128;

/** Keep the card a fixed shape by showing only the live tail of a long turn. */
function tail(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_CHARS) return { text, truncated: false };
  const cut = text.slice(text.length - MAX_CHARS);
  const space = cut.indexOf(" ");
  return { text: space > 0 ? cut.slice(space + 1) : cut, truncated: true };
}

export function SpeechCard({ entry }: { entry: MessageEntry }) {
  const { text, truncated } = tail(entry.text);
  return (
    <div style={{ width: SPEECH_CARD_W }}
      className="animate-rise-in rounded-[2px] bg-cream px-4 pt-3.5 pb-3 text-paper-ink shadow-[0_14px_30px_oklch(10%_0.02_55/0.45)]">
      <p className="line-clamp-4 font-display text-[15px] leading-[1.35] font-medium">
        {truncated ? <span className="text-paper-muted">&hellip; </span> : null}
        {text || <span className="text-paper-muted">&hellip;</span>}
        {entry.streaming ? (
          <span aria-hidden className="ml-0.5 inline-block animate-caret font-sans">
            ▌
          </span>
        ) : null}
      </p>
      <p className="mt-2 text-[10px] tracking-[0.08em] text-paper-muted uppercase">
        {entry.speakerName}
        {entry.interruption ? ", interrupting" : null}
        {!entry.interruption && entry.addressedName ? `, to ${entry.addressedName}` : null}
      </p>
    </div>
  );
}
