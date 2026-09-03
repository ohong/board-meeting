"use client";

import { useState, type ReactNode } from "react";
import { formatReadout } from "@/lib/format";
import { LetterMark } from "./LetterMark";
import type { MeetingSession, MeetingState } from "@/lib/session";

export function Readout({
  session: _session,
  state,
}: {
  session: MeetingSession;
  state: MeetingState;
}) {
  const readout = state.readout;
  const [copied, setCopied] = useState(false);
  if (!readout) return null;
  const text = formatReadout(readout);
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Los_Angeles",
  });

  return (
    <main className="flex-1 ledger-body min-h-screen px-10 md:px-16 py-10 flex flex-col">
      <header className="text-center border-b border-[var(--paper-ink)] pb-4">
        <div className="text-[11px] tracking-[0.28em] uppercase text-[var(--paper-muted)] font-[family-name:var(--font-instrument)]">
          A personal board, in session
        </div>
        <h1 className="text-[34px] font-bold tracking-[-0.02em] mt-2 font-[family-name:var(--font-playfair)]">
          The Best Board Meeting You’ve Ever Had
        </h1>
        <div className="flex justify-between text-xs mt-3 text-[var(--paper-muted)] font-[family-name:var(--font-instrument)]">
          <span>Session · {today}</span>
          <span>
            {readout.divided ? (
              <span className="text-[var(--dissent)] font-semibold">Board divided</span>
            ) : (
              <span className="text-[oklch(42%_0.11_145)] font-semibold">● Aligned</span>
            )}
            {" · "}
            {state.members.length} of 6 seated
          </span>
          <span>You are chair</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)_240px] gap-8 lg:gap-10 mt-8 flex-1">
        <aside className="lg:border-r lg:border-[var(--rule)] lg:pr-5">
          <h2 className="text-[11px] tracking-[0.18em] uppercase text-[var(--paper-muted)] mb-4 font-[family-name:var(--font-instrument)]">
            The table
          </h2>
          {state.members.map((m) => (
            <div key={m.slug} className="flex items-center gap-2.5 mb-3.5">
              <LetterMark initials={m.initials} size="sm" onPaper />
              <div>
                <strong className="block text-[15px] font-[family-name:var(--font-playfair)]">
                  {m.name}
                </strong>
                <span className="text-[11px] text-[var(--paper-muted)] font-[family-name:var(--font-instrument)]">
                  {m.role}
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2.5 mb-3.5 opacity-55">
            <div className="w-10 h-10 rounded-full border border-dashed border-[var(--paper-muted)]" />
            <div>
              <strong className="block text-[15px] font-[family-name:var(--font-playfair)]">
                {state.guest.name ?? "Your agent"}
              </strong>
              <span className="text-[11px] text-[var(--paper-muted)] font-[family-name:var(--font-instrument)]">
                {state.guest.name ? "Guest" : "Empty seat"}
              </span>
            </div>
          </div>
        </aside>

        <article>
          <h2 className="text-[36px] md:text-[42px] font-bold leading-[1.05] tracking-[-0.03em] mb-2 font-[family-name:var(--font-playfair)]">
            {readout.decision.length > 90
              ? `${readout.decision.slice(0, 87)}…`
              : readout.decision}
          </h2>
          <p className="text-[18px] text-[var(--paper-muted)] mb-8 leading-snug">
            {readout.recommendation}
          </p>

          <Section title="Board recommendation">
            {readout.recommendation}
            {readout.divided ? (
              <p className="text-[var(--dissent)] mt-2 font-[family-name:var(--font-instrument)] text-[13px]">
                The board remains divided.
              </p>
            ) : (
              <p className="text-[var(--paper-muted)] mt-2 font-[family-name:var(--font-instrument)] text-[13px]">
                The board is aligned.
              </p>
            )}
          </Section>
          <Section title="Options considered" items={readout.options} />
          <Section title="Key tradeoffs" items={readout.tradeoffs} />
          <Section title="Important assumptions" items={readout.assumptions} />
          <Section title="Open questions" items={readout.openQuestions} />
          <Section title="Recommended next actions" items={readout.nextActions} />

          <h2 className="text-[11px] tracking-[0.18em] uppercase mt-8 mb-3 font-[family-name:var(--font-instrument)] text-[var(--paper-muted)]">
            Closing comments by board member
          </h2>
          {readout.closingComments.map((c) => (
            <blockquote key={c.memberId} className="mb-4 text-[17px] leading-relaxed">
              <p>{c.comment}</p>
              <cite className="not-italic text-sm font-[family-name:var(--font-instrument)]">
                — {c.name}
              </cite>
            </blockquote>
          ))}
        </article>

        <aside className="lg:border-l lg:border-[var(--dissent)] lg:pl-5">
          <h2 className="text-[11px] tracking-[0.18em] uppercase text-[var(--dissent)] mb-4 font-[family-name:var(--font-instrument)]">
            Dissent
          </h2>
          {readout.divided ? (
            <>
              {readout.closingComments.map((c) => (
                <blockquote
                  key={c.memberId}
                  className="mb-4 text-[15px] leading-[1.4] text-[var(--dissent)]"
                >
                  <p>{c.comment}</p>
                  <cite className="block not-italic text-[12px] mt-1 text-[var(--paper-ink)] font-[family-name:var(--font-instrument)]">
                    {c.name}
                  </cite>
                </blockquote>
              ))}
              {readout.tradeoffs.slice(0, 2).map((t) => (
                <p key={t} className="mb-3 text-[14px] leading-snug text-[var(--dissent)]">
                  {t}
                </p>
              ))}
            </>
          ) : (
            <p className="text-[15px] leading-relaxed text-[var(--dissent)]">
              No formal dissent recorded. The table closed aligned.
            </p>
          )}
        </aside>
      </div>

      <footer className="mt-10 pt-4 border-t border-[var(--paper-ink)] flex items-center justify-between gap-4 font-[family-name:var(--font-instrument)]">
        <span className="text-[13px] text-[var(--paper-muted)]">
          Executive readout · copy for your records
        </span>
        <button
          type="button"
          className="btn-ink text-sm"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          }}
        >
          {copied ? "Copied readout" : "Copy readout"}
        </button>
      </footer>
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
      <h2 className="text-[11px] tracking-[0.18em] uppercase mb-2 font-[family-name:var(--font-instrument)] text-[var(--paper-muted)]">
        {title}
      </h2>
      {items ? (
        <ul className="list-disc pl-5 space-y-1 text-[17px] leading-relaxed">
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
