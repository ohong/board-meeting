import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MEETING_STAGES, MeetingProgress } from "../components/MeetingProgress";
import type { Phase } from "../lib/types";

describe("meeting progress", () => {
  it("renders the full four-stage sequence with one accessible current step", () => {
    const html = renderToStaticMarkup(createElement(MeetingProgress, { current: "brief" }));

    expect(MEETING_STAGES.map((stage) => stage.phase)).toEqual([
      "select",
      "brief",
      "meeting",
      "readout",
    ]);
    expect(html).toContain('aria-label="Meeting progress"');
    expect(html.match(/<li/g)).toHaveLength(4);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain("2 of 4 · Write brief");
  });

  it.each<Phase>(["select", "brief", "meeting", "readout"])(
    "marks %s as current",
    (current) => {
      const html = renderToStaticMarkup(createElement(MeetingProgress, { current }));
      const currentLabel = MEETING_STAGES.find((stage) => stage.phase === current)?.label;

      expect(html).toContain(`data-state="current" aria-current="step">${currentLabel}</li>`);
    },
  );
});
