"use client";

import { useCallback, useRef, useState } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import { BoardroomHeader } from "./boardroom-header";
import { Composer } from "./composer";
import { InviteSlot } from "./invite-slot";
import { TableScene } from "./table-scene";
import { Transcript } from "./transcript";

export function Boardroom() {
  const session = useSession();
  const state = useMeetingState();
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMention = useCallback(
    (mention: string) => {
      setDraft((current) => {
        const token = `@${mention} `;
        if (current.includes(token.trim())) return current;
        return current.length === 0 || current.endsWith(" ") ? current + token : `${current} ${token}`;
      });
      session.setChairComposing(true);
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [session],
  );

  const closing = state.phase === "closing";
  const readoutFailed = closing && state.readoutStatus === "failed";

  return (
    <div className="relative flex h-screen min-h-0 flex-col overflow-hidden bg-room text-ink">
      <BoardroomHeader />

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,3fr)_minmax(380px,2fr)]">
        <TableScene onMention={insertMention} />

        <aside className="flex min-h-0 flex-col border-l border-room-2 bg-room-2/25">
          <div className="flex items-baseline justify-between border-b border-room-2 px-4 py-2.5">
            <h2 className="text-[10.5px] tracking-[0.18em] text-brass-dim uppercase">The minutes</h2>
            <p className="max-w-[60%] truncate text-[11px] text-faint" title={state.briefing}>
              {state.briefing.split("\n")[0]}
            </p>
          </div>
          <Transcript />
          <Composer
            draft={draft}
            setDraft={setDraft}
            textareaRef={textareaRef}
            onInsertMention={insertMention}
          />
        </aside>
      </div>

      {state.notice ? (
        <p
          role="status"
          className="pointer-events-none absolute bottom-6 left-1/2 z-40 -translate-x-1/2 animate-rise-in rounded-[3px] border border-dissent/45 bg-room-2 px-3.5 py-2 text-[12.5px] text-ink shadow-lg"
        >
          {state.notice.text}
        </p>
      ) : null}

      {closing ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-room/78 backdrop-blur-[2px]">
          <div className="max-w-[440px] px-8 text-center">
            {readoutFailed ? (
              <>
                <p className="font-display text-[22px] leading-snug font-semibold text-ink">
                  The executive readout could not be generated.
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                  The transcript above is still complete. Nothing was saved, so a new meeting starts clean.
                </p>
                <button
                  type="button"
                  onClick={() => session.reset()}
                  className="mt-5 rounded-[3px] bg-brass px-4 py-2.5 text-[13px] font-semibold text-walnut-deep"
                >
                  Start a new meeting
                </button>
              </>
            ) : (
              <>
                <span
                  aria-hidden
                  className="mx-auto mb-4 block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brass shadow-[0_0_20px_2px_var(--color-brass)]"
                />
                <p className="animate-pulse-soft font-display text-[20px] leading-snug font-semibold text-ink">
                  Collecting closing comments and preparing the executive readout&hellip;
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}

      <InviteSlot />
    </div>
  );
}
