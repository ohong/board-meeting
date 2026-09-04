"use client";

import type { ReactNode } from "react";

/**
 * The product is three steps. Every screen renders the same stepper so the user
 * always knows where they are; the boardroom renders it compact to save height.
 */
export const STEPS = [
  { n: 1, title: "Board Setup", detail: "Curate the right mix of expertise." },
  { n: 2, title: "Live Boardroom", detail: "Chair the discussion in real time." },
  { n: 3, title: "Executive Memo", detail: "Concise recommendation. Clear next steps." },
] as const;

export type StepNumber = (typeof STEPS)[number]["n"];

export function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border font-display text-[15px] font-semibold tabular-nums transition-colors ${
        active
          ? "border-accent bg-accent text-white shadow-[0_6px_16px_-6px_var(--color-accent)]"
          : done
            ? "border-accent-line bg-accent-soft text-accent-deep"
            : "border-line bg-surface text-muted"
      }`}
    >
      {n}
    </span>
  );
}

export function Stepper({ current, compact = false }: { current: StepNumber; compact?: boolean }) {
  return (
    <ol
      aria-label="Progress"
      className={`flex items-center ${compact ? "gap-5" : "w-full max-w-[1180px] justify-between gap-8"}`}
    >
      {STEPS.map((step) => {
        const active = step.n === current;
        const done = step.n < current;
        return (
          <li
            key={step.n}
            aria-current={active ? "step" : undefined}
            className={`flex items-center gap-3 ${compact ? "" : "min-w-0 flex-1"}`}
          >
            <StepBadge n={step.n} active={active} done={done} />
            <span className="min-w-0">
              <span
                className={`block truncate text-[14px] leading-tight font-semibold ${
                  active ? "text-ink" : done ? "text-ink-2" : "text-muted"
                } ${compact ? "text-[13px]" : ""}`}
              >
                {step.title}
              </span>
              {compact ? null : (
                <span className="mt-0.5 block truncate text-[12px] text-muted">{step.detail}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Masthead() {
  return (
    <header className="text-center">
      <h1 className="font-display text-[clamp(34px,4.6vw,60px)] leading-[1.02] font-medium tracking-[-0.025em] text-ink">
        The Best Board Meeting You&rsquo;ve Ever Had.
      </h1>
      <p className="mt-3 text-[clamp(15px,1.4vw,20px)] text-muted">
        AI boardroom. Smarter decisions. Better outcomes.
      </p>
    </header>
  );
}

/** Full-page frame for the onboarding and memo steps: masthead, stepper, one card. */
export function PageShell({
  step,
  children,
  width = 880,
  masthead = true,
}: {
  step: StepNumber;
  children: ReactNode;
  width?: number;
  masthead?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-canvas px-6 pt-10 pb-16 text-ink sm:px-10">
      {masthead ? <Masthead /> : null}
      <div className={`${masthead ? "mt-10" : "mt-2"} flex w-full justify-center`}>
        <Stepper current={step} />
      </div>
      <main className="mt-7 w-full" style={{ maxWidth: width }}>
        {children}
      </main>
    </div>
  );
}

/** Inline, dismiss-on-timeout notice used by every screen. */
export function Notice({ text, tone = "warn" }: { text: string; tone?: "warn" | "info" }) {
  return (
    <p
      role="status"
      className={`animate-rise-in rounded-xl border px-3.5 py-2.5 text-[13px] leading-snug ${
        tone === "warn"
          ? "border-dissent/25 bg-dissent-soft text-dissent"
          : "border-line bg-surface-2 text-ink-2"
      }`}
    >
      {text}
    </p>
  );
}

/** Section label used inside cards: small, tracked, quiet. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-semibold tracking-[0.14em] text-muted uppercase ${className}`}>{children}</p>
  );
}
