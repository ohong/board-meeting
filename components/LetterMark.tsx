/**
 * One identity frame for every participant, per the design's portrait rules. Where a
 * licensed portrait exists it is normalised to a single low-saturation treatment so
 * inconsistent source photography does not fragment the room; where it does not, the same
 * frame holds a typographic monogram. Never a broken image, never a generated face.
 *
 * The treatment is identical for every adviser: they are told apart by name, role and
 * behaviour, not by colour.
 */
export function Portrait({
  initials,
  slug,
  size = "md",
  variant = "member",
  label,
}: {
  initials: string;
  /** When set and the adviser has a bundled portrait, the photograph is used. */
  slug?: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "member" | "guest" | "vacant";
  /** The person's name, so the frame is not silent to assistive technology. */
  label?: string;
}) {
  const variantClass = variant === "member" ? "" : ` portrait-${variant}`;

  if (slug && variant === "member") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a fixed-size local asset
      <img
        src={`/guests/${slug}.webp`}
        alt={label ?? ""}
        aria-hidden={label ? undefined : true}
        className={`portrait portrait-${size} portrait-photo`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className={`portrait portrait-${size}${variantClass}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
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
