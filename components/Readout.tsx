"use client";

import { useState, type ReactNode } from "react";
import { formatReadout } from "@/lib/format";
import { LetterMark } from "./LetterMark";
import type { MeetingSession, MeetingState } from "@/lib/session";

export function Readout({
  session,
  state,
}: {
  session: MeetingSession;
  state: MeetingState;
}) {
  const readout = state.readout;
  const [copied, setCopied] = useState(false);
  if (!readout) return null;
  const text = formatReadout(readout);

  return (
    <main className="flex-1 ledger-body min-h-screen px-16 py-10">
      <header className="text-center border-b border-[var(--paper-ink)] pb-4">
        <div className="text-[11px] tracking-[0.28em] uppercase text-[oklch(45%_0.03_55)]">
          A personal board, in session
        </div>
        <h1 className="text-[34px] font-bold tracking-[-0.02em] mt-2">
          The Best Board Meeting You’ve Ever Had
        </h1>
        <div className="flex justify-between text-xs mt-3 text-[oklch(45%_0.03_55)]">
          <span>You are chair</span>
          <span>{readout.divided ? "Board divided" : "Board aligned"}</span>
          <span>{state.members.length} advisers</span>
        </div>
      </header>

      <div className="grid grid-cols-[200px_1fr] gap-10 mt-8">
        <aside>
          <h2 className="text-[11px] tracking-[0.18em] uppercase text-[oklch(45%_0.03_55)] mb-4">
            The table
          </h2>
          {state.members.map((m) => (
            <div key={m.slug} className="flex items-center gap-2 mb-3">
              <LetterMark initials={m.initials} size="sm" />
              <div>
                <strong className="block text-[15px]">{m.name}</strong>
                <span className="text-[11px] text-[oklch(45%_0.03_55)]">{m.role}</span>
              </div>
            </div>
          ))}
        </aside>

        <article>
          <Section title="Decision under discussion">{readout.decision}</Section>
          <Section title="Board recommendation">
            {readout.recommendation}
            {readout.divided ? (
              <p className="text-[var(--dissent)] mt-2">The board remains divided.</p>
            ) : null}
          </Section>
          <Section title="Options considered" items={readout.options} />
          <Section title="Key tradeoffs" items={readout.tradeoffs} />
          <Section title="Important assumptions" items={readout.assumptions} />
          <Section title="Open questions" items={readout.openQuestions} />
          <Section title="Recommended next actions" items={readout.nextActions} />
          <h2 className="text-[11px] tracking-[0.18em] uppercase mt-8 mb-3">
            Closing comments by board member
          </h2>
          {readout.closingComments.map((c) => (
            <blockquote key={c.memberId} className="mb-4">
              <p>{c.comment}</p>
              <cite className="not-italic text-sm">— {c.name}</cite>
            </blockquote>
          ))}

          <button
            type="button"
            className="mt-6 bg-[var(--paper-ink)] text-[var(--paper)] px-4 py-2 text-sm font-semibold"
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              setCopied(true);
            }}
          >
            {copied ? "Copied readout" : "Copy readout"}
          </button>
        </article>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
  items,
}: {
  title: string;
  children?: ReactNode;
  items?: string[];
}) {
  return (
    <section className="mb-6">
      <h2 className="text-[11px] tracking-[0.18em] uppercase mb-2">{title}</h2>
      {items ? (
        <ul className="list-disc pl-5 space-y-1">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[17px] leading-relaxed">{children}</p>
      )}
    </section>
  );
}
