/**
 * Meeting orchestration engine — OWNED BY THE ORCHESTRATION WORKSTREAM.
 *
 * Drives the async meeting loop (opening positions, turns, reactions, queue,
 * closing, readout) through MeetingSession's engine mutators using a BoardRuntime.
 *
 * TODO(orchestration): implement. This stub only keeps the app bootable.
 */
import type { MeetingSession } from "./session";
import type { BoardRuntime } from "./types";

export interface MeetingEngine {
  dispose(): void;
}

export function createEngine(session: MeetingSession, runtime: BoardRuntime): MeetingEngine {
  void session;
  void runtime;
  return { dispose() {} };
}
