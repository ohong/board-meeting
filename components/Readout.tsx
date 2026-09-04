"use client";

import { useState } from "react";
import { formatReadout } from "@/lib/format";
import { Portrait, initialsFor } from "./LetterMark";
import type { MeetingState } from "@/lib/session";

/**
 * Paper mode. The first viewport is the board's answer, not a summary of the meeting: one
 * dominant recommendation, then the evidence that supports or contests it.
 */
export function Readout({ state }: { state: MeetingState }) {
  const readout = state.readout;
  const [copied, setCopied] = useState(false);
  if (!readout) return null;

  const basis = readout.divided
    ? readout.openQuestions[0] ?? readout.tradeoffs[0]
    : readout.tradeoffs[0] ?? readout.openQuestions[0];

  return (
    <main className="mx-auto w-full max-w-[1200px] px-8 py-10 lg:px-12">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-[var(--rule)] pb-6">
        <div className="min-w-0">
          <p className="text-[13px] text-[var(--ink-secondary)]">Board readout</p>
          <h1 className="editorial mt-2 max-w-[34ch] text-[clamp(26px,2.8vw,34px)] leading-[1.12]">
            {readout.decision}
          </h1>
          <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {state.members.map((member) => (
              <li key={member.slug} className="flex items-center gap-2">
                <Portrait initials={member.initials} size="xs" label={member.name} />
                <span className="text-[13px]">{member.name}</span>
              </li>
            ))}
            {state.guest.name ? (
              <li className="flex items-center gap-2">
                <Portrait initials={initialsFor(state.guest.name)} size="xs" variant="guest" label={state.guest.name} />
                <span className="text-[13px] text-[var(--guest)]">{state.guest.name}</span>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            className="btn-primary"
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
            <p className="text-[12.5px] text-[var(--guest)]">
              ✓ Retrieved by {state.readoutRetrievedBy}
            </p>
          ) : null}
        </div>
      </header>

      <section className="grid grid-cols-12 gap-8 border-b border-[var(--rule)] py-10">
        <div className="col-span-12 lg:col-span-7">
          {/* Spec 12.3: a divided board must be stated, not smoothed over. */}
          <p className="mb-3 text-[13px] font-medium" style={{ color: readout.divided ? "var(--human)" : "var(--ink-secondary)" }}>
            {readout.divided ? "The board remains divided." : "The board is aligned."}
          </p>
          <p className="editorial text-[clamp(24px,2.6vw,32px)] leading-[1.2]">
            {readout.recommendation}
          </p>
        </div>
        {basis ? (
          <div className="col-span-12 lg:col-span-4 lg:col-start-9">
            <h2 className="text-[13px] font-medium">
              {readout.divided ? "What the disagreement turns on" : "The decisive basis"}
            </h2>
            <p className="mt-2 text-[15px] leading-[1.55] text-[var(--ink-secondary)]">{basis}</p>
          </div>
        ) : null}
      </section>

      {readout.options.length ? (
        <Block title="Options considered">
          <ul className="divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
            {readout.options.map((option, index) => (
              <li key={`option-${index}`} className="py-3.5 text-[15px] leading-[1.5]">
                {option}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {readout.tradeoffs.length ? (
        <Block title="Key tradeoffs">
          <ul className="divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
            {readout.tradeoffs.map((item, index) => (
              <li key={`tradeoff-${index}`} className="py-3.5 text-[15px] leading-[1.5]">
                {item}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {readout.assumptions.length || readout.openQuestions.length ? (
        <section className="grid grid-cols-12 gap-8 py-10">
          <Column title="Important assumptions" items={readout.assumptions} />
          <Column title="Open questions" items={readout.openQuestions} />
        </section>
      ) : null}

      {readout.nextActions.length ? (
        <Block title="Recommended next actions">
          <ol className="space-y-4">
            {readout.nextActions.map((action, index) => (
              <li key={`action-${index}`} className="flex gap-4">
                <span className="operational pt-1 text-[var(--ink-secondary)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={
                    index === 0
                      ? "editorial text-[20px] leading-[1.35]"
                      : "text-[15px] leading-[1.55]"
                  }
                >
                  {action}
                </span>
              </li>
            ))}
          </ol>
        </Block>
      ) : null}

      {readout.transcriptDigest?.length ? (
        <Block title="On the record">
          <ul className="space-y-2.5">
            {readout.transcriptDigest.map((line, index) => (
              <li key={`record-${index}`} className="text-[15px] leading-[1.55]">
                {line}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      <Block title="Closing comments">
        <div
          className={
            readout.closingComments.length === 3
              ? "grid grid-cols-1 gap-8 md:grid-cols-3"
              : "grid grid-cols-1 gap-8 md:grid-cols-2"
          }
        >
          {readout.closingComments.map((comment) => {
            const member = state.members.find((entry) => entry.slug === comment.memberId);
            return (
              <figure key={comment.memberId}>
                <blockquote className="editorial text-[17px] leading-[1.45]">
                  {comment.comment}
                </blockquote>
                <figcaption className="mt-3 flex items-center gap-2">
                  <Portrait initials={member?.initials ?? ""} size="xs" label={comment.name} />
                  <span className="text-[13px] font-medium">{comment.name}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Block>

      <footer className="border-t border-[var(--rule)] pt-6 pb-2">
        <p className="text-[15px] leading-[1.55]">
          {readout.nextActions[0]
            ? `Start here: ${readout.nextActions[0]}`
            : readout.openQuestions[0]
              ? `Still unresolved: ${readout.openQuestions[0]}`
              : "The board has left the room."}
        </p>
        {readout.fallback ? (
          <p className="mt-3 text-[13px] text-[var(--ink-secondary)]">
            The secretary could not complete a synthesis, so this memo records what was said
            rather than interpreting it.
          </p>
        ) : null}
      </footer>
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-[var(--rule)] py-10">
      <h2 className="editorial mb-5 text-[26px] leading-[1.12]">{title}</h2>
      {children}
    </section>
  );
}

function Column({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="col-span-12 md:col-span-6">
      <h2 className="editorial mb-4 text-[26px] leading-[1.12]">{title}</h2>
      <ul className="divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="py-3 text-[15px] leading-[1.5]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
