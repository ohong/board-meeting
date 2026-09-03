/**
 * Runtime factory — OWNED BY THE ORCHESTRATION WORKSTREAM.
 *
 * Returns the live runtime (fetches /api/board/*) or the deterministic mock runtime
 * when NEXT_PUBLIC_BOARD_RUNTIME=mock.
 *
 * TODO(orchestration): implement ./live.ts and ./mock.ts and select here.
 */
import type { BoardRuntime } from "../types";

export function createRuntime(): BoardRuntime {
  const notReady = async (): Promise<never> => {
    throw new Error("BoardRuntime not implemented yet");
  };
  return {
    openingPosition: notReady,
    turn: notReady,
    react: notReady,
    closingComment: notReady,
    synthesis: notReady,
    readout: notReady,
  };
}
