"use client";

import { useMemo, useState } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import { MAX_BOARD_SIZE, MIN_BOARD_SIZE, type PersonaSummary } from "@/lib/meeting/types";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, SearchIcon } from "@/components/ui/icons";
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
    <PageShell step={1} width={840}>
      <section className="card overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-line px-7 pt-6 pb-5">
          <div>
            <h2 className="font-display text-[26px] leading-tight font-semibold tracking-[-0.01em]">Board Setup</h2>
            <p className="mt-1 text-[13.5px] text-muted">
              Choose {MIN_BOARD_SIZE}&ndash;{MAX_BOARD_SIZE} advisers to seat around your table. Each one argues from
              their own record.
            </p>
          </div>
          <span className="pill mt-1 text-muted">Step 1 of 3</span>
        </div>

        <div className="px-7 pt-5">
          <Eyebrow>Select board members</Eyebrow>
          <label className="mt-3 flex h-11 items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3.5 transition-colors focus-within:border-line-strong focus-within:bg-surface">
            <SearchIcon size={16} className="text-muted" />
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
                className="text-[12px] font-medium text-muted hover:text-ink"
              >
                Clear
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
            <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-[13.5px] text-muted">
              No adviser matches &ldquo;{query}&rdquo;. Try a company, a topic, or a first name.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {results.map((persona) => {
                const seat = selectedSlugs.indexOf(persona.slug);
                return (
                  <li key={persona.slug}>
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

        <div className="sticky bottom-0 flex items-center gap-4 border-t border-line bg-surface/92 px-7 py-4 backdrop-blur">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {count > 0 ? (
              <span className="flex shrink-0 -space-x-2">
                {state.board.map((p) => (
                  <Portrait key={p.slug} src={p.portrait} alt={p.name} size={28} className="ring-2 ring-surface" />
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
            <ArrowRightIcon size={16} />
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
