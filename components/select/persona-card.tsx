"use client";

import { Portrait } from "@/components/ui/portrait";
import type { PersonaSummary } from "@/lib/meeting/types";

export function PersonaCard({
  persona,
  selected,
  index,
  onToggle,
}: {
  persona: PersonaSummary;
  selected: boolean;
  /** 1-based seat number when selected, for the badge. */
  index: number | null;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`group relative flex h-full flex-col items-start gap-3 rounded-sm border p-4 text-left transition-colors duration-150 ${
        selected
          ? "border-paper-ink bg-paper-2 shadow-[0_1px_0_0_var(--color-paper-ink)]"
          : "border-rule bg-paper hover:border-paper-muted"
      }`}
    >
      <div className="flex w-full items-start gap-3">
        <Portrait src={persona.portrait} alt={persona.name} size={56} grayscale />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[17px] leading-tight font-semibold text-paper-ink">
            {persona.name}
          </span>
          <span className="mt-1 block text-[12px] leading-snug text-paper-muted">{persona.role}</span>
        </span>
        <span
          aria-hidden
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
            selected ? "border-paper-ink bg-paper-ink text-paper" : "border-rule text-transparent"
          }`}
        >
          {index ?? ""}
        </span>
      </div>

      {/* Voice sample fades in on hover inside a reserved box, so the grid never reflows. */}
      <span className="mt-auto block h-[46px] w-full overflow-hidden opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="block font-display text-[13px] leading-snug text-paper-ink italic">
          &ldquo;{persona.voiceSample}&rdquo;
        </span>
      </span>
      <span className="block w-full text-[11px] tracking-wide text-paper-muted uppercase">
        {persona.lenses.slice(0, 3).join(" · ")}
      </span>
    </button>
  );
}
