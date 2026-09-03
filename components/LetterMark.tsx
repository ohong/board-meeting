export function LetterMark({
  initials,
  size = "lg",
  dashed = false,
  onPaper = false,
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  dashed?: boolean;
  onPaper?: boolean;
}) {
  const classes = [
    "letter-mark",
    size,
    dashed ? "dashed" : "",
    onPaper ? "on-paper" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} aria-hidden>
      {dashed ? "" : initials}
    </div>
  );
}
