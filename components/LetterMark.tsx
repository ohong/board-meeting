export function LetterMark({
  initials,
  size = "lg",
  variant = "member",
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  variant?: "member" | "guest" | "vacant";
}) {
  const variantClass = variant === "member" ? "" : ` ${variant}`;
  return (
    <div className={`letter-mark ${size}${variantClass}`} aria-hidden>
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
