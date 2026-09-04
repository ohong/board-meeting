import type { GuestStatus, ReactionKind, SeatStatus } from "@/lib/types";

/**
 * The words the room uses for its own states. Factual, present tense, no theatrical
 * narration — design/design-engineer-instructions.md, "System language".
 */
export const SEAT_STATE: Record<SeatStatus, string> = {
  thinking: "Considering privately",
  ready: "Ready",
  speaking: "Speaking",
  wants_to_respond: "Wants in",
  reconnecting: "Reconnecting…",
};

export const REACTION: Record<ReactionKind, string> = {
  agree: "Agrees",
  concern: "Reconsidering",
  disagree: "Pushes back",
};

export const GUEST_STATE: Record<GuestStatus, string> = {
  empty: "Open place",
  waiting: "Waiting for your agent",
  joining: "Joining",
  joined: "Guest agent · WebMCP",
  contributing: "Sharing context",
  asking: "Asking a board member",
};
