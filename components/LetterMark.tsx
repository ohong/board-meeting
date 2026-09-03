/**
 * Advisers have no portraits, so a monogram carries their identity. A deterministic hue per
 * person keeps the table from reading as six identical discs, held inside the room's warm
 * range so it still looks like brass and walnut rather than a colour wheel.
 */
function hueFor(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  return 22 + (hash % 88);
}

export function LetterMark({
  initials,
  seed,
  size = "lg",
  variant = "member",
}: {
  initials: string;
  /** Whatever identifies this person; the same seed always gives the same hue. */
  seed?: string;
  size?: "sm" | "md" | "lg";
  variant?: "member" | "guest" | "vacant";
}) {
  const variantClass = variant === "member" ? "" : ` ${variant}`;
  const hue = variant === "member" && seed ? hueFor(seed) : undefined;
  return (
    <div
      className={`letter-mark ${size}${variantClass}`}
      style={hue === undefined ? undefined : ({ "--mark-hue": String(hue) } as React.CSSProperties)}
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
