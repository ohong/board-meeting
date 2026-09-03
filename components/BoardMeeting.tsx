"use client";

import { useMemo, useState } from "react";
import { BoardTable } from "./BoardTable";
import { Composer } from "./Composer";
import { InvitePanel } from "./InvitePanel";
import { Minutes } from "./Minutes";
import type { MeetingSession, MeetingState } from "@/lib/session";

const PHASE_LABEL: Record<string, string> = {
  opening: "Independent positions",
  discussion: "In discussion",
  ending: "Closing comments",
  closed: "Closed",
};

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
  // null means "follow the room": the panel opens by itself the moment a guest agent joins,
  // which is the moment the WebMCP story lands. Toggling it pins it either way.
  const [invitePinned, setInvitePinned] = useState<boolean | null>(null);
  const [ending, setEnding] = useState(false);

  const inviteOpen = invitePinned ?? Boolean(state.guest.name);
  const invitation = session.invitationPrompt();
  const floorCard = useMemo(
    () => [...state.transcript].reverse().find((event) => event.kind === "message" && event.text),
    [state.transcript],
  );

  const speaking = state.members.find((member) => member.status === "speaking");
  const chairLabel = speaking ? `${speaking.name} has the floor` : state.awaitingChair ? "Your move" : "Chairing";

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <header className="flex items-center gap-5 px-7 pt-5 pb-4">
        <div className="min-w-0">
          <div className="eyebrow">In session</div>
          <h1 className="serif text-[19px] font-semibold mt-1 truncate max-w-[46ch]" title={session.decisionTitle()}>
            {session.decisionTitle()}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2 text-[12px] text-[var(--muted)]">
          <i
            className="block w-[7px] h-[7px] rounded-full"
            style={{
              background: state.meetingPhase === "opening" ? "var(--concern)" : "var(--live)",
              boxShadow: "0 0 10px currentColor",
            }}
          />
          {PHASE_LABEL[state.meetingPhase] ?? "In session"}
        </div>

        <button
          type="button"
          onClick={() => setInvitePinned(!inviteOpen)}
          className="btn-quiet px-3.5 py-2 text-[12.5px]"
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
          className="btn-primary px-4 py-2 text-[12.5px]"
        >
          {ending ? "Closing the meeting" : "End Meeting"}
        </button>
      </header>

      {state.lastError ? (
        <p className="mx-7 mb-2 text-[11.5px] text-[var(--concern)]">{state.lastError}</p>
      ) : null}

      <div className="flex-1 grid grid-cols-[minmax(0,1fr)_420px] min-h-0 px-6 pb-5 gap-5">
        <section className="relative min-h-0">
          <BoardTable
            members={state.members}
            guest={state.guest}
            chairLabel={chairLabel}
            onMention={(name) => setDraft((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}@${name} `)}
          />

          {floorCard ? (
            <aside className="floor-card absolute left-1/2 -translate-x-1/2 top-[46%] -translate-y-1/2 w-[min(400px,44%)] p-4 -rotate-[0.6deg] pointer-events-none">
              <p className="serif text-[15px] leading-[1.4]">{floorCard.text}</p>
              <cite className="block mt-2 not-italic text-[10px] tracking-[0.16em] uppercase text-[var(--paper-faint)]">
                {floorCard.speakerName}
                {floorCard.addressedTo ? ` → ${floorCard.addressedTo}` : ""}
              </cite>
            </aside>
          ) : null}

          {state.readoutRetrievedBy ? (
            <div className="absolute left-6 bottom-2 text-[11px] text-[var(--guest)]">
              {state.readoutRetrievedBy} retrieved the final readout.
            </div>
          ) : null}
        </section>

        <aside className="panel flex flex-col min-h-0">
          <div className="px-5 py-3 flex items-center justify-between border-b border-[var(--hairline)]">
            <span className="eyebrow">Minutes</span>
            <span className="text-[10.5px] text-[var(--faint)]">
              {state.transcript.filter((event) => event.kind === "message").length} contributions
            </span>
          </div>
          <Minutes transcript={state.transcript} />
          <Composer
            members={state.members}
            awaitingChair={state.awaitingChair}
            draft={draft}
            onDraftChange={setDraft}
            onSend={(text) => session.sendUserMessage(text)}
            onComposingChange={(composing) => session.setComposing(composing)}
          />
        </aside>
      </div>

      {inviteOpen ? (
        <InvitePanel
          prompt={invitation}
          supported={webmcpSupported}
          activity={state.agentActivity}
          onClose={() => setInvitePinned(false)}
        />
      ) : null}
    </div>
  );
}
