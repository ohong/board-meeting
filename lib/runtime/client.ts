import { createBrowserRuntime } from "./browser";
import { createMockRuntime } from "./mock";
import type { BoardRuntime } from "../types";

export const NO_KEY_MESSAGE =
  "No OPENAI_API_KEY is configured, so the board is running its deterministic stand-in. The room, the orchestration and the WebMCP tools all work; the advisers are reading from a script. Add OPENAI_API_KEY to seat the live agents.";

export type RuntimeStatus = { live: boolean; message: string | null };

/**
 * The page opens straight into board selection without waiting on anything, so which
 * runtime to use is resolved lazily and only when the first agent call is made.
 */
export function createDeferredRuntime(onResolved?: (status: RuntimeStatus) => void): BoardRuntime {
  const mock = createMockRuntime({ chunkDelayMs: 22 });
  const live = createBrowserRuntime();
  let resolution: Promise<BoardRuntime> | null = null;

  function resolve(): Promise<BoardRuntime> {
    resolution ??= fetch("/api/runtime-status")
      .then((response) => response.json() as Promise<{ live: boolean }>)
      .then(({ live: isLive }) => {
        onResolved?.({ live: isLive, message: isLive ? null : NO_KEY_MESSAGE });
        return isLive ? live : mock;
      })
      .catch(() => {
        onResolved?.({ live: false, message: NO_KEY_MESSAGE });
        return mock;
      });
    return resolution;
  }

  return {
    id: "live",
    async formOpeningPosition(input) {
      return (await resolve()).formOpeningPosition(input);
    },
    async publicTurn(input, onDelta) {
      return (await resolve()).publicTurn(input, onDelta);
    },
    async closingComment(input) {
      return (await resolve()).closingComment(input);
    },
    async synthesis(input) {
      return (await resolve()).synthesis(input);
    },
    async readout(input) {
      return (await resolve()).readout(input);
    },
  };
}
