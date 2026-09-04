"use client";

import { useState } from "react";
import { Portrait } from "./LetterMark";
import type { MeetingSession, MeetingState } from "@/lib/session";

/**
 * Paper mode, 4/8 for continuity with selection. The decision sheet is the dominant object:
 * an open working surface to think on, not a textarea inside a card.
 */
export function BriefBoard({ session, state }: { session: MeetingSession; state: MeetingState }) {
  const [starting, setStarting] = useState(false);
  const ready = session.canStart();

  return (
    <main className="mx-auto grid w-full max-w-[1360px] grid-cols-12 gap-6 px-8 py-10 lg:px-12">
      <section className="col-span-12 lg:col-span-4">
        <div className="lg:sticky lg:top-10">
          <button
            type="button"
            onClick={() => session.goToSelect()}
            className="text-[13px] text-[var(--ink-secondary)] hover:text-[var(--ink)]"
          >
            Change board
          </button>

          <h2 className="mt-6 text-[13px] font-medium">Your board</h2>
          <ul className="mt-4 border-t border-[var(--rule)]">
            {state.selected.map((slug) => {
              const member = session.catalog.find((entry) => entry.slug === slug)!;
              return (
                <li
                  key={slug}
                  className="flex items-center gap-3 border-b border-[var(--rule)] py-3"
                >
                  <Portrait initials={member.initials} slug={member.portrait ? member.slug : undefined} size="sm" label={member.name} />
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium leading-tight">
                      {member.name}
                    </span>
                    <span className="block truncate text-[12px] leading-tight text-[var(--ink-secondary)]">
                      {member.role}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="col-span-12 lg:col-span-8">
        <h1 className="editorial text-[clamp(32px,3.4vw,46px)] leading-[1.02] tracking-[-0.02em]">
          What decision are you trying to make?
        </h1>

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
          <p className="max-w-[62ch] text-[15px] leading-[1.5] text-[var(--ink-secondary)]">
            Give them the context you would give a real board: the goal, the numbers, the
            constraints, and what feels difficult. Links stay as plain text.
          </p>
          <button
            type="button"
            onClick={() => session.useExampleDecision()}
            className="shrink-0 text-[13px] text-[var(--ink-secondary)] underline decoration-[var(--rule)] underline-offset-4 hover:text-[var(--ink)]"
          >
            Use the pricing decision
          </button>
        </div>

        <label className="mt-6 block">
          <span className="sr-only">Your decision brief</span>
          <textarea
            value={state.briefing}
            onChange={(event) => session.setBriefing(event.target.value)}
            rows={14}
            placeholder="Describe the decision, what has led you here, and what the board should challenge."
            className="editorial w-full resize-y border-t border-[var(--rule)] bg-transparent py-6 text-[19px] leading-[1.62] outline-none placeholder:text-[var(--ink-secondary)] focus:border-[var(--ink-secondary)]"
          />
        </label>

        <div className="mt-2 flex items-center justify-end border-t border-[var(--rule)] pt-6">
          <button
            type="button"
            disabled={!ready || starting}
            onClick={() => {
              setStarting(true);
              void session.startMeeting();
            }}
            className="btn-primary"
          >
            {starting ? "Convening the board" : "Start board meeting"}
          </button>
        </div>
      </section>
    </main>
  );
}
