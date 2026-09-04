"use client";

import { useMeetingState, useSession } from "@/lib/meeting/context";
import { MIN_BOARD_SIZE } from "@/lib/meeting/types";
import { MAX_BRIEFING_CHARACTERS } from "@/lib/meeting/session";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon, SparkleIcon } from "@/components/ui/icons";
import { Portrait } from "@/components/ui/portrait";
import { Eyebrow, Notice, PageShell } from "@/components/ui/shell";

export function BriefScreen() {
  const session = useSession();
  const state = useMeetingState();
  const ready = session.canStart();
  const chars = state.briefing.trim().length;
  const nearLimit = chars > MAX_BRIEFING_CHARACTERS * 0.9;

  return (
    <PageShell step={1} width={1000} hero={false}>
      <section className="card overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-line px-7 pt-6 pb-5">
          <div>
            <h2 className="font-display text-[24px] leading-tight font-semibold">Brief the Board</h2>
            <p className="mt-1 text-[13px] text-muted">
              One decision, plus the background, constraints, and numbers that matter.
            </p>
          </div>
          <span className="pill mt-1 shrink-0 text-muted">Step 1 of 3</span>
        </div>

        <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="px-7 pt-5 pb-6">
            <div className="flex items-center justify-between gap-3">
              <Eyebrow>The decision</Eyebrow>
              <button
                type="button"
                onClick={() => session.useExampleBriefing()}
                className="pill press h-7 gap-1.5 text-[12px] font-semibold text-accent-deep transition-[background-color,border-color,transform] duration-200 ease-out hover:border-accent-line hover:bg-accent-soft"
              >
                <SparkleIcon size={14} />
                Use example decision
              </button>
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Decision briefing</span>
              <textarea
                value={state.briefing}
                onChange={(e) => session.setBriefing(e.target.value)}
                maxLength={MAX_BRIEFING_CHARACTERS}
                rows={13}
                autoFocus
                placeholder="Should we eliminate our free tier? Here is the situation…"
                className="board-scrollbar w-full resize-y rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-[14px] leading-[1.65] text-ink outline-none transition-[background-color,border-color,box-shadow] duration-200 ease-out placeholder:text-faint focus:border-accent-line focus:bg-surface focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
              />
            </label>
            <p
              className={`mt-2 text-right text-[12px] tabular-nums transition-colors duration-300 ${
                nearLimit ? "text-dissent" : "text-faint"
              }`}
            >
              {chars.toLocaleString()} / {MAX_BRIEFING_CHARACTERS.toLocaleString()} characters
            </p>

            {state.notice ? (
              <div className="mt-3">
                <Notice text={state.notice.text} />
              </div>
            ) : null}
          </div>

          <aside className="border-t border-line bg-surface-2/50 px-6 pt-5 pb-6 md:border-t-0 md:border-l">
            <div className="flex items-baseline justify-between">
              <Eyebrow>Your board</Eyebrow>
              <span className="text-[12px] text-muted tabular-nums">{state.board.length} seated</span>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {state.board.map((persona, i) => (
                <li
                  key={persona.slug}
                  className="group flex animate-rise-in items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <Portrait src={persona.portrait} alt="" size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] leading-tight font-semibold text-ink">
                      {persona.name}
                    </span>
                    <span className="block truncate text-[12px] text-muted">{persona.company}</span>
                  </span>
                  <span className="sr-only">Seat {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => session.toggleMember(persona)}
                    aria-label={`Remove ${persona.name} from the board`}
                    title="Remove from board"
                    className="press flex h-7 w-7 items-center justify-center rounded-lg text-faint transition-[background-color,color,transform] duration-200 ease-out hover:bg-dissent-soft hover:text-dissent"
                  >
                    <CloseIcon size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => session.backToSelection()}
              className="press mt-3 w-full rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-[12px] font-semibold text-ink-2 transition-[color,border-color,transform] duration-200 ease-out hover:border-accent hover:text-accent-deep"
            >
              Change the board
            </button>
          </aside>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line bg-surface px-7 py-4">
          <Button variant="ghost" onClick={() => session.backToSelection()}>
            <ArrowLeftIcon size={14} />
            Back
          </Button>
          <div className="flex items-center gap-4">
            {!ready ? (
              <span className="hidden text-[12px] text-muted sm:inline">
                {state.board.length < MIN_BOARD_SIZE
                  ? `Seat at least ${MIN_BOARD_SIZE} advisers first.`
                  : "Write the decision you want them to argue about."}
              </span>
            ) : null}
            <Button variant="primary" size="lg" disabled={!ready} onClick={() => session.startMeeting()}>
              Start Board Meeting
              <ArrowRightIcon size={14} />
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
