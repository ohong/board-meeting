import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SelectBoard } from "../components/SelectBoard";
import { createMeetingSession } from "../lib/session";

describe("board selection shortcuts", () => {
  it("offers the restrained demo-board action beside the adviser library", () => {
    const session = createMeetingSession();
    const html = renderToStaticMarkup(
      createElement(SelectBoard, { session, state: session.getState() }),
    );

    expect(html).toMatch(/Adviser library[\s\S]*Use demo board/);
    expect(html).toContain('class="demo-board-action"');
    expect(html).toContain('type="button"');
  });
});
