"use client";

import type { GuestParticipant, GuestStatus } from "@/lib/meeting/types";

const GUEST_LABEL: Record<GuestStatus, string> = {
  empty: "Empty seat",
  joining: "Joining…",
  joined: "Joined via WebMCP",
  contributing: "Adding context",
  asking: "Asking a question",
};

/** Two-letter identity mark for the joined agent (no portrait exists for it). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function GuestSeat({ guest }: { guest: GuestParticipant | null }) {
  const seated = !!guest && guest.status !== "empty";
  const active = guest?.status === "contributing" || guest?.status === "asking";

  return (
    <div className="w-[140px] text-center">
      {seated ? (
        <div key="seated" className="animate-seat-in">
          <span
            className={`mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-full bg-room-3 font-display text-[22px] font-semibold text-brass transition-shadow duration-300 ${
              guest.status === "joining"
                ? "animate-pulse-soft shadow-[0_0_0_2px_var(--color-brass-dim)]"
                : active
                  ? "shadow-[0_0_0_2px_var(--color-brass),0_0_26px_-4px_var(--color-brass)]"
                  : "shadow-[0_0_0_2px_var(--color-brass-dim)]"
            }`}
          >
            {initials(guest.name)}
          </span>
          <span className="mt-2 block truncate text-[13px] leading-tight font-semibold text-ink">
            {guest.name}
          </span>
          <span className="mt-0.5 block text-[11px] text-muted">Your agent</span>
        </div>
      ) : (
        <div>
          <span
            aria-hidden
            className="mx-auto block h-[68px] w-[68px] rounded-full border border-dashed border-brass/45"
            style={{
              background:
                "repeating-linear-gradient(-45deg, transparent, transparent 5px, color-mix(in oklch, var(--color-brass), transparent 88%) 5px, color-mix(in oklch, var(--color-brass), transparent 88%) 6px)",
            }}
          />
          <span className="mt-2 block text-[13px] leading-tight font-semibold text-muted">Your agent</span>
          <span className="mt-0.5 block text-[11px] text-faint">Empty seat</span>
        </div>
      )}
      <div className="mt-1.5 flex h-[20px] items-center justify-center">
        {seated ? (
          <span
            className={`inline-block rounded-[2px] px-1.5 py-[2px] text-[10px] tracking-[0.08em] uppercase ${
              active ? "bg-brass text-walnut-deep font-semibold" : "text-brass-dim"
            } ${guest.status === "joining" ? "animate-pulse-soft" : ""}`}
          >
            {GUEST_LABEL[guest.status]}
          </span>
        ) : (
          <span className="text-[10px] tracking-[0.08em] text-faint uppercase">Reserved</span>
        )}
      </div>
    </div>
  );
}
