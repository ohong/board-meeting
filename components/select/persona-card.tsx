"use client";

import { Portrait } from "@/components/ui/portrait";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import type { PersonaSummary } from "@/lib/meeting/types";

/** One adviser tile in the Board Setup grid. The whole tile toggles the seat. */
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
      className={`lift press-sm group relative flex h-full w-full items-start gap-3.5 rounded-2xl border p-3.5 text-left ${
        selected
          ? "border-ink/25 bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.06),0_10px_24px_-16px_rgb(0_0_0/0.35)]"
          : disabled
            ? "border-line bg-surface opacity-55"
            : "border-line bg-surface hover:border-line-strong hover:shadow-[var(--shadow-card)]"
      }`}
    >
      <span className="relative shrink-0">
        <Portrait
          src={persona.portrait}
          alt=""
          size={48}
          className={`transition-shadow duration-300 ease-out ${
            selected
              ? "shadow-[0_0_0_2px_var(--color-accent),0_0_0_4px_var(--color-surface)]"
              : "shadow-[0_0_0_1px_var(--color-line)]"
          }`}
        />
        {index ? (
          <span className="absolute -right-1 -bottom-1 flex h-5 w-5 animate-pop-bounce items-center justify-center rounded-full bg-accent text-[12px] font-bold text-white ring-2 ring-surface tabular-nums">
            {index}
          </span>
        ) : null}
      </span>

      <span className="min-w-0 flex-1 pr-7">
        <span className="block truncate text-[14px] leading-tight font-semibold text-ink">{persona.name}</span>
        <span className="mt-1 block truncate text-[12px] leading-snug text-ink-2">{persona.role}</span>
        <span className="mt-2 flex flex-wrap gap-1">
          {persona.lenses.slice(0, 2).map((lens) => (
            <span
              key={lens}
              className={`truncate rounded-lg px-1.5 py-0.5 text-[12px] leading-[1.35] font-medium transition-colors duration-300 ${
                selected ? "bg-surface-2 text-ink-2" : "bg-surface-2 text-muted"
              }`}
            >
              {lens}
            </span>
          ))}
        </span>
      </span>

      {/* State mark, top right: the tile is the control, this is the readout. */}
      <span
        className={`absolute top-3.5 right-3.5 flex h-6 w-6 items-center justify-center rounded-full border transition-[background-color,border-color,color] duration-200 ease-out ${
          selected
            ? "border-accent bg-accent text-white"
            : "border-line bg-surface text-faint group-hover:border-line-strong group-hover:text-ink-2"
        }`}
      >
        {selected ? <CheckIcon size={14} /> : <PlusIcon size={14} />}
      </span>
    </button>
  );
}
