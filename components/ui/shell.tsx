"use client";

import type { ReactNode } from "react";
import { CheckIcon } from "@/components/ui/icons";

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
      className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold tabular-nums transition-[background-color,border-color,color,box-shadow] duration-300 ease-out ${
        active
          ? "border-accent bg-accent text-white shadow-[0_4px_14px_-4px_var(--color-accent)]"
          : done
            ? "border-accent-line bg-accent-soft text-accent-deep"
            : "border-line bg-surface text-faint"
      }`}
    >
      {/* The two glyphs cross-fade in place, so completing a step doesn't jump. */}
      <span
        className={`absolute transition-opacity duration-200 ease-out ${done ? "opacity-0" : "opacity-100"}`}
      >
        {n}
      </span>
      <span className={`absolute transition-opacity duration-200 ease-out ${done ? "opacity-100" : "opacity-0"}`}>
        <CheckIcon size={14} />
      </span>
    </span>
  );
}

/**
 * The three steps on one rail. The rail fills toward the current step, which is
 * what turns three separate badges into a single sense of progress.
 */
export function Stepper({ current, compact = false }: { current: StepNumber; compact?: boolean }) {
  const progress = (current - 1) / (STEPS.length - 1);

  if (compact) {
    return (
      <ol aria-label="Progress" className="flex items-center gap-4">
        {STEPS.map((step) => {
          const active = step.n === current;
          return (
            <li
              key={step.n}
              aria-current={active ? "step" : undefined}
              className="flex items-center gap-2"
            >
              <StepBadge n={step.n} active={active} done={step.n < current} />
              <span
                className={`text-[12px] leading-tight font-semibold transition-colors duration-300 ${
                  active ? "text-ink" : step.n < current ? "text-ink-2" : "text-faint"
                }`}
              >
                {step.title}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div className="relative w-full max-w-[760px]">
      {/* Rail, behind the badges, aligned to their centres. */}
      <span aria-hidden className="absolute top-[13px] right-[14px] left-[14px] h-px bg-line" />
      <span
        aria-hidden
        className="absolute top-[13px] right-[14px] left-[14px] h-px origin-left bg-accent/70 transition-transform duration-500 ease-in-out"
        style={{ transform: `scaleX(${progress})` }}
      />

      <ol aria-label="Progress" className="relative flex items-start justify-between">
        {STEPS.map((step) => {
          const active = step.n === current;
          const done = step.n < current;
          return (
            <li
              key={step.n}
              aria-current={active ? "step" : undefined}
              className="flex min-w-0 flex-col items-center gap-2 text-center"
            >
              {/* A canvas-coloured halo keeps the rail from touching the badge. */}
              <span className="rounded-full bg-canvas px-1.5">
                <StepBadge n={step.n} active={active} done={done} />
              </span>
              <span className="min-w-0">
                <span
                  className={`block truncate text-[13px] leading-tight font-semibold transition-colors duration-300 ${
                    active ? "text-ink" : done ? "text-ink-2" : "text-faint"
                  }`}
                >
                  {step.title}
                </span>
                <span
                  className={`mt-0.5 hidden truncate text-[12px] transition-colors duration-300 sm:block ${
                    active ? "text-muted" : "text-faint"
                  }`}
                >
                  {step.detail}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function Masthead({ compact = false }: { compact?: boolean }) {
  return (
    <header className="text-center">
      <h1
        className={`font-display leading-[1.05] font-semibold text-ink ${
          compact ? "text-[24px] tracking-[-0.5px]" : "text-[32px] tracking-[-0.7px]"
        }`}
      >
        The Best Board Meeting You&rsquo;ve Ever Had.
      </h1>
      {compact ? null : (
        <p className="mt-2 text-[14px] text-muted">
          AI boardroom. Smarter decisions. Better outcomes.
        </p>
      )}
    </header>
  );
}

/** Full-page frame for the onboarding and memo steps: masthead, stepper, one card. */
export function PageShell({
  step,
  children,
  width = 880,
  masthead = true,
  hero,
}: {
  step: StepNumber;
  children: ReactNode;
  width?: number;
  masthead?: boolean;
  /** Full-size wordmark. Defaults to the first screen only — every screen after
   *  it should spend the height on content instead. */
  hero?: boolean;
}) {
  const large = hero ?? step === 1;
  return (
    <div className="flex min-h-screen flex-col items-center bg-canvas px-5 pt-6 pb-10 text-ink sm:px-8">
      {masthead ? <Masthead compact={!large} /> : null}
      <div className={`${masthead ? (large ? "mt-5" : "mt-4") : "mt-1"} flex w-full justify-center`}>
        <Stepper current={step} />
      </div>
      <main className="mt-6 w-full animate-screen-in" style={{ maxWidth: width }}>
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
      className={`animate-rise-in rounded-lg border px-3.5 py-2.5 text-[13px] leading-snug ${
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
    <p className={`text-[12px] font-semibold tracking-[0.14em] text-muted uppercase ${className}`}>{children}</p>
  );
}
