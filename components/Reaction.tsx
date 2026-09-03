import type { ReactionKind } from "@/lib/types";

const LABELS: Record<ReactionKind, string> = {
  agree: "agrees",
  concern: "concern",
  disagree: "disagrees",
};

const GLYPHS: Record<ReactionKind, string> = {
  agree: "✓",
  concern: "!",
  disagree: "✕",
};

export function Reaction({ kind }: { kind: ReactionKind }) {
  return (
    <span className={`reaction-chip reaction-${kind}`}>
      <span aria-hidden>{GLYPHS[kind]}</span>
      {LABELS[kind]}
    </span>
  );
}
