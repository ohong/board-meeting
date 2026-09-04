"use client";

import { useMemo, useState } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import { MAX_BOARD_SIZE, MIN_BOARD_SIZE, type PersonaSummary } from "@/lib/meeting/types";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, CloseIcon, SearchIcon } from "@/components/ui/icons";
import { Portrait } from "@/components/ui/portrait";
import { Eyebrow, Notice, PageShell } from "@/components/ui/shell";
import { PersonaCard } from "./persona-card";

function matches(persona: PersonaSummary, needle: string): boolean {
  if (!needle) return true;
  const hay = [persona.name, persona.shortName, persona.role, persona.company, ...persona.searchTerms, ...persona.lenses]
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
  const full = count >= MAX_BOARD_SIZE;
  const canContinue = count >= MIN_BOARD_SIZE && count <= MAX_BOARD_SIZE;

  return (
    <PageShell step={1} width={900}>
      {/* No `overflow-hidden` here: it would trap the sticky footer inside the
          card's own box and drop the primary action below the fold. */}
      <section className="card">
        <div className="flex items-start justify-between gap-4 border-b border-line px-7 pt-6 pb-5">
          <div>
            <h2 className="font-display text-[24px] leading-tight font-semibold">Board Setup</h2>
            <p className="mt-1 text-[13px] text-muted">
              Choose {MIN_BOARD_SIZE}&ndash;{MAX_BOARD_SIZE} advisers to seat around your table. Each one argues from
              their own record.
            </p>
          </div>
          <span className="pill mt-1 shrink-0 text-muted">Step 1 of 3</span>
        </div>

        <div className="px-7 pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <Eyebrow>Select board members</Eyebrow>
            <span className="text-[12px] text-faint tabular-nums">
              {results.length} of {catalog.length} advisers
            </span>
          </div>
          <label className="mt-3 flex h-11 items-center gap-2.5 rounded-lg border border-line bg-surface-2 px-3.5 transition-[background-color,border-color,box-shadow] duration-200 ease-out focus-within:border-accent-line focus-within:bg-surface focus-within:shadow-[0_0_0_3px_var(--color-accent-soft)]">
            <SearchIcon size={14} className="text-muted" />
            <span className="sr-only">Search advisers by name, company, or expertise</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, company, or expertise"
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="press flex h-6 w-6 items-center justify-center rounded-full text-muted transition-[background-color,color,transform] duration-200 ease-out hover:bg-surface-3 hover:text-ink"
              >
                <CloseIcon size={14} />
              </button>
            ) : null}
          </label>

          {state.notice ? (
            <div className="mt-3">
              <Notice text={state.notice.text} />
            </div>
          ) : null}
        </div>

        <div className="px-7 pt-4 pb-6">
          {results.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-4 py-12 text-center text-[13px] text-muted">
              No adviser matches &ldquo;{query}&rdquo;. Try a company, a topic, or a first name.
            </p>
          ) : (
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {results.map((persona, i) => {
                const seat = selectedSlugs.indexOf(persona.slug);
                return (
                  <li
                    key={persona.slug}
                    className="animate-rise-in"
                    style={{ animationDelay: `${Math.min(i, 9) * 32}ms` }}
                  >
                    <PersonaCard
                      persona={persona}
                      selected={seat >= 0}
                      index={seat >= 0 ? seat + 1 : null}
                      disabled={full && seat < 0}
                      onToggle={() => session.toggleMember(persona)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="material-strong sticky bottom-0 flex items-center gap-4 rounded-b-2xl border-t border-line px-7 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {count > 0 ? (
              <span className="flex shrink-0 -space-x-2">
                {state.board.map((p) => (
                  <Portrait
                    key={p.slug}
                    src={p.portrait}
                    alt={p.name}
                    size={28}
                    className="animate-pop-in ring-2 ring-surface"
                  />
                ))}
              </span>
            ) : null}
            <p className="min-w-0 text-[13px] text-muted">
              <span className="font-semibold text-ink tabular-nums">
                {count} of {MAX_BOARD_SIZE}
              </span>{" "}
              selected
              <span className="hidden sm:inline">
                {" "}
                &middot;{" "}
                {canContinue
                  ? "You can still swap anyone out."
                  : `Add at least ${MIN_BOARD_SIZE} to continue.`}
              </span>
            </p>
          </div>
          <Button variant="primary" size="lg" disabled={!canContinue} onClick={() => session.goToBriefing()}>
            Continue
            <ArrowRightIcon size={14} />
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
