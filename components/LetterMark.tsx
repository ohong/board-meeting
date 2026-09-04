/**
 * One portrait frame for every participant. The roster has no licensed portraits, so the
 * frame holds a typographic monogram — the design's stated fallback. Every adviser gets the
 * identical treatment: they are told apart by name, role and behaviour, never by colour.
 */
export function Portrait({
  initials,
  size = "md",
  variant = "member",
  label,
}: {
  initials: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "member" | "guest" | "vacant";
  /** The person's name, so the frame is not silent to assistive technology. */
  label?: string;
}) {
  const variantClass = variant === "member" ? "" : ` portrait-${variant}`;
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
