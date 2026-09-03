"use client";

import { LetterMark } from "./LetterMark";
import { getMember } from "@/lib/catalog";
import type { MeetingSession, MeetingState } from "@/lib/session";

const SELECT_ANGLES = [-80, -48, -16, 16, 48, 80];

export function SelectBoard({
  session,
  state,
}: {
  session: MeetingSession;
  state: MeetingState;
}) {
  const catalog = session.visibleCatalog();
  const ready = state.selected.length >= 3 && state.selected.length <= 6;
  const seated = state.selected
    .map((slug) => getMember(slug))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  return (
    <main className="flex-1 px-8 py-7 max-w-[1400px] mx-auto w-full min-h-0 flex flex-col">
      <header className="flex items-end justify-between gap-8 mb-6">
        <div>
          <div className="masthead">The Board</div>
          <h1 className="text-[40px] leading-[1.05] mt-2 font-semibold tracking-[-0.03em]">
            Choose your board
          </h1>
          <p className="mt-3 text-[var(--muted)] max-w-xl text-[15px] leading-relaxed">
            Convene three to six advisers to pressure-test a consequential decision. Every seat is a
            distinct mind, not a costume on one model.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm text-[var(--muted)] tracking-wide">
            {state.selected.length} of 6 seated
          </div>
          <button
            type="button"
            disabled={!ready}
            onClick={() => session.goToBrief()}
            className="btn-brass mt-3"
          >
            Continue to briefing
          </button>
        </div>
      </header>

      {state.selectionMessage ? (
        <p className="mb-3 text-[var(--brass)] text-sm">{state.selectionMessage}</p>
      ) : null}

      <div className="flex-1 grid grid-cols-[minmax(280px,380px)_minmax(0,1fr)] gap-8 min-h-0">
        <section className="flex flex-col min-h-0 border border-[oklch(50%_0.04_70_/_0.28)] bg-[var(--surface)]">
          <label className="block border-b border-[oklch(50%_0.04_70_/_0.28)]">
            <span className="sr-only">Search the roster</span>
            <input
              value={state.search}
              onChange={(e) => session.setSearch(e.target.value)}
              placeholder="Search by name or role — try DHH, Ek, Lulu"
              className="w-full bg-transparent px-4 py-3 text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
          </label>
          <div className="flex-1 overflow-auto min-h-[420px] max-h-[calc(100vh-280px)]">
            {catalog.map((member) => {
              const selected = state.selected.includes(member.slug);
              return (
                <button
                  type="button"
                  key={member.slug}
                  onClick={() => session.toggleMember(member.slug)}
                  className={`roster-row ${selected ? "seated" : ""}`}
                >
                  <LetterMark initials={member.initials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[14px] leading-tight truncate serif">
                      {member.name}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] mt-0.5 tracking-wide truncate">
                      {member.role}
                    </div>
                  </div>
                  {selected ? (
                    <span className="text-[10px] tracking-[0.14em] uppercase text-[var(--brass)] shrink-0">
                      Seated
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="relative min-h-[520px] flex items-center justify-center">
          <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 table-oval" />
          {SELECT_ANGLES.map((angle, i) => {
            const member = seated[i];
            return (
              <div
                key={member?.slug ?? `empty-${i}`}
                className="absolute w-[132px] text-center -ml-[66px]"
                style={{
                  left: `${50 + Math.sin((angle * Math.PI) / 180) * 34}%`,
                  top: `${16 + (1 - Math.cos((angle * Math.PI) / 180)) * 20}%`,
                }}
              >
                {member ? (
                  <>
                    <div className="mx-auto w-fit">
                      <LetterMark initials={member.initials} size="md" />
                    </div>
                    <strong className="block text-[12px] mt-2 serif">{member.name}</strong>
                    <em className="block not-italic text-[10px] tracking-[0.06em] uppercase text-[var(--muted)] mt-0.5">
                      {member.role.split(",")[0]}
                    </em>
                  </>
                ) : (
                  <>
                    <div className="empty-seat-ring" />
                    <em className="block not-italic text-[10px] tracking-[0.1em] uppercase text-[var(--muted)] mt-2">
                      Empty seat
                    </em>
                  </>
                )}
              </div>
            );
          })}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-6 text-[12px] tracking-[0.14em] uppercase text-[var(--muted)]">
            You · Chair
          </div>
        </section>
      </div>
    </main>
  );
}
