"use client";

import { useMemo, useState } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import { MAX_BOARD_SIZE, MIN_BOARD_SIZE, type PersonaSummary } from "@/lib/meeting/types";
import { PersonaCard } from "./persona-card";

function matches(persona: PersonaSummary, needle: string): boolean {
  if (!needle) return true;
  const hay = [persona.name, persona.shortName, persona.role, persona.company, ...persona.searchTerms]
    .join(" ")
    .toLowerCase();
  return needle
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => hay.includes(token));
}

export function SelectScreen({ catalog }: { catalog: PersonaSummary[] }) {
  const session = useSession();
  const state = useMeetingState();
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const results = useMemo(() => catalog.filter((p) => matches(p, needle)), [catalog, needle]);
  const selectedSlugs = useMemo(() => state.board.map((p) => p.slug), [state.board]);

  const count = state.board.length;
  const canContinue = count >= MIN_BOARD_SIZE && count <= MAX_BOARD_SIZE;

  return (
    <div className="flex min-h-screen flex-col bg-paper text-paper-ink">
      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-10 pt-10 pb-40">
        <p className="text-[11px] tracking-[0.28em] text-paper-muted uppercase">The Board</p>
        <h1 className="mt-3 font-display text-[42px] leading-[1.05] font-semibold tracking-[-0.02em]">
          Choose your board
        </h1>
        <p className="mt-3 max-w-[640px] font-display text-[18px] leading-snug text-paper-muted">
          Pick three to six advisers, brief them on one high-stakes decision, and chair the meeting yourself.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4 border-b border-rule pb-4">
          <label className="flex-1 min-w-[260px]">
            <span className="sr-only">Search advisers by name or expertise</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, role, or expertise"
              className="w-full rounded-sm border border-rule bg-paper-2 px-3 py-2.5 text-[14px] text-paper-ink outline-none placeholder:text-paper-muted focus:border-paper-ink"
            />
          </label>
          <p className="text-[13px] text-paper-muted tabular-nums">
            <span className="font-semibold text-paper-ink">{count}</span> of {MAX_BOARD_SIZE}
          </p>
        </div>

        {state.notice ? (
          <p
            role="status"
            className="mt-4 animate-rise-in rounded-sm border border-dissent/40 bg-dissent/8 px-3 py-2 text-[13px] text-dissent"
          >
            {state.notice.text}
          </p>
        ) : null}

        {results.length === 0 ? (
          <p className="mt-10 text-[14px] text-paper-muted">
            No adviser matches &ldquo;{query}&rdquo;. Try a company, a topic, or a first name.
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((persona) => {
              const seat = selectedSlugs.indexOf(persona.slug);
              return (
                <li key={persona.slug} className="min-w-0">
                  <PersonaCard
                    persona={persona}
                    selected={seat >= 0}
                    index={seat >= 0 ? seat + 1 : null}
                    onToggle={() => session.toggleMember(persona)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-rule bg-paper/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1180px] items-center gap-6 px-10 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[15px] text-paper-ink">
              {count === 0
                ? "No one seated yet."
                : state.board.map((p) => p.shortName).join(" · ")}
            </p>
            <p className="mt-0.5 text-[12px] text-paper-muted">
              {canContinue
                ? `${count} advisers seated. You can still swap anyone out.`
                : `Select at least ${MIN_BOARD_SIZE} advisers to continue (up to ${MAX_BOARD_SIZE}).`}
            </p>
          </div>
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => session.goToBriefing()}
            className="shrink-0 rounded-sm bg-paper-ink px-5 py-3 text-[14px] font-semibold text-paper transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Continue to briefing
          </button>
        </div>
      </div>
    </div>
  );
}
