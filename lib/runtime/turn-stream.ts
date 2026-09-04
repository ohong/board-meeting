import { parseControlLine } from "./prompts";
import type { MemberTurn } from "../types";

/**
 * Consumes a member's raw output stream into a spoken turn.
 *
 * A turn opens with a bracketed control line carrying orchestration metadata, so the
 * stream is held back until that line is complete and only the spoken part is ever emitted
 * to the room. `[pass]` resolves to an empty turn, which the meeting engine reads as the
 * member having nothing to add.
 */
export async function consumeTurnStream(
  chunks: AsyncIterable<string>,
  onDelta?: (delta: string) => void,
): Promise<MemberTurn> {
  let buffered = "";
  let controlDone = false;
  let emitted = "";
  let passed = false;

  for await (const chunk of chunks) {
    buffered += chunk;

    if (!controlDone) {
      const opensWithControlLine = buffered.trimStart().startsWith("[");
      // Wait for the whole control line before letting anything through.
      if (opensWithControlLine && !buffered.includes("\n")) continue;
      // A reply that never had a control line: nothing to hold back.
      if (!opensWithControlLine && buffered.trimStart().length === 0) continue;

      controlDone = true;
      passed = /^\s*\[\s*pass\s*\]\s*$/im.test(buffered.split("\n")[0]);
      const { rest } = parseControlLine(buffered);
      emitted = rest;
      if (rest && !passed) onDelta?.(rest);
      continue;
    }

    emitted += chunk;
    if (!passed) onDelta?.(chunk);
  }

  if (passed) return { text: "" };

  const { directives, rest } = parseControlLine(buffered);
  // A reply short enough to arrive in one chunk never reached the streaming branch.
  if (!emitted && rest) onDelta?.(rest);
  return { text: (emitted || rest).trim(), ...directives };
}
