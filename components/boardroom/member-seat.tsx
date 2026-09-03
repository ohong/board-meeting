"use client";

import { Portrait } from "@/components/ui/portrait";
import type { MemberParticipant, ReactionKind } from "@/lib/meeting/types";

const REACTION_WORD: Record<ReactionKind, string> = {
  agree: "Agrees",
  disagree: "Disagrees",
  concern: "Concerned",
  curious: "Curious",
};

const REACTION_GLYPH: Record<ReactionKind, string> = {
  agree: "✓",
  disagree: "✕",
  concern: "!",
  curious: "?",
};

function Chip({
  children,
  tone = "quiet",
  pulse = false,
}: {
  children: React.ReactNode;
  tone?: "quiet" | "brass" | "warn" | "bad";
  pulse?: boolean;
}) {
  const tones = {
    quiet: "text-faint",
    brass: "bg-brass text-walnut-deep font-semibold",
    warn: "text-brass",
    bad: "text-dissent",
  } as const;
  return (
    <span
      className={`inline-block rounded-[2px] px-1.5 py-[2px] text-[10px] tracking-[0.08em] uppercase ${tones[tone]} ${
        pulse ? "animate-pulse-soft" : ""
      }`}
    >
      {children}
    </span>
  );
}

export function MemberSeat({
  member,
  onSelect,
  onRetry,
}: {
  member: MemberParticipant;
  onSelect: () => void;
  onRetry: () => void;
}) {
  const speaking = member.status === "speaking";
  const unavailable = member.status === "failed";

  let chip: React.ReactNode = <Chip>Ready</Chip>;
  if (member.status === "forming") chip = <Chip pulse>Thinking&hellip;</Chip>;
  else if (member.status === "idle") chip = <Chip>Seated</Chip>;
  else if (member.status === "speaking") chip = <Chip tone="brass">Speaking</Chip>;
  else if (member.status === "wants-to-respond") chip = <Chip tone="warn">Wants to respond</Chip>;
  else if (member.status === "reacting" && member.reaction)
    chip = (
      <Chip tone="warn">
        <span aria-hidden className="mr-1">
          {REACTION_GLYPH[member.reaction.kind]}
        </span>
        {REACTION_WORD[member.reaction.kind]}
      </Chip>
    );
  else if (member.status === "retrying") chip = <Chip tone="warn" pulse>Reconnecting&hellip;</Chip>;
  else if (unavailable) chip = <Chip tone="bad">Unavailable</Chip>;

  return (
    <div className="w-[140px] text-center">
      <button
        type="button"
        onClick={onSelect}
        title={`Call on ${member.persona.name}`}
        className="block w-full cursor-pointer"
      >
        <span
          className={`mx-auto block w-fit rounded-full p-[3px] transition-shadow duration-300 ${
            speaking
              ? "shadow-[0_0_0_2px_var(--color-brass),0_0_26px_-4px_var(--color-brass)]"
              : unavailable
                ? "shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-dissent),transparent_45%)]"
                : "shadow-[0_0_0_1px_color-mix(in_oklch,var(--color-brass),transparent_72%)]"
          }`}
        >
          <Portrait
            src={member.persona.portrait}
            alt={member.persona.name}
            size={68}
            className={member.status === "forming" ? "animate-pulse-soft" : unavailable ? "opacity-45" : ""}
          />
        </span>
        <span className="mt-2 block text-[13px] leading-tight font-semibold text-ink">
          {member.persona.name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted">{member.persona.company}</span>
      </button>
      <div className="mt-1.5 flex h-[20px] items-center justify-center">{chip}</div>
      {unavailable ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-0.5 rounded-[2px] border border-dissent/50 px-2 py-[2px] text-[10px] tracking-wide text-dissent uppercase transition-colors duration-150 hover:bg-dissent/15"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
