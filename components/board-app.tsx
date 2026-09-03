"use client";

/**
 * Top-level product state switch — OWNED BY THE UI WORKSTREAM.
 * selecting | briefing -> onboarding; forming | discussion | closing -> boardroom; readout -> readout.
 */
import { useMeetingState } from "@/lib/meeting/context";
import type { PersonaSummary } from "@/lib/meeting/types";

export function BoardApp({ catalog }: { catalog: PersonaSummary[] }) {
  const state = useMeetingState();
  return (
    <main className="flex-1 p-8">
      <h1 className="text-2xl font-semibold">The Best Board Meeting You've Ever Had</h1>
      <p className="mt-2 text-sm opacity-70">
        Phase: {state.phase}. Catalog: {catalog.length} advisers. (UI workstream replaces this.)
      </p>
    </main>
  );
}
