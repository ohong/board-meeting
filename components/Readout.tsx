"use client";

import { useState, type ReactNode } from "react";
import { formatReadout } from "@/lib/format";
import { LetterMark } from "./LetterMark";
import type { MeetingSession, MeetingState } from "@/lib/session";

export function Readout({ session, state }: { session: MeetingSession; state: MeetingState }) {
  const readout = state.readout;
  const [copied, setCopied] = useState(false);
  if (!readout) return null;

  return (
    <main className="flex-1 ledger px-14 py-10">
      <div className="max-w-[1080px] mx-auto">
        <header className="text-center pb-5 border-b border-[oklch(23%_0.025_50_/_0.35)]">
          <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--paper-faint)]">
            A personal board, in session
          </div>
          <h1 className="text-[32px] font-bold tracking-[-0.02em] mt-2.5">Executive readout</h1>
          <div className="flex justify-center gap-6 text-[12px] mt-3 text-[var(--paper-faint)]">
            <span>Chaired by you</span>
            <span>{state.members.length} advisers</span>
            {state.guest.name ? <span>{state.guest.name} attended as guest</span> : null}
            <span>{readout.divided ? "Board divided" : "Board aligned"}</span>
          </div>
        </header>

        <div className="grid grid-cols-[224px_1fr] gap-12 mt-9">
          <aside>
            <h2 className="text-[10px] tracking-[0.18em] uppercase text-[var(--paper-faint)] mb-4">
              The table
            </h2>
            {state.members.map((member) => (
              <div key={member.slug} className="flex items-center gap-2.5 mb-3.5">
                <LetterMark initials={member.initials} seed={member.slug} size="sm" />
                <div className="leading-tight">
                  <strong className="block text-[13.5px]">{member.name}</strong>
                  <span className="text-[10.5px] text-[var(--paper-faint)]">{member.role}</span>
                </div>
              </div>
            ))}

            <h2 className="text-[10px] tracking-[0.18em] uppercase text-[var(--paper-faint)] mt-8 mb-2">
              The question
            </h2>
            <p className="text-[13px] leading-relaxed">{session.decisionTitle()}</p>

            <button
              type="button"
              className="mt-8 w-full bg-[var(--paper-ink)] text-[var(--paper)] px-4 py-2.5 text-[12.5px] font-semibold rounded-[3px]"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(formatReadout(readout));
                } catch {
                  // Clipboard permission can be refused; the memo is still on screen.
                }
                setCopied(true);
                setTimeout(() => setCopied(false), 2400);
              }}
            >
              {copied ? "Copied" : "Copy readout"}
            </button>

            {state.readoutRetrievedBy ? (
              <p className="mt-3 text-[11px] leading-relaxed text-[var(--paper-faint)]">
                {state.readoutRetrievedBy} retrieved this readout through WebMCP.
              </p>
            ) : null}
          </aside>

          <article>
            <Section title="Decision under discussion">{readout.decision}</Section>

            <section className="mb-7">
              <h2 className="text-[10px] tracking-[0.18em] uppercase mb-2">Board recommendation</h2>
              <p className="text-[17px] leading-[1.6]">{readout.recommendation}</p>
              {readout.divided ? (
                <p className="mt-2.5 text-[14px] font-semibold text-[oklch(46%_0.15_28)]">
                  The board remained divided. That division is preserved here rather than resolved.
                </p>
              ) : null}
            </section>

            <List title="Options considered" items={readout.options} />
            <List title="Key tradeoffs" items={readout.tradeoffs} />
            <List title="Important assumptions" items={readout.assumptions} />
            <List title="Open questions" items={readout.openQuestions} />
            <List title="Recommended next actions" items={readout.nextActions} />
            {readout.transcriptDigest?.length ? (
              <List title="On the record" items={readout.transcriptDigest} />
            ) : null}

            <h2 className="text-[10px] tracking-[0.18em] uppercase mt-9 mb-3">
              Closing comments by board member
            </h2>
            {readout.closingComments.map((comment) => (
              <blockquote
                key={comment.memberId}
                className="mb-4 pl-4 border-l-2 border-[oklch(23%_0.025_50_/_0.3)]"
              >
                <p className="text-[15px] leading-[1.6]">{comment.comment}</p>
                <cite className="not-italic text-[12.5px] text-[var(--paper-faint)]">— {comment.name}</cite>
              </blockquote>
            ))}

            {readout.fallback ? (
              <p className="mt-6 text-[12px] italic text-[var(--paper-faint)]">
                The secretary could not complete a synthesis for this meeting, so this memo records
                what was said rather than interpreting it.
              </p>
            ) : null}
          </article>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-[10px] tracking-[0.18em] uppercase mb-2">{title}</h2>
      <p className="text-[17px] leading-[1.6]">{children}</p>
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="mb-7">
      <h2 className="text-[10px] tracking-[0.18em] uppercase mb-2">{title}</h2>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="text-[15px] leading-[1.55] pl-4 -indent-4">
            <span className="text-[var(--paper-faint)]">—</span> {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
