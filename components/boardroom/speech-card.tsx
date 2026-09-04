"use client";

import { Portrait } from "@/components/ui/portrait";
import type { MessageEntry } from "@/lib/meeting/types";
import { SPEECH_CARD_MAX_H, SPEECH_CARD_W } from "./seat-layout";

const MAX_CHARS = 132;

/** Keep the card a fixed shape: show the opening of the turn, the transcript has the rest. */
function head(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_CHARS) return { text, truncated: false };
  const cut = text.slice(0, MAX_CHARS);
  const space = cut.lastIndexOf(" ");
  return { text: space > MAX_CHARS * 0.6 ? cut.slice(0, space) : cut, truncated: true };
}

/**
 * The live turn, drawn on the table. Its parent owns the position; this element
 * owns only whether the card is present, as a transition rather than a keyframe
 * so a fast handover retargets from wherever the fade currently is.
 */
export function SpeechCard({
  entry,
  portrait,
  visible,
}: {
  entry: MessageEntry;
  portrait: string | null;
  visible: boolean;
}) {
  const { text, truncated } = head(entry.text);

  return (
    <div
      aria-hidden={!visible}
      style={{
        width: SPEECH_CARD_W,
        maxHeight: SPEECH_CARD_MAX_H,
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : `scale(var(--motion-scale-in))`,
        transition: visible
          ? "opacity 300ms var(--ease-out), transform 300ms var(--ease-out)"
          : "opacity 220ms var(--ease-in-out), transform 220ms var(--ease-in-out)",
      }}
      className="overflow-hidden rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-left shadow-[var(--shadow-float)]"
    >
      <p className="flex items-center gap-2 text-[12px] font-medium text-muted">
        {portrait ? (
          <Portrait src={portrait} alt="" size={20} />
        ) : (
          <span aria-hidden className="h-5 w-5 rounded-full bg-accent-soft" />
        )}
        <span className="truncate">
          <span className="font-semibold text-ink-2">{entry.speakerName}</span>
          {entry.interruption ? <span className="text-dissent"> · interrupting</span> : null}
          {!entry.interruption && entry.addressedName ? (
            <span className="text-faint"> · to {entry.addressedName}</span>
          ) : null}
        </span>
      </p>
      <p className="mt-1.5 line-clamp-4 text-[13px] leading-[1.45] text-ink">
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
