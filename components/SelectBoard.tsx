"use client";

import { Portrait } from "./LetterMark";
import { CATALOG_FROZEN_ON, frozenOnLabel } from "@/lib/catalog";
import { MAX_BOARD, MIN_BOARD, type MeetingSession, type MeetingState } from "@/lib/session";

/**
 * Paper mode, 4/8. The left field is the room being assembled — a miniature table whose
 * places fill as advisers are chosen — and the right is the library. Selecting someone
 * should feel like seating them, not like ticking a box.
 */
export function SelectBoard({ session, state }: { session: MeetingSession; state: MeetingState }) {
  const catalog = session.visibleCatalog();
  const seated = state.selected.length;
  const ready = seated >= MIN_BOARD;

  return (
    <main className="mx-auto grid w-full max-w-[1360px] grid-cols-12 gap-6 px-8 py-10 lg:px-12">
      <section className="col-span-12 lg:col-span-4">
        <div className="lg:sticky lg:top-10">
          <h1 className="editorial text-[clamp(38px,4.4vw,60px)] leading-[0.98] tracking-[-0.02em]">
            Who do you want in the room?
          </h1>
          <p className="mt-5 max-w-[46ch] text-[16px] leading-[1.5] text-[var(--ink-secondary)]">
            Choose three to six people whose judgment you want on the decision. Every seat is a
            separate agent with its own sources and its own mind.
          </p>

          <BoardPreview session={session} state={state} />

          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              disabled={!ready}
              onClick={() => session.goToBrief()}
              className="btn-primary"
            >
              Brief your board
            </button>
            <span className="text-[13px] text-[var(--ink-secondary)]">
              {seated < MIN_BOARD
                ? `${MIN_BOARD - seated} more to open the room`
                : "Ready when you are"}
            </span>
          </div>

          {state.selectionMessage ? (
            <p className="mt-4 text-[13px] text-[var(--human)]">{state.selectionMessage}</p>
          ) : null}

          <p className="mt-8 text-[12px] leading-[1.5] text-[var(--ink-secondary)]">
            Roster frozen {frozenOnLabel(CATALOG_FROZEN_ON)}. Every adviser is a guest from David
            Senra&rsquo;s interview podcast.
          </p>
        </div>
      </section>

      <section className="col-span-12 lg:col-span-8">
        <label className="block">
          <span className="sr-only">Search the roster</span>
          <input
            value={state.search}
            onChange={(event) => session.setSearch(event.target.value)}
            placeholder="Find a founder, investor, or operator"
            className="field w-full px-4 py-3 text-[15px]"
          />
        </label>

        {catalog.length === 0 ? (
          <p className="mt-8 text-[15px] text-[var(--ink-secondary)]">
            No board members match that search.
          </p>
        ) : null}

        <ul className="mt-6 grid grid-cols-1 gap-x-10 gap-y-1 md:grid-cols-2">
          {catalog.map((member) => {
            const selected = state.selected.includes(member.slug);
            return (
              <li key={member.slug}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => session.toggleMember(member.slug)}
                  className="group flex w-full items-center gap-3.5 border-t px-1 py-3.5 text-left transition-colors"
                  style={{
                    borderTopColor: selected ? "var(--human)" : "var(--rule)",
                    background: selected ? "var(--soft-fill)" : "transparent",
                  }}
                >
                  <Portrait initials={member.initials} slug={member.portrait ? member.slug : undefined} size="md" label={member.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium leading-tight">
                      {member.name}
                    </span>
                    <span className="mt-1 block truncate text-[13px] leading-tight text-[var(--ink-secondary)]">
                      {member.role}
                    </span>
                  </span>
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: "var(--human)", visibility: selected ? "visible" : "hidden" }}
                  >
                    Seated
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

/** The miniature table. Quiet and incomplete at first, filling as advisers are chosen. */
function BoardPreview({ session, state }: { session: MeetingSession; state: MeetingState }) {
  const places = Array.from({ length: Math.max(MIN_BOARD, state.selected.length) });

  return (
    <div className="mt-8 border-t border-[var(--rule)] pt-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[13px] font-medium">Your board</h2>
        <span className="text-[13px] text-[var(--ink-secondary)]">
          {state.selected.length} of {MAX_BOARD}
        </span>
      </div>

      <div className="mt-4 rounded-[3px] bg-[var(--soft-fill)] px-4 py-5">
        <div className="mx-auto mb-4 h-1.5 w-[72%] rounded-full bg-[var(--rule)]" />
        <ul className="space-y-2">
          {places.map((_, index) => {
            const slug = state.selected[index];
            const member = slug ? session.catalog.find((entry) => entry.slug === slug) : undefined;
            if (!member) {
              return (
                <li
                  key={`place-${index}`}
                  className="flex items-center gap-3 py-1 text-[13px] text-[var(--ink-secondary)]"
                >
                  <Portrait initials="" size="sm" variant="vacant" />
                  <span>Open place</span>
                </li>
              );
            }
            return (
              <li key={member.slug} className="flex items-center gap-3 py-1">
                <Portrait initials={member.initials} slug={member.portrait ? member.slug : undefined} size="sm" label={member.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium leading-tight">
                    {member.name}
                  </span>
                  <span className="block truncate text-[12px] leading-tight text-[var(--ink-secondary)]">
                    {member.house}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => session.toggleMember(member.slug)}
                  className="px-1 text-[12px] text-[var(--ink-secondary)] hover:text-[var(--human)]"
                >
                  Remove<span className="sr-only"> {member.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
