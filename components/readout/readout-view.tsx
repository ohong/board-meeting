"use client";

import { useMemo, useState } from "react";
import { Portrait } from "@/components/ui/portrait";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import type { PersonaSummary, Readout } from "@/lib/meeting/types";
import { readoutToText } from "./readout-text";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 border-b border-rule pb-1.5 text-[11px] tracking-[0.18em] text-paper-muted uppercase">
      {children}
    </h2>
  );
}

function List({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  if (items.length === 0) {
    return <p className="text-[14px] text-paper-muted italic">None recorded.</p>;
  }
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`space-y-1.5 ${ordered ? "list-decimal" : "list-disc"} pl-5`}>
      {items.map((item, i) => (
        <li key={i} className="font-display text-[16px] leading-[1.45] text-paper-ink">
          {item}
        </li>
      ))}
    </Tag>
  );
}

function timeOf(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ReadoutView({ readout }: { readout: Readout }) {
  const session = useSession();
  const state = useMeetingState();
  const [copied, setCopied] = useState(false);

  const byId = useMemo(() => {
    const map: Record<string, PersonaSummary> = {};
    for (const p of state.board) map[p.slug] = p;
    return map;
  }, [state.board]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(readoutToText(readout));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      session.notify("Could not reach the clipboard. Select the memo text and copy it manually.");
    }
  }

  return (
    <div className="min-h-screen bg-paper text-paper-ink">
      <div className="mx-auto w-full max-w-[980px] px-10 py-10">
        {/* Masthead */}
        <div className="border-b border-paper-ink pb-4 text-center">
          <p className="text-[11px] tracking-[0.28em] text-paper-muted uppercase">Executive readout</p>
          <h1 className="mt-2 font-display text-[34px] leading-[1.1] font-bold tracking-[-0.02em]">
            The Best Board Meeting You&rsquo;ve Ever Had
          </h1>
        </div>

        {/* Compact roster + original question */}
        <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] tracking-[0.18em] text-paper-muted uppercase">The table</p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {state.board.map((p) => (
                <li key={p.slug} className="flex items-center gap-2">
                  <Portrait src={p.portrait} alt={p.name} size={30} grayscale />
                  <span className="text-[13px] font-semibold">{p.name}</span>
                </li>
              ))}
              {state.guest && state.guest.status !== "empty" ? (
                <li className="flex items-center gap-2">
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-dashed border-paper-muted text-[10px] font-semibold text-paper-muted">
                    {state.guest.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-[13px] font-semibold">
                    {state.guest.name}
                    <span className="ml-1.5 text-[11px] font-normal text-paper-muted">external agent</span>
                  </span>
                </li>
              ) : null}
            </ul>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="rounded-sm border border-paper-ink px-3.5 py-2 text-[13px] font-semibold text-paper-ink transition-colors duration-150 hover:bg-paper-ink hover:text-paper"
            >
              {copied ? "Copied" : "Copy readout"}
            </button>
            <button
              type="button"
              onClick={() => session.reset()}
              className="rounded-sm bg-paper-ink px-3.5 py-2 text-[13px] font-semibold text-paper"
            >
              Start a new meeting
            </button>
          </div>
        </div>

        <div className="mt-5 border-t border-rule pt-5">
          <p className="text-[11px] tracking-[0.18em] text-paper-muted uppercase">Original question</p>
          <p className="mt-2 font-display text-[15px] leading-relaxed whitespace-pre-line text-paper-muted">
            {state.briefing}
          </p>
        </div>

        {state.readoutStatus === "failed" ? (
          <p className="mt-5 rounded-sm border border-dissent/40 bg-dissent/8 px-3 py-2 text-[12.5px] text-dissent">
            The secretary call failed. What follows is incomplete &mdash; the transcript is the record of
            record.
          </p>
        ) : null}

        {readout.fallback ? (
          <p className="mt-5 rounded-sm border border-rule bg-paper-2 px-3 py-2 text-[12.5px] text-paper-muted">
            The secretary could not be reached, so this memo was assembled directly from the transcript and
            the closing comments.
          </p>
        ) : null}

        {state.readoutRetrievedByGuestAt ? (
          <p className="mt-3 text-[12px] text-paper-muted">
            Retrieved by {state.guest?.name ?? "the external agent"} via WebMCP &middot;{" "}
            {timeOf(state.readoutRetrievedByGuestAt)}
          </p>
        ) : null}

        {state.notice ? (
          <p role="status" className="mt-3 text-[12.5px] text-dissent">
            {state.notice.text}
          </p>
        ) : null}

        {/* Memo */}
        <div className="mt-9 space-y-9">
          <section>
            <SectionHeading>Decision under discussion</SectionHeading>
            <p className="font-display text-[22px] leading-[1.25] font-semibold">{readout.decision}</p>
          </section>

          <section>
            <SectionHeading>Board recommendation</SectionHeading>
            {readout.recommendation.divided ? (
              <p className="mb-2.5 inline-block rounded-[2px] bg-dissent px-2 py-[3px] text-[10px] font-semibold tracking-[0.1em] text-paper uppercase">
                The board is divided
              </p>
            ) : null}
            <p className="font-display text-[19px] leading-[1.35] font-semibold">
              {readout.recommendation.summary}
            </p>
            {readout.recommendation.detail ? (
              <p
                className={`mt-2.5 font-display text-[16px] leading-[1.45] ${
                  readout.recommendation.divided ? "text-dissent" : "text-paper-muted"
                }`}
              >
                {readout.recommendation.detail}
              </p>
            ) : null}
          </section>

          <div className="grid gap-9 md:grid-cols-2">
            <section>
              <SectionHeading>Options considered</SectionHeading>
              <List items={readout.options} />
            </section>
            <section>
              <SectionHeading>Key tradeoffs</SectionHeading>
              <List items={readout.tradeoffs} />
            </section>
            <section>
              <SectionHeading>Important assumptions</SectionHeading>
              <List items={readout.assumptions} />
            </section>
            <section>
              <SectionHeading>Open questions</SectionHeading>
              <List items={readout.openQuestions} />
            </section>
          </div>

          <section>
            <SectionHeading>Recommended next actions</SectionHeading>
            <List items={readout.nextActions} ordered />
          </section>

          <section>
            <SectionHeading>Closing comments by board member</SectionHeading>
            <ul className="space-y-4">
              {readout.closingComments.map((comment) => {
                const persona = byId[comment.memberId];
                return (
                  <li key={comment.memberId} className="flex gap-3">
                    {persona ? (
                      <Portrait src={persona.portrait} alt={persona.name} size={40} grayscale />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded-full border border-dashed border-rule" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">
                        {comment.memberName}
                        {comment.fallback ? (
                          <span className="ml-2 text-[10.5px] font-normal tracking-[0.06em] text-paper-muted uppercase">
                            last stated position
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 font-display text-[16px] leading-[1.45] text-paper-ink">
                        {comment.text}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <p className="mt-10 border-t border-rule pt-4 text-[11px] text-paper-muted">
          Generated {timeOf(readout.generatedAt)}. Nothing here is saved &mdash; copy it before you leave.
        </p>
      </div>
    </div>
  );
}
