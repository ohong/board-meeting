"use client";

import { LetterMark } from "./LetterMark";
import { MIN_BOARD, MAX_BOARD, type MeetingSession, type MeetingState } from "@/lib/session";

export function SelectBoard({ session, state }: { session: MeetingSession; state: MeetingState }) {
  const catalog = session.visibleCatalog();
  const seated = state.selected.length;
  const ready = seated >= MIN_BOARD && seated <= MAX_BOARD;

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-10 py-9">
      <header className="flex items-end justify-between gap-10 mb-7">
        <div>
          <div className="eyebrow">The Best Board Meeting You&rsquo;ve Ever Had</div>
          <h1 className="serif text-[42px] leading-[1.02] font-semibold tracking-[-0.03em] mt-2.5">
            Choose your board
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)] max-w-[54ch]">
            Seat three to six advisers, bring them one consequential decision, and let them argue it
            out in front of you. Every seat is a separate agent with its own sources and its own
            mind — not one model wearing six name badges.
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-[13px] text-[var(--muted)]">
            <strong className="text-[var(--ink)] text-[15px]">{seated}</strong> of {MAX_BOARD} seated
          </div>
          <div className="text-[11px] text-[var(--faint)] mt-0.5">
            {seated < MIN_BOARD ? `${MIN_BOARD - seated} more to open the room` : "Ready when you are"}
          </div>
          <button
            type="button"
            disabled={!ready}
            onClick={() => session.goToBrief()}
            className="btn-primary mt-3 px-5 py-2.5 text-[13.5px]"
          >
            Continue to briefing
          </button>
        </div>
      </header>

      <div className="flex items-center gap-4 mb-5">
        <label className="flex-1">
          <span className="sr-only">Search the roster</span>
          <input
            value={state.search}
            onChange={(event) => session.setSearch(event.target.value)}
            placeholder="Search the roster by name or role — try Ek, DHH, Lulu, Sequoia"
            className="field w-full px-4 py-3 text-[14px]"
          />
        </label>
        {state.selected.length ? (
          <div className="flex items-center gap-2">
            {state.selected.map((slug) => {
              const member = session.catalog.find((entry) => entry.slug === slug)!;
              return (
                <button
                  key={slug}
                  type="button"
                  title={`Remove ${member.name}`}
                  onClick={() => session.toggleMember(slug)}
                  className="btn-quiet px-2.5 py-1.5 text-[11.5px]"
                >
                  {member.name.split(" ")[0]} ✕
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {state.selectionMessage ? (
        <p className="mb-4 text-[13px] text-[var(--concern)]">{state.selectionMessage}</p>
      ) : null}

      {catalog.length === 0 ? (
        <p className="text-[14px] text-[var(--faint)]">
          Nobody on the roster matches &ldquo;{state.search}&rdquo;.
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-3.5">
        {catalog.map((member) => {
          const selected = state.selected.includes(member.slug);
          return (
            <button
              type="button"
              key={member.slug}
              aria-pressed={selected}
              onClick={() => session.toggleMember(member.slug)}
              className="text-left p-4 rounded-[8px] border transition"
              style={{
                borderColor: selected ? "var(--brass)" : "var(--hairline)",
                background: selected ? "oklch(26% 0.035 58)" : "oklch(20% 0.024 55)",
                boxShadow: selected ? "0 8px 22px oklch(8% 0.02 55 / 0.45)" : "none",
              }}
            >
              <div className="flex items-center gap-3.5">
                <LetterMark initials={member.initials} size="md" />
                <div className="min-w-0">
                  <div className="font-semibold text-[14px] leading-tight">{member.name}</div>
                  <div className="text-[11.5px] text-[var(--muted)] mt-1 leading-snug">{member.role}</div>
                </div>
                {selected ? (
                  <span className="ml-auto text-[9.5px] tracking-[0.16em] uppercase text-[var(--brass)]">
                    Seated
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
