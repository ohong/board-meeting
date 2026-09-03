import type { ReactionKind } from "@/lib/types";

const LABELS: Record<ReactionKind, string> = {
  agree: "agrees",
  concern: "concern",
  disagree: "disagrees",
  want_to_respond: "wants in",
};

const GLYPHS: Record<ReactionKind, string> = {
  agree: "✓",
  concern: "!",
  disagree: "✕",
  want_to_respond: "↑",
};

export function Reaction({ kind }: { kind: ReactionKind }) {
  return (
    <span className={`reaction-chip reaction-${kind}`}>
      <span aria-hidden>{GLYPHS[kind]}</span>
      {LABELS[kind]}
    </span>
  );
}
