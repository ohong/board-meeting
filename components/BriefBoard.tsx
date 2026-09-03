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
    <main className="flex-1 px-10 py-8 max-w-[1100px] mx-auto w-full">
      <div className="text-[11px] tracking-[0.22em] uppercase text-[var(--brass)]">The Board</div>
      <h1 className="text-[40px] leading-[1.05] mt-2 font-semibold tracking-[-0.03em]">
        Brief your board
      </h1>
      <p className="mt-3 text-[var(--muted)] max-w-2xl">
        One decision. As much context as you want. Links stay plain text; the table will not fetch them.
      </p>

      <div className="flex flex-wrap gap-3 mt-6">
        {state.selected.map((slug) => {
          const m = getMember(slug)!;
          return (
            <div key={slug} className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <LetterMark initials={m.initials} size="sm" />
              <span>{m.name}</span>
            </div>
          );
        })}
      </div>

      <label className="block mt-8">
        <span className="block text-sm mb-2">What decision are you trying to make?</span>
        <textarea
          value={state.briefing}
          onChange={(e) => session.setBriefing(e.target.value)}
          rows={12}
          className="w-full paper-card rounded-[2px] p-6 text-[17px] leading-relaxed outline-none min-h-[280px]"
        />
      </label>

      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={() => session.useExampleDecision()}
          className="text-[var(--brass)] text-sm font-medium"
        >
          Use example decision
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={() => void session.startMeeting()}
          className="bg-[var(--brass)] text-[oklch(18%_0.03_55)] font-semibold px-5 py-3 rounded-[4px] disabled:opacity-40"
        >
          Start Board Meeting
        </button>
      </div>
    </main>
  );
}
