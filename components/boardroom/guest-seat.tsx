"use client";

import { Button } from "@/components/ui/button";
import { PlugIcon } from "@/components/ui/icons";
import type { GuestParticipant, GuestStatus } from "@/lib/meeting/types";

const GUEST_LABEL: Record<GuestStatus, string> = {
  empty: "Seat reserved",
  joining: "Joining…",
  joined: "Connected",
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

/**
 * The one external-agent seat, drawn as a compact card at the edge of the room
 * rather than as a chair on the ring, so an empty seat never reads as a missing
 * board member and never collides with the lowest member seats.
 */
export function GuestSeat({
  guest,
  canInvite,
  onInvite,
}: {
  guest: GuestParticipant | null;
  canInvite: boolean;
  onInvite: () => void;
}) {
  const seated = !!guest && guest.status !== "empty";
  const active = guest?.status === "contributing" || guest?.status === "asking";
  const joining = guest?.status === "joining";

  return (
    <div
      className={`flex w-[300px] items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors ${
        seated ? "card animate-seat-in" : "border-dashed border-line-strong bg-surface/80"
      }`}
    >
      {seated ? (
        <span
          aria-hidden
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-[15px] font-semibold text-accent-deep transition-shadow duration-300 ${
            joining
              ? "animate-pulse-soft shadow-[0_0_0_2px_var(--color-accent-line)]"
              : active
                ? "shadow-[0_0_0_2px_var(--color-accent),0_10px_28px_-8px_var(--color-accent)]"
                : "shadow-[0_0_0_2px_var(--color-accent-line)]"
          }`}
        >
          {initials(guest.name)}
        </span>
      ) : (
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-faint"
        >
          <PlugIcon size={18} />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] leading-tight font-semibold text-ink" title={seated ? guest.name : undefined}>
          {seated ? guest.name : "Your personal agent"}
        </span>
        <span
          className={`mt-1 flex items-center gap-1.5 text-[11.5px] leading-tight ${
            active ? "font-medium text-accent-deep" : "text-muted"
          } ${joining ? "animate-pulse-soft" : ""}`}
        >
          {seated ? (
            <span
              aria-hidden
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                joining ? "bg-faint" : active ? "animate-pulse-soft bg-accent" : "bg-live"
              }`}
            />
          ) : null}
          <span className="truncate">
            {GUEST_LABEL[guest?.status ?? "empty"]} &middot; WebMCP
          </span>
        </span>
      </span>

      {seated ? null : (
        <Button size="sm" onClick={onInvite} disabled={!canInvite}>
          Invite
        </Button>
      )}
    </div>
  );
}
