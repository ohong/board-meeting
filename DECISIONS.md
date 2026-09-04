# Decisions

## 2026-09-03 — Serialize meeting commands on one promise lane

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

The session engine serializes chair messages, adviser turns, guest actions, synthesis requests, and meeting closure on one promise tail. Independent opening positions and closing comments remain parallel. A generation token invalidates queued or late work after reset.

We considered an explicit queue-and-drain state machine with cancellation records. That approach would expose more queue internals, but it would also introduce more intermediate states and a broader rewrite. The promise lane preserves invocation order with less machinery, while the generation token keeps stale completions from mutating a fresh session.

Runtime calls get one retry. If a public turn still fails, the transcript publishes a clearly labeled recovery from that member's private opening so the readout cannot bypass the invariant that every adviser has a public contribution. If final synthesis fails twice, the engine assembles a faithful briefing- and transcript-derived readout without demo-specific facts.
