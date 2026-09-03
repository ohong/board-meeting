"use client";

import { LetterMark } from "./LetterMark";
import { getMember } from "@/lib/catalog";
import type { MeetingSession, MeetingState } from "@/lib/session";

export function BriefBoard({
  session,
  state,
}: {
  session: MeetingSession;
  state: MeetingState;
}) {
  const ready = session.canStart();
  return (
    <main className="flex-1 px-8 py-10 w-full flex flex-col items-center">
      <div className="masthead mb-8 self-start max-w-[920px] w-full mx-auto">The Board</div>

      <div className="w-full max-w-[820px]">
        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          {state.selected.map((slug) => {
            const m = getMember(slug)!;
            return (
              <div
                key={slug}
                className="flex items-center gap-2 text-sm text-[var(--muted)] border border-[oklch(50%_0.04_70_/_0.3)] px-3 py-1.5"
              >
                <LetterMark initials={m.initials} size="sm" />
                <span className="serif text-[var(--ink)]">{m.name}</span>
              </div>
            );
          })}
        </div>

        <div className="paper-card p-8 md:p-10 -rotate-[0.4deg]">
          <div className="label text-[var(--paper-muted)] mb-3">Memorandum to the board</div>
          <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.02em] text-[var(--paper-ink)] mb-2">
            Brief your board
          </h1>
          <p className="text-[14px] text-[var(--paper-muted)] mb-6 leading-relaxed">
            One decision. As much context as you want. Links stay plain text; the table will not fetch
            them.
          </p>
          <label className="block">
            <span className="block text-[11px] tracking-[0.16em] uppercase text-[var(--paper-muted)] mb-2">
              What decision are you trying to make?
            </span>
            <textarea
              value={state.briefing}
              onChange={(e) => session.setBriefing(e.target.value)}
              rows={12}
              className="w-full bg-transparent border border-[oklch(45%_0.03_55_/_0.25)] p-4 text-[17px] leading-relaxed outline-none min-h-[280px] text-[var(--paper-ink)] font-[family-name:var(--font-newsreader)] resize-y"
            />
          </label>
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => session.useExampleDecision()}
            className="text-[var(--brass)] text-sm font-medium tracking-wide"
          >
            Use example decision
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={() => void session.startMeeting()}
            className="btn-brass"
          >
            Start Board Meeting
          </button>
        </div>
      </div>
    </main>
  );
}
