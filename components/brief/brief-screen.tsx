"use client";

import { useMeetingState, useSession } from "@/lib/meeting/context";
import { Portrait } from "@/components/ui/portrait";

export function BriefScreen() {
  const session = useSession();
  const state = useMeetingState();
  const ready = session.canStart();

  return (
    <div className="flex min-h-screen flex-col bg-paper text-paper-ink">
      <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col px-10 py-10">
        <p className="text-[11px] tracking-[0.28em] text-paper-muted uppercase">Brief your board</p>
        <h1 className="mt-3 font-display text-[40px] leading-[1.05] font-semibold tracking-[-0.02em]">
          What decision are you trying to make?
        </h1>
        <p className="mt-3 max-w-[620px] text-[14px] leading-relaxed text-paper-muted">
          One decision, plus whatever background, constraints, and numbers matter. Links stay as plain text.
        </p>

        <label className="mt-7 block">
          <span className="sr-only">Decision briefing</span>
          <textarea
            value={state.briefing}
            onChange={(e) => session.setBriefing(e.target.value)}
            rows={12}
            autoFocus
            placeholder="Should we eliminate our free tier? Here is the situation…"
            className="w-full resize-y rounded-sm border border-rule bg-paper-2 p-4 font-display text-[17px] leading-relaxed text-paper-ink outline-none placeholder:text-paper-muted focus:border-paper-ink"
          />
        </label>

        <div className="mt-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => session.useExampleBriefing()}
            className="rounded-sm border border-rule px-3 py-1.5 text-[12px] font-medium text-paper-muted transition-colors duration-150 hover:border-paper-ink hover:text-paper-ink"
          >
            Use example decision
          </button>
          <span className="text-[12px] text-paper-muted tabular-nums">
            {state.briefing.trim().length} characters
          </span>
        </div>

        <div className="mt-10 border-t border-rule pt-6">
          <h2 className="text-[11px] tracking-[0.18em] text-paper-muted uppercase">
            The table &middot; {state.board.length} seated
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {state.board.map((persona) => (
              <li key={persona.slug}>
                <button
                  type="button"
                  onClick={() => session.toggleMember(persona)}
                  title={`Remove ${persona.name} from the board`}
                  className="group flex items-center gap-2.5 rounded-full border border-rule bg-paper-2 py-1.5 pr-3.5 pl-1.5 text-left transition-colors duration-150 hover:border-dissent"
                >
                  <Portrait src={persona.portrait} alt={persona.name} size={32} grayscale />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-paper-ink">{persona.name}</span>
                    <span className="block max-w-[220px] truncate text-[11px] text-paper-muted group-hover:text-dissent">
                      <span className="group-hover:hidden">{persona.company}</span>
                      <span className="hidden group-hover:inline">Remove from board</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-paper-muted">Click a member to take them off the board.</p>
        </div>

        {state.notice ? (
          <p
            role="status"
            className="mt-4 animate-rise-in rounded-sm border border-dissent/40 bg-dissent/8 px-3 py-2 text-[13px] text-dissent"
          >
            {state.notice.text}
          </p>
        ) : null}

        <div className="mt-10 flex items-center gap-4">
          <button
            type="button"
            onClick={() => session.backToSelection()}
            className="rounded-sm border border-rule px-4 py-3 text-[14px] font-medium text-paper-muted transition-colors duration-150 hover:border-paper-ink hover:text-paper-ink"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!ready}
            onClick={() => session.startMeeting()}
            className="rounded-sm bg-paper-ink px-5 py-3 text-[14px] font-semibold text-paper transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Start Board Meeting
          </button>
          {!ready ? (
            <span className="text-[12px] text-paper-muted">
              {state.board.length < 3
                ? "Seat at least three advisers first."
                : "Write the decision you want them to argue about."}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
