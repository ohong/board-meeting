import type { Phase } from "@/lib/types";

export const MEETING_STAGES: ReadonlyArray<{ phase: Phase; label: string }> = [
  { phase: "select", label: "Choose board" },
  { phase: "brief", label: "Write brief" },
  { phase: "meeting", label: "Meet" },
  { phase: "readout", label: "Readout" },
];

export function MeetingProgress({
  current,
  className = "",
}: {
  current: Phase;
  className?: string;
}) {
  const currentIndex = MEETING_STAGES.findIndex((stage) => stage.phase === current);
  const currentStage = MEETING_STAGES[currentIndex];

  return (
    <nav
      className={`meeting-progress ${className}`.trim()}
      aria-label="Meeting progress"
    >
      <ol>
        {MEETING_STAGES.map((stage, index) => (
          <li
            key={stage.phase}
            data-state={index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming"}
            aria-current={index === currentIndex ? "step" : undefined}
          >
            {stage.label}
          </li>
        ))}
      </ol>
      <span className="meeting-progress-mobile" aria-hidden="true">
        {currentIndex + 1} of {MEETING_STAGES.length} · {currentStage.label}
      </span>
    </nav>
  );
}
