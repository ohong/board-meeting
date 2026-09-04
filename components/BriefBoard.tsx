"use client";

import { getMember } from "@/lib/catalog";
import type { MeetingSession, MeetingState } from "@/lib/session";
import { BoardPreview } from "./BoardPreview";

export function BriefBoard({
  session,
  state,
}: {
  session: MeetingSession;
  state: MeetingState;
}) {
  const ready = session.canStart();
  const members = state.selected
    .map((slug) => getMember(slug))
    .filter((member): member is NonNullable<typeof member> => Boolean(member));

  function returnToSelection() {
    const selected = [...state.selected];
    const briefing = state.briefing;
    session.reset();
    selected.forEach((slug) => session.toggleMember(slug));
    session.setBriefing(briefing);
    window.scrollTo(0, 0);
  }

  return (
    <main className="paper-onboarding" id="main-content">
      <header className="onboarding-header">
        <a href="#main-content" className="skip-link">Skip to decision brief</a>
        <div className="product-lockup">
          <span className="product-mark" aria-hidden="true">BM</span>
          <span>Board Meeting</span>
        </div>
        <span className="current-task">Brief your board</span>
      </header>

      <div className="onboarding-grid brief-grid">
        <aside className="onboarding-rail briefing-rail">
          <button type="button" className="paper-back" onClick={returnToSelection}>
            <span aria-hidden="true">←</span> Change board
          </button>
          <div className="rail-intro compact-intro">
            <h2>The room is assembled.</h2>
            <p>Everyone at this table will receive the same brief.</p>
          </div>
          <BoardPreview members={members} compact />
          <p className="board-source-note">
            {members.length} selected advisers. You remain chair.
          </p>
        </aside>

        <section className="decision-sheet" aria-labelledby="decision-title">
          <div className="decision-heading">
            <div>
              <h1 id="decision-title">What decision are you trying to make?</h1>
              <p>
                Give them the context you would give a real board: the goal, the numbers, the
                constraints, and what feels difficult.
              </p>
            </div>
            <button
              type="button"
              className="example-action"
              onClick={() => session.useExampleDecision()}
            >
              Use example decision
            </button>
          </div>

          <label className="decision-input" htmlFor="board-briefing">
            <span>Decision brief</span>
            <textarea
              id="board-briefing"
              value={state.briefing}
              onChange={(event) => session.setBriefing(event.target.value)}
              placeholder="Describe the decision, what has led you here, and what the board should challenge."
              rows={14}
            />
          </label>

          <div className="decision-actions">
            <p>
              {state.briefing.trim()
                ? "The brief is ready to enter the room."
                : "Add a meaningful brief to continue."}
            </p>
            <button
              type="button"
              disabled={!ready}
              onClick={() => void session.startMeeting()}
              className="paper-primary start-meeting"
            >
              Start board meeting
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
