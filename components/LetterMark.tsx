export function LetterMark({
  initials,
  size = "lg",
  dashed = false,
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  dashed?: boolean;
}) {
  if (dashed) {
    return (
      <div
        className={`letter-mark ${size}`}
        style={{
          background: "transparent",
          border: "1px dashed oklch(78% 0.08 80 / 0.45)",
          boxShadow: "0 0 0 2px var(--bg), 0 0 0 3px oklch(78% 0.08 80 / 0.35)",
          color: "var(--brass)",
        }}
        aria-hidden
      >
        {initials}
      </div>
    );
  }
  return (
    <div className={`letter-mark ${size}`} aria-hidden>
      {initials}
    </div>
  );
}
