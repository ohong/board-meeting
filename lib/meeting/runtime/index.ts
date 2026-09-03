/**
 * Runtime factory — OWNED BY THE ORCHESTRATION WORKSTREAM.
 *
 * Returns the live runtime (fetches /api/board/*) or the deterministic mock runtime
 * when NEXT_PUBLIC_BOARD_RUNTIME=mock.
 *
 */
import type { BoardRuntime } from "../types";
import { createLiveRuntime } from "./live";
import { createMockRuntime } from "./mock";

export function createRuntime(): BoardRuntime {
  const queryMock = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("runtime") === "mock";
  return process.env.NEXT_PUBLIC_BOARD_RUNTIME === "mock" || queryMock ? createMockRuntime() : createLiveRuntime();
}
