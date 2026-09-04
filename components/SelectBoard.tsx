"use client";

import { useState } from "react";
import { CATALOG, getMember } from "@/lib/catalog";
import type { MeetingSession, MeetingState } from "@/lib/session";
import { BoardPreview } from "./BoardPreview";
import { MeetingProgress } from "./MeetingProgress";
import { Portrait } from "./Portrait";

export function SelectBoard({
  session,
  state,
}: {
  session: MeetingSession;
  state: MeetingState;
}) {
  const [limitAttempt, setLimitAttempt] = useState<string | null>(null);
  const catalog = session.visibleCatalog();
  const ready = state.selected.length >= 3 && state.selected.length <= 6;
  const seated = state.selected
    .map((slug) => getMember(slug))
    .filter((member): member is NonNullable<typeof member> => Boolean(member));
  const seatsNeeded = Math.max(0, 3 - state.selected.length);

  return (
    <main className="paper-onboarding" id="main-content">
      <header className="onboarding-header">
        <a href="#main-content" className="skip-link">Skip to board selection</a>
        <div className="product-lockup">
          <span className="product-mark" aria-hidden="true">BM</span>
          <span>Board Meeting</span>
        </div>
        <MeetingProgress current="select" />
      </header>

      <div className="onboarding-grid selection-grid">
        <aside className="onboarding-rail">
          <div className="rail-intro">
            <h1>Who do you want in the room?</h1>
            <p>Choose three to six people whose judgment you want on the decision.</p>
          </div>

          <BoardPreview members={seated} />

          <div className="rail-action">
            <div className="selection-requirement" aria-live="polite">
              <strong>
                {ready
                  ? "Your board is ready."
                  : `${seatsNeeded} more ${seatsNeeded === 1 ? "seat" : "seats"} required.`}
              </strong>
              <span>Choose 3–6 advisers.</span>
            </div>
            <button
              type="button"
              disabled={!ready}
              onClick={() => {
                const result = session.goToBrief();
                if (result.ok) window.scrollTo(0, 0);
              }}
              className="paper-primary"
            >
              Brief your board
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </aside>

        <section className="catalog-field" aria-labelledby="adviser-library-title">
          <div className="catalog-heading">
            <div>
              <h2 id="adviser-library-title">Adviser library</h2>
              <p>Guests from David Senra’s Founders interviews.</p>
            </div>
            <div className="catalog-heading-actions">
              <span>
                {state.search.trim()
                  ? `${catalog.length} of ${CATALOG.length} ${catalog.length === 1 ? "match" : "matches"}`
                  : `${catalog.length} advisers`}
              </span>
              <button
                type="button"
                className="demo-board-action"
                onClick={() => {
                  const result = session.useDemoBoard();
                  if (result.ok) setLimitAttempt(null);
                }}
              >
                Use demo board
              </button>
            </div>
          </div>

          <div className="catalog-search">
            <label htmlFor="catalog-search-input">Search the archive</label>
            <span className="search-field">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                id="catalog-search-input"
                value={state.search}
                onChange={(event) => {
                  session.setSearch(event.target.value);
                  setLimitAttempt(null);
                }}
                placeholder="Find a founder, investor, or operator"
                type="search"
              />
              {state.search ? (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => {
                    session.setSearch("");
                    setLimitAttempt(null);
                  }}
                >
                  Clear
                </button>
              ) : null}
            </span>
          </div>

          {state.selectionMessage ? (
            <p className="selection-limit" role="status">
              {state.selected.length === 6
                ? "Your table is full. Remove someone to choose another adviser."
                : state.selectionMessage}
            </p>
          ) : null}

          {catalog.length ? (
            <div className="portrait-catalog">
              {catalog.map((member) => {
                const selected = state.selected.includes(member.slug);
                const attemptedAtLimit = limitAttempt === member.slug && !selected;
                return (
                  <button
                    type="button"
                    key={member.slug}
                    aria-pressed={selected}
                    aria-describedby={attemptedAtLimit ? `limit-${member.slug}` : undefined}
                    onClick={() => {
                      const result = session.toggleMember(member.slug);
                      setLimitAttempt(result.ok ? null : member.slug);
                    }}
                    className={`adviser-tile ${selected ? "is-selected" : ""}`}
                  >
                    <Portrait
                      slug={member.slug}
                      name={member.name}
                      initials={member.initials}
                    />
                    <span className="adviser-copy">
                      <span className="adviser-status">{selected ? "Selected" : "Choose adviser"}</span>
                      <strong>{member.name}</strong>
                      <span className="adviser-role">{member.role}</span>
                      <span className="adviser-lens">
                        <span>Decision lens</span> {member.decisionLens}
                      </span>
                      <span className="adviser-source">Source: Founders interview</span>
                      {attemptedAtLimit ? (
                        <span className="tile-limit" id={`limit-${member.slug}`}>
                          Table full. Remove someone first.
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="catalog-empty" role="status">
              <p>No board members match that search.</p>
              <button type="button" onClick={() => session.setSearch("")}>Clear search</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
