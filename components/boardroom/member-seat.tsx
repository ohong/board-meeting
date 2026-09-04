"use client";

import { Portrait } from "@/components/ui/portrait";
import { RefreshIcon } from "@/components/ui/icons";
import type { MemberParticipant, ReactionKind } from "@/lib/meeting/types";

const REACTION_WORD: Record<ReactionKind, string> = {
  agree: "Agrees",
  disagree: "Disagrees",
  concern: "Concerned",
  curious: "Curious",
};

/** Three animated bars: the "is talking" mark next to the speaker. */
export function Equalizer({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-flex h-3 items-end gap-[2px] ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-[2.5px] animate-dots rounded-full bg-current"
          style={{ height: i === 1 ? "100%" : "62%", animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}

function Tag({
  children,
  tone,
  pulse = false,
}: {
  children: React.ReactNode;
  tone: "accent" | "warn" | "quiet" | "bad" | "live";
  pulse?: boolean;
}) {
  const tones = {
    accent: "border-transparent bg-ink text-surface shadow-[0_4px_12px_-6px_rgb(0_0_0/0.6)]",
    warn: "border-warn/40 bg-warn/12 text-ink-2",
    quiet: "border-line bg-surface text-muted",
    bad: "border-dissent/30 bg-dissent-soft text-dissent",
    live: "border-live/30 bg-live-soft text-ink-2",
  } as const;
  return (
    <span
      /* One `animate-*` at a time: both set the `animation` shorthand, so a
         second class silently replaces the first. */
      className={`inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-semibold whitespace-nowrap ${tones[tone]} ${
        pulse ? "animate-pulse-soft" : "animate-pop-in"
      }`}
    >
      {children}
    </span>
  );
}

/** Presence dot colour per status. Ready members are quietly green like a call roster. */
function dotClass(status: MemberParticipant["status"]): string {
  switch (status) {
    case "speaking":
      return "bg-accent";
    case "wants-to-respond":
    case "reacting":
      return "bg-warn";
    case "forming":
    case "retrying":
      return "bg-faint animate-pulse-soft";
    case "failed":
      return "bg-dissent";
    default:
      return "bg-live";
  }
}

export function MemberSeat({
  member,
  dimmed = false,
  onSelect,
  onRetry,
}: {
  member: MemberParticipant;
  /** True while somebody else holds the floor: this seat steps back a little. */
  dimmed?: boolean;
  onSelect: () => void;
  onRetry: () => void;
}) {
  const speaking = member.status === "speaking";
  const thinking = member.status === "forming" || member.status === "retrying";
  const unavailable = member.status === "failed";

  let tag: React.ReactNode = null;
  if (member.status === "forming") tag = <Tag tone="quiet" pulse>Thinking&hellip;</Tag>;
  else if (speaking)
    tag = (
      <Tag tone="accent">
        <Equalizer />
        Speaking
      </Tag>
    );
  else if (member.status === "wants-to-respond") tag = <Tag tone="warn">Wants to respond</Tag>;
  else if (member.status === "reacting" && member.reaction)
    tag = <Tag tone={member.reaction.kind === "agree" ? "live" : "warn"}>{REACTION_WORD[member.reaction.kind]}</Tag>;
  else if (member.status === "retrying") tag = <Tag tone="warn" pulse>Reconnecting&hellip;</Tag>;
  else if (unavailable)
    tag = (
      <button
        type="button"
        onClick={onRetry}
        className="press inline-flex h-[22px] animate-pop-in items-center gap-1 rounded-full border border-dissent/30 bg-dissent-soft px-2.5 text-[12px] font-semibold text-dissent transition-[background-color,transform] duration-200 ease-out hover:bg-dissent/15"
      >
        <RefreshIcon size={14} />
        Unavailable · retry
      </button>
    );

  return (
    <div className="w-[150px] text-center">
      <button
        type="button"
        onClick={onSelect}
        title={`Call on ${member.persona.name}`}
        className="press group block w-full cursor-pointer rounded-lg transition-transform duration-150 ease-out"
      >
        <span className="relative mx-auto block w-fit">
          {/* A ring that breathes while this member is still forming a view. */}
          {thinking ? (
            <span
              aria-hidden
              className="absolute -inset-1 animate-breathe rounded-full border border-accent-line"
            />
          ) : null}
          <span
            className={`relative block rounded-full bg-surface p-[3px] transition-shadow duration-400 ease-out ${
              speaking
                ? "shadow-[var(--shadow-seat-lit)]"
                : "shadow-[var(--shadow-seat)] group-hover:shadow-[0_0_0_2px_var(--color-line-strong),0_8px_22px_-8px_rgb(0_0_0/0.22)]"
            }`}
          >
            <Portrait
              src={member.persona.portrait}
              alt={member.persona.name}
              size={64}
              className={unavailable ? "opacity-45 grayscale" : ""}
            />
          </span>
          <span
            aria-hidden
            className={`absolute right-[3px] bottom-[3px] h-3 w-3 rounded-full ring-2 ring-surface transition-colors duration-300 ${dotClass(member.status)}`}
          />
        </span>
        <span
          className={`mt-2 block text-[13px] leading-tight font-semibold transition-colors duration-400 ease-out ${
            speaking ? "text-ink" : dimmed ? "text-ink-2/70" : "text-ink"
          }`}
        >
          {member.persona.name}
        </span>
        <span
          className={`mt-0.5 block truncate text-[12px] transition-colors duration-400 ease-out ${
            dimmed && !speaking ? "text-faint" : "text-muted"
          }`}
        >
          {member.persona.company}
        </span>
      </button>
      <div className="mt-1.5 flex h-[22px] items-center justify-center">{tag}</div>
    </div>
  );
}
