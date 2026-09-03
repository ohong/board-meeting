"use client";

import { useState } from "react";
import { LetterMark } from "./LetterMark";
import type { MeetingSession, MeetingState } from "@/lib/session";

export function BriefBoard({ session, state }: { session: MeetingSession; state: MeetingState }) {
  const [starting, setStarting] = useState(false);
  const ready = session.canStart();

  return (
    <main className="flex-1 w-full max-w-[980px] mx-auto px-10 py-9">
      <button type="button" onClick={() => session.goToSelect()} className="text-[12px] text-[var(--muted)] hover:text-[var(--ink)]">
        ← Change the board
      </button>

      <div className="eyebrow mt-5">Step two</div>
      <h1 className="serif text-[42px] leading-[1.02] font-semibold tracking-[-0.03em] mt-2.5">
        Brief your board
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)] max-w-[58ch]">
        One decision, with as much context as you want to give — metrics, constraints, what you are
        afraid of. Links stay as plain text; nothing here is fetched.
      </p>

      <div className="flex flex-wrap items-center gap-4 mt-6">
        {state.selected.map((slug) => {
          const member = session.catalog.find((entry) => entry.slug === slug)!;
          return (
            <div key={slug} className="flex items-center gap-2.5">
              <LetterMark initials={member.initials} seed={member.slug} size="sm" />
              <div className="leading-tight">
                <div className="text-[12.5px] font-medium">{member.name}</div>
                <div className="text-[10.5px] text-[var(--faint)]">{member.role}</div>
              </div>
            </div>
          );
        })}
      </div>

      <label className="block mt-7">
        <span className="block text-[13px] mb-2 text-[var(--muted)]">
          What decision are you trying to make?
        </span>
        <textarea
          value={state.briefing}
          onChange={(event) => session.setBriefing(event.target.value)}
          rows={12}
          placeholder="Should we…? Here is the situation, the numbers, and what worries me."
          className="paper-card w-full rounded-[3px] p-6 text-[16px] leading-[1.65] outline-none min-h-[300px] resize-y"
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
        />
      </label>

      <div className="flex items-center justify-between mt-5">
        <button
          type="button"
          onClick={() => session.useExampleDecision()}
          className="btn-quiet px-3.5 py-2 text-[12.5px]"
        >
          Use example decision
        </button>
        <button
          type="button"
          disabled={!ready || starting}
          onClick={() => {
            setStarting(true);
            void session.startMeeting();
          }}
          className="btn-primary px-6 py-3 text-[14px]"
        >
          {starting ? "Convening the board" : "Start Board Meeting"}
        </button>
      </div>
    </main>
  );
}
