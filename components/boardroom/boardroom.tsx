"use client";

import { useCallback, useRef, useState } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/shell";
import { BoardroomHeader } from "./boardroom-header";
import { Composer } from "./composer";
import { GuestSeat } from "./guest-seat";
import { InviteSlot } from "./invite-slot";
import { TableScene } from "./table-scene";
import { Transcript } from "./transcript";

function Dots() {
  return (
    <span aria-hidden className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-dots rounded-full bg-accent"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

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

  const live = state.phase === "forming" || state.phase === "discussion";
  const closing = state.phase === "closing";
  const readoutFailed = closing && state.readoutStatus === "failed";
  const forming = state.phase === "forming";

  return (
    <div className="relative flex h-[var(--app-height,100dvh)] min-h-0 flex-col overflow-hidden bg-canvas text-ink">
      <div className="flex h-[52px] shrink-0 items-center justify-between gap-6 px-5">
        <p className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink">
          The Best Board Meeting You&rsquo;ve Ever Had.
        </p>
        <Stepper current={2} compact />
        <span aria-hidden className="hidden w-[260px] lg:block" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(360px,400px)] gap-3 px-4 pb-4">
        <section className="card relative flex min-h-0 flex-col overflow-hidden">
          <BoardroomHeader />
          <TableScene onMention={insertMention} />

          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
            <div className="pointer-events-auto">
              {forming ? (
                <span className="pill h-9 px-3.5 text-[12.5px] text-ink-2">
                  <Dots />
                  Members are forming their opening positions
                </span>
              ) : null}
            </div>
            <div className="pointer-events-auto">
              <GuestSeat guest={state.guest} canInvite={live} onInvite={() => session.openInvitePanel()} />
            </div>
          </div>
        </section>

        <aside className="card flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[13.5px] font-semibold text-ink">Minutes</h2>
            <p className="text-[12px] text-muted tabular-nums">
              {state.transcript.filter((e) => e.kind === "message").length} contributions
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
          className="pointer-events-none absolute bottom-6 left-1/2 z-40 -translate-x-1/2 animate-rise-in rounded-xl border border-line bg-ink px-4 py-2.5 text-[13px] text-surface shadow-[var(--shadow-float)]"
        >
          {state.notice.text}
        </p>
      ) : null}

      {closing ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-canvas/70 backdrop-blur-sm">
          <div className="card max-w-[440px] px-8 py-8 text-center shadow-[var(--shadow-float)]">
            {readoutFailed ? (
              <>
                <p className="font-display text-[22px] leading-snug font-semibold text-ink">
                  The executive memo could not be generated.
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                  The minutes are still complete. Nothing was saved, so a new meeting starts clean.
                </p>
                <Button variant="primary" className="mt-5" onClick={() => session.reset()}>
                  Start a new meeting
                </Button>
              </>
            ) : (
              <>
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft">
                  <Dots />
                </span>
                <p className="mt-4 font-display text-[21px] leading-snug font-semibold text-ink">
                  Collecting closing comments
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                  Each member gives a final word, then the secretary writes your executive memo.
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
