"use client";

import { useCallback, useRef, useState } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import { startNewMeeting } from "@/lib/meeting/room-client";
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
  const chair = session.isChair();

  const insertMention = useCallback(
    (mention: string) => {
      if (!chair) return;
      setDraft((current) => {
        const token = `@${mention} `;
        if (current.includes(token.trim())) return current;
        return current.length === 0 || current.endsWith(" ") ? current + token : `${current} ${token}`;
      });
      session.setChairComposing(true);
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [chair, session],
  );

  const live = state.phase === "forming" || state.phase === "discussion";
  const closing = state.phase === "closing";
  const readoutFailed = closing && state.readoutStatus === "failed";
  const forming = state.phase === "forming";
  const contributions = state.transcript.filter((e) => e.kind === "message").length;

  return (
    <div className="relative flex h-[var(--app-height,100dvh)] min-h-0 animate-screen-in flex-col overflow-hidden bg-canvas text-ink">
      <div className="flex h-[52px] shrink-0 items-center justify-between gap-6 px-5">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
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
                <span className="pill material h-9 animate-rise-in px-3.5 text-[12px] text-ink-2 shadow-[var(--shadow-card)]">
                  <Dots />
                  Members are forming their opening positions
                </span>
              ) : null}
            </div>
            <div className="pointer-events-auto">
              <GuestSeat guest={state.guest} canInvite={live && chair} onInvite={() => session.openInvitePanel()} />
            </div>
          </div>
        </section>

        <aside className="card flex min-h-0 flex-col overflow-hidden">
          <div className="material relative z-10 flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[13px] font-semibold text-ink">Minutes</h2>
            <p className="text-[12px] text-muted tabular-nums">{contributions} contributions</p>
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
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-40 -translate-x-1/2">
          <p
            key={state.notice.id}
            role="status"
            className="animate-rise-in rounded-lg border border-ink/10 bg-ink px-4 py-2.5 text-[13px] text-surface shadow-[var(--shadow-float)]"
          >
            {state.notice.text}
          </p>
        </div>
      ) : null}

      {closing ? (
        <div className="absolute inset-0 z-30 flex animate-fade-in items-center justify-center bg-canvas/60 backdrop-blur-[6px]">
          <div className="card max-w-[440px] animate-materialize px-8 py-8 text-center shadow-[var(--shadow-float)]">
            {readoutFailed ? (
              <>
                <p className="font-display text-[24px] leading-snug font-semibold text-ink">
                  The executive memo could not be generated.
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  The minutes remain available in this shared room for 24 hours. Start a new meeting when you are ready.
                </p>
                <Button variant="primary" className="mt-5" onClick={() => startNewMeeting(session)}>
                  Start a new meeting
                </Button>
              </>
            ) : (
              <>
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft">
                  <Dots />
                </span>
                <p className="mt-4 font-display text-[24px] leading-snug font-semibold text-ink">
                  Collecting closing comments
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
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
