"use client";

import { Portrait } from "@/components/ui/portrait";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import type { PersonaSummary } from "@/lib/meeting/types";

/** One adviser row in the Board Setup list. The whole row toggles the seat. */
export function PersonaCard({
  persona,
  selected,
  index,
  disabled = false,
  onToggle,
}: {
  persona: PersonaSummary;
  selected: boolean;
  /** 1-based seat number when selected. */
  index: number | null;
  /** True when the board is full and this persona is not on it. */
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-colors duration-150 ${
        selected
          ? "border-accent-line bg-accent-soft/60"
          : disabled
            ? "border-line bg-surface opacity-60"
            : "border-line bg-surface hover:border-line-strong hover:bg-surface-2/60"
      }`}
    >
      <span className="relative shrink-0">
        <Portrait src={persona.portrait} alt="" size={52} className={selected ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""} />
        {index ? (
          <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white ring-2 ring-surface tabular-nums">
            {index}
          </span>
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] leading-tight font-semibold text-ink">{persona.name}</span>
        <span className="mt-1 block truncate text-[12.5px] leading-snug text-ink-2">{persona.role}</span>
        <span className="mt-1 block truncate text-[12px] leading-snug text-muted">
          {persona.lenses.slice(0, 3).join(" · ")}
        </span>
      </span>

      <span
        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-semibold transition-colors ${
          selected
            ? "border-accent bg-accent text-white"
            : "border-line bg-surface text-ink-2 group-hover:border-line-strong group-hover:text-ink"
        }`}
      >
        {selected ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
        {selected ? "Added" : "Add"}
      </span>
    </button>
  );
}
