"use client";

import { useState } from "react";
import { BoardTable } from "./BoardTable";
import { Composer } from "./Composer";
import { InvitePanel } from "./InvitePanel";
import { Minutes } from "./Minutes";
import type { MeetingSession, MeetingState } from "@/lib/session";

const PHASE_LABEL: Record<string, string> = {
  opening: "Opening positions",
  discussion: "Discussion",
  ending: "Closing comments",
  closed: "Closed",
};

/**
 * Room mode. The room is the page background for this state, not a card: it takes about
 * two thirds of the width, the paper minutes rail the rest. Fixed height, so only the
 * minutes scroll and the table never slides out of view.
 */
export function BoardMeeting({
  session,
  state,
  webmcpSupported,
}: {
  session: MeetingSession;
  state: MeetingState;
  webmcpSupported: boolean | null;
}) {
  const [draft, setDraft] = useState("");
  const [invitePinned, setInvitePinned] = useState<boolean | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const [ending, setEnding] = useState(false);

  const inviteOpen = invitePinned ?? false;
  const decision = session.decisionTitle();

  // The arrival class is added the moment a guest takes the seat. A CSS animation runs once
  // when its rule starts applying, so re-renders do not replay it.
  const guestArrived = Boolean(state.guest.name);

  return (
    <div className="room flex min-h-screen flex-col lg:h-screen lg:overflow-hidden">
      <header className="sticky top-0 z-10 flex min-h-[56px] shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b sm:gap-x-5 border-[var(--room-rule)] bg-[var(--room-canvas)] px-4 py-2.5 sm:px-6 lg:flex-nowrap">
        <span className="text-[14px] font-medium">Board Meeting</span>
        {/* The compact room prints the decision in full right below, so the header does not repeat it. */}
        <p
          className="hidden min-w-0 flex-1 truncate text-[14px] text-[var(--room-secondary)] lg:block"
          title={decision}
        >
          {decision}
        </p>
        {/* Grouped so the two controls wrap together as a pair rather than one stranding a row. */}
        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0 lg:gap-3">
          <button
            type="button"
            onClick={() => setInvitePinned(!inviteOpen)}
            className="btn-room"
            aria-expanded={inviteOpen}
          >
            Invite your agent
          </button>
          <button
            type="button"
            disabled={ending}
            onClick={() => {
              setEnding(true);
              void session.endMeeting();
            }}
            className="btn-room btn-end"
          >
            {ending ? "Closing…" : "End meeting"}
          </button>
        </div>
      </header>

      {state.lastError ? (
        <p className="shrink-0 px-6 py-1.5 text-[12.5px] text-[var(--human-room)]">{state.lastError}</p>
      ) : null}

      {/*
        The room-and-minutes composition holds where it fits. Narrower than that the room
        stacks above the minutes and the page scrolls, per the design's responsive rules,
        rather than crushing both into unreadable columns. See .meeting-grid.
      */}
      <div className="meeting-grid" data-invite={inviteOpen ? "open" : "closed"}>
        <main className="relative lg:min-h-0" aria-label="The board room">
          <h1 className="sr-only">Board meeting: {decision}</h1>
          <BoardTable
            members={state.members}
            guest={state.guest}
            decision={decision}
            phaseLabel={PHASE_LABEL[state.meetingPhase] ?? "In session"}
            guestArrived={guestArrived}
            onMention={(name) =>
              setDraft((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}@${name} `)
            }
            onInspectBrief={() => setBriefOpen(true)}
          />
        </main>

        <section
          className="sheet flex min-h-[420px] flex-col shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)] lg:min-h-0"
          aria-label="Minutes"
        >
          <div className="flex shrink-0 items-baseline justify-between border-b border-[var(--rule)] px-6 py-3.5">
            <h2 className="text-[14px] font-medium">Minutes</h2>
            <span className="text-[12.5px] text-[var(--ink-secondary)]">
              {PHASE_LABEL[state.meetingPhase] ?? "In session"}
            </span>
          </div>
          <Minutes transcript={state.transcript} members={state.members} />
          <Composer
            members={state.members}
            awaitingChair={state.awaitingChair}
            draft={draft}
            onDraftChange={setDraft}
            onSend={(text) => session.sendUserMessage(text)}
            onComposingChange={(composing) => session.setComposing(composing)}
          />
        </section>

        {inviteOpen ? (
          <div className="invite-slot">
            <InvitePanel
              prompt={session.invitationPrompt()}
              supported={webmcpSupported}
              guestName={state.guest.name}
              activity={state.agentActivity}
              onClose={() => setInvitePinned(false)}
            />
          </div>
        ) : null}
      </div>

      {briefOpen ? (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-5 sm:p-8"
          role="dialog"
          aria-label="The full brief"
          onClick={() => setBriefOpen(false)}
        >
          <div
            className="sheet max-h-[70vh] w-[min(720px,90vw)] overflow-y-auto px-8 py-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="editorial text-[24px] leading-tight">The brief</h2>
              <button
                type="button"
                onClick={() => setBriefOpen(false)}
                className="btn-secondary py-1.5 text-[13px]"
              >
                Close
              </button>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.6]">{state.briefing}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
