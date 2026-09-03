"use client";

import { LetterMark } from "./LetterMark";
import type { MeetingSession, MeetingState } from "@/lib/session";

export function SelectBoard({
  session,
  state,
}: {
  session: MeetingSession;
  state: MeetingState;
}) {
  const catalog = session.visibleCatalog();
  const ready = state.selected.length >= 3 && state.selected.length <= 6;

  return (
    <main className="flex-1 px-10 py-8 max-w-[1320px] mx-auto w-full">
      <header className="flex items-end justify-between gap-8 mb-8">
        <div>
          <div className="text-[11px] tracking-[0.22em] uppercase text-[var(--brass)]">The Board</div>
          <h1 className="text-[40px] leading-[1.05] mt-2 font-semibold tracking-[-0.03em]">
            Choose your board
          </h1>
          <p className="mt-3 text-[var(--muted)] max-w-xl">
            Convene three to six advisers to pressure-test a consequential decision. Every seat is a
            distinct mind, not a costume on one model.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-[var(--muted)]">{state.selected.length} of 6 seated</div>
          <button
            type="button"
            disabled={!ready}
            onClick={() => session.goToBrief()}
            className="mt-3 bg-[var(--brass)] text-[oklch(18%_0.03_55)] font-semibold px-5 py-3 rounded-[4px] disabled:opacity-40"
          >
            Continue to briefing
          </button>
        </div>
      </header>

      <label className="block mb-6">
        <span className="sr-only">Search the roster</span>
        <input
          value={state.search}
          onChange={(e) => session.setSearch(e.target.value)}
          placeholder="Search by name or role — try DHH, Ek, Lulu"
          className="w-full bg-[var(--surface)] border border-[oklch(50%_0.04_70_/_0.35)] rounded-md px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--brass)]"
        />
      </label>

      {state.selectionMessage ? (
        <p className="mb-4 text-[var(--brass)] text-sm">{state.selectionMessage}</p>
      ) : null}

      <div className="grid grid-cols-3 gap-4">
        {catalog.map((member) => {
          const selected = state.selected.includes(member.slug);
          return (
            <button
              type="button"
              key={member.slug}
              onClick={() => session.toggleMember(member.slug)}
              className={`text-left p-4 rounded-md border transition ${
                selected
                  ? "border-[var(--brass)] bg-[oklch(24%_0.03_55)]"
                  : "border-[oklch(50%_0.04_70_/_0.25)] bg-[var(--surface)] hover:border-[var(--brass-dim)]"
              }`}
            >
              <div className="flex items-center gap-4">
                <LetterMark initials={member.initials} size="md" />
                <div>
                  <div className="font-semibold">{member.name}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">{member.role}</div>
                  {selected ? (
                    <div className="text-[10px] tracking-[0.14em] uppercase text-[var(--brass)] mt-2">
                      Seated
                    </div>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
