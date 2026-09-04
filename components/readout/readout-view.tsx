"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon, DownloadIcon, FlagIcon, ListIcon, QuestionIcon, ScaleIcon, SparkleIcon } from "@/components/ui/icons";
import { Portrait } from "@/components/ui/portrait";
import { Eyebrow, Notice, PageShell } from "@/components/ui/shell";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import type { PersonaSummary, Readout } from "@/lib/meeting/types";
import { readoutToText } from "./readout-text";

type IconComponent = (p: { size?: number; className?: string }) => React.ReactNode;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-[17px] font-semibold text-ink">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Bordered rows with a leading icon, like the memo's tradeoff list. */
function IconList({ items, icon: Icon }: { items: string[]; icon: IconComponent }) {
  if (items.length === 0) return <p className="text-[13.5px] text-muted italic">None recorded.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3">
          <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
            <Icon size={13} />
          </span>
          <span className="text-[14px] leading-[1.5] text-ink">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-[13.5px] text-muted italic">None recorded.</p>;
  return (
    <ol className="overflow-hidden rounded-xl border border-line bg-surface">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 border-b border-line px-3.5 py-3 last:border-b-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white tabular-nums">
            {i + 1}
          </span>
          <span className="pt-px text-[14px] leading-[1.5] text-ink">{item}</span>
        </li>
      ))}
    </ol>
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

  const topic = state.briefing.split("\n")[0].trim();

  async function copy() {
    try {
      await navigator.clipboard.writeText(readoutToText(readout));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      session.notify("Could not reach the clipboard. Select the memo text and copy it manually.");
    }
  }

  function download() {
    const blob = new Blob([readoutToText(readout)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "board-meeting-memo.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <PageShell step={3} width={920}>
      <article className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-7 pt-6 pb-5">
          <div className="min-w-0">
            <h2 className="font-display text-[26px] leading-tight font-semibold tracking-[-0.01em]">Executive Memo</h2>
            <p className="mt-1 truncate text-[13.5px] text-muted" title={state.briefing}>
              {topic}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-9" onClick={copy}>
              {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
              {copied ? "Copied" : "Copy memo"}
            </Button>
            <Button variant="primary" size="sm" className="h-9" onClick={() => session.reset()}>
              New meeting
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-8 px-7 py-6">
          {/* Roster */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Eyebrow>The board</Eyebrow>
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {state.board.map((p) => (
                <li key={p.slug} className="flex items-center gap-2">
                  <Portrait src={p.portrait} alt="" size={26} />
                  <span className="text-[13px] font-medium text-ink">{p.name}</span>
                </li>
              ))}
              {state.guest && state.guest.status !== "empty" ? (
                <li className="flex items-center gap-2">
                  <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-live-soft text-[10px] font-bold text-ink-2">
                    {state.guest.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-[13px] font-medium text-ink">
                    {state.guest.name}
                    <span className="ml-1.5 text-[11.5px] font-normal text-muted">your agent</span>
                  </span>
                </li>
              ) : null}
            </ul>
          </div>

          {state.readoutStatus === "failed" ? (
            <Notice text="The secretary call failed. What follows is incomplete; the minutes are the record of record." />
          ) : null}
          {readout.fallback ? (
            <Notice
              tone="info"
              text="The secretary could not be reached, so this memo was assembled directly from the minutes and the closing comments."
            />
          ) : null}
          {state.notice ? <Notice text={state.notice.text} /> : null}

          {/* Decision + recommendation */}
          <section>
            <Eyebrow>Decision under discussion</Eyebrow>
            <p className="mt-2 font-display text-[22px] leading-[1.3] font-semibold text-ink">{readout.decision}</p>
          </section>

          <section>
            <h3 className="font-display text-[17px] font-semibold text-ink">Recommendation</h3>
            <div className="mt-3 rounded-2xl border border-accent-line bg-accent-soft/70 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
                  <SparkleIcon size={15} />
                </span>
                <div className="min-w-0">
                  {readout.recommendation.divided ? (
                    <p className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-dissent/25 bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-dissent">
                      <FlagIcon size={12} />
                      The board is divided
                    </p>
                  ) : null}
                  <p className="font-display text-[19px] leading-[1.35] font-semibold text-accent-deep">
                    {readout.recommendation.summary}
                  </p>
                  {readout.recommendation.detail ? (
                    <p className={`mt-2 text-[14px] leading-[1.55] ${readout.recommendation.divided ? "text-dissent" : "text-ink-2"}`}>
                      {readout.recommendation.detail}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-8 md:grid-cols-2">
            <Section title="Options considered">
              <IconList items={readout.options} icon={ListIcon} />
            </Section>
            <Section title="Key tradeoffs">
              <IconList items={readout.tradeoffs} icon={ScaleIcon} />
            </Section>
            <Section title="Assumptions">
              <IconList items={readout.assumptions} icon={FlagIcon} />
            </Section>
            <Section title="Open questions">
              <IconList items={readout.openQuestions} icon={QuestionIcon} />
            </Section>
          </div>

          <Section title="Next steps">
            <NumberedList items={readout.nextActions} />
          </Section>

          <Section title="Closing comments">
            <ul className="flex flex-col gap-2">
              {readout.closingComments.map((comment) => {
                const persona = byId[comment.memberId];
                return (
                  <li key={comment.memberId} className="flex gap-3.5 rounded-xl border border-line bg-surface px-4 py-3.5">
                    {persona ? (
                      <Portrait src={persona.portrait} alt="" size={40} />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded-full border border-dashed border-line-strong" />
                    )}
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-baseline gap-x-2 text-[13px] font-semibold text-ink">
                        {comment.memberName}
                        {persona ? <span className="font-normal text-muted">{persona.company}</span> : null}
                        {comment.fallback ? (
                          <span className="rounded-full border border-line px-2 py-px text-[10.5px] font-medium text-muted">
                            last stated position
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1.5 font-display text-[15px] leading-[1.5] text-ink">{comment.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-[12px] text-muted">
              Generated {timeOf(readout.generatedAt)}
              {state.readoutRetrievedByGuestAt
                ? ` · Retrieved by ${state.guest?.name ?? "your agent"} via WebMCP at ${timeOf(state.readoutRetrievedByGuestAt)}`
                : ""}
              . Nothing is saved; copy or download before you leave.
            </p>
            <Button onClick={download}>
              <DownloadIcon size={15} />
              Download memo (.txt)
            </Button>
          </div>
        </div>
      </article>
    </PageShell>
  );
}
