# Decisions

## 2026-09-03 — Serialize meeting commands on one promise lane

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

The session engine serializes chair messages, adviser turns, guest actions, synthesis requests, and meeting closure on one promise tail. Independent opening positions and closing comments remain parallel. A generation token invalidates queued or late work after reset.

We considered an explicit queue-and-drain state machine with cancellation records. That approach would expose more queue internals, but it would also introduce more intermediate states and a broader rewrite. The promise lane preserves invocation order with less machinery, while the generation token keeps stale completions from mutating a fresh session.

Runtime calls get one retry. If a public turn still fails, the transcript publishes a clearly labeled recovery from that member's private opening so the readout cannot bypass the invariant that every adviser has a public contribution. If final synthesis fails twice, the engine assembles a faithful briefing- and transcript-derived readout without demo-specific facts.

## 2026-09-03 — Keep the assembled board visible through onboarding

**Status:** accepted
**Decision makers:** user and Codex

Selection and briefing use the supplied warm-paper references as a visual system: a sticky four-column board-preview rail sits beside an eight-column working field. The preview uses six fixed, hand-authored seats anchored by the human chair, while the larger field holds the portrait catalog or decision brief.

We considered a full-width catalog with a compact selected-member strip. It accommodates more tiles above the fold, but the chosen board disappears as the catalog scrolls and the experience reads like a conventional form. The 4/8 composition spends more space on context, but makes room assembly legible throughout the decision flow and carries the same spatial model into the live meeting.

## 2026-09-03 — Serve a local, frozen portrait roster

**Status:** accepted with a rights-clearance caveat
**Decision maker:** Codex, independently within the user's requirement for real portraits

The UI serves one deterministic JPEG per frozen catalog slug. Images are bounded to a 900 px maximum edge and total about 3.3 MB, which is ample for the 128 × 142 px catalog treatment without shipping the roughly 49 MB source set. A monogram remains only as a load-failure fallback.

We considered hotlinking the interview directory and using monograms alone. Hotlinks make rendering dependent on an external CDN and leak page requests; monograms do not meet the specification's recognizable-portrait requirement. Local assets make the build and visual tests deterministic.

Daniel Ek and David Heinemeier Hansson use CC BY 2.0 images. Lulu Cheng Meservey and the 33 official Founders-directory portraits have no explicit reuse license in their source pages. Their exact provenance is recorded, but permission or clearly licensed replacements remain required before treating the library as publication-cleared.

## 2026-09-03 — Declare WebMCP tools through one reviewable manifest

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

The browser integration declares exactly six tools in one manifest and registers them through the documented top-level `document.modelContext` API. Every schema rejects unknown fields, every handler repeats validation at runtime, and all stateful calls use the same in-memory meeting session as the human interface. Tool outcomes flow through a bridge-local callback to an accessible live status without echoing private arguments or polluting the meeting record. The inspect and final-readout tools remain side-effect free with respect to session state.

We considered registering each tool inline inside the React effect. That is shorter at the call site, but makes exact inventory, schemas, handlers, and cleanup behavior harder to test independently. The manifest-and-adapter split adds one abstraction while making the six-tool contract directly assertable and keeping Strict Mode abort handling at the browser boundary.

## 2026-09-03 — Sandbox each adviser at the Eve package boundary

**Status:** accepted
**Decision maker:** Codex, independently within the specification's no-retrieval boundary

All 36 selectable adviser packages instantiate the direct OpenAI provider and explicitly disable Eve's seven default model-facing tools: shell, file read/write, web fetch/search, task tracking, and user questioning. A catalog-derived invariant test requires the full 36 × 7 matrix and rejects gateway-style model strings.

We considered relying on persona instructions or a shared inherited override. Prompt text is not an enforcement boundary, and installed Eve discovery gives each subagent its own authored tool slots without inheriting root overrides. We also considered symlinking one shared disable directory, but Eve's disk discovery accepts regular files and directories rather than symlink entries. Explicit sentinel files create a large mechanical diff, but they are the supported, auditable boundary and make unapproved research or workspace access unavailable rather than merely prohibited.

## 2026-09-03 — Present the readout as one editorial sheet

**Status:** accepted
**Decision maker:** Codex, independently following the supplied design references

The final state is one warm-paper memo: the decision and recommendation establish the hierarchy, then the eight required sections proceed linearly with ruled editorial structure. The participant roster and original question remain compactly available, while divided recommendations and individual closing comments preserve dissent instead of collapsing it into a score.

We considered keeping a permanent navigation or adviser rail like the denser reference. It creates a stronger application frame, but competes with the memo at 1024 px and makes the result resemble a dashboard. The single-sheet composition better fits a durable executive artifact, stays scannable across the target widths, and gives the recommendation the space it needs.

## 2026-09-03 — Compose the boardroom with fixed seat maps

**Status:** accepted
**Decision maker:** Codex, independently following the supplied design references

The live state uses a dark, lightly theatrical room with a dominant table and hand-authored layouts for three through six adviser seats. The human chair and reserved guest threshold remain stable, while a paper minutes rail stays at least 400 px wide and contains the only public transcript and composer.

We considered calculating seats continuously along an ellipse. That scales with arbitrary counts, but produces generic spacing, makes long nameplates collision-prone, and can obscure the decision folio. Fixed maps require four small compositions, but preserve intentional sight lines, keep the chair and guest distinct, and hold the exact 1440 × 900, 1280 × 800, and 1024 × 800 geometries without page overflow.

## 2026-09-03 — Inject demo pacing only at the browser boundary

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

The browser's deterministic mock stages three opening positions in parallel, then uses a short speaking delay and inter-turn gap. The session engine accepts these timings as injected options; its defaults and the mock runtime remain instantaneous. Automatic continuation pauses while the chair composes, resumes afterward, and stops after twelve automatic contributions.

We considered placing fixed delays inside the mock runtime or session defaults. That would make every unit test and server-side rehearsal pay real wall-clock time and would couple correctness to presentation timing. Browser-only injection keeps the visible demo legible while preserving fast deterministic tests and a production runtime whose pacing is governed by actual model latency.

## 2026-09-03 — Route live capabilities through one authored Eve workflow

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

Each live capability starts a fresh Eve root session carrying an immutable, encoded route. The root may call only the authored `board_runtime` workflow; that workflow invokes exactly one declared adviser or the unseen secretary in its own child session. The API accepts a result only when the event record proves the one expected workflow call, the exact expected child identity, and a completed value matching the capability's closed schema. Public turns over 90 words fail validation and enter the session engine's existing retry path. Production server-to-Eve calls use same-project Vercel OIDC.

We considered exposing 36 separate Eve roots and calling OpenAI directly from the application. Separate roots remove one routing hop, but duplicate deployment and authorization policy across the roster. Direct AI SDK calls are simpler, but do not create auditable Eve child sessions and would violate the separate-agent requirement. The single routing root adds one small model-directed tool step, but centralizes policy while retaining independently configured, discoverable adviser contexts.

## 2026-09-03 — Stream provisional speech from the authenticated Eve child

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

Public and direct-answer capabilities let the delegated adviser emit plain text so Eve exposes its incremental message events. The application attaches only to the child named by the root's delegated call, verifies the child's complete parent invocation tuple before relaying any content, and treats every delta as provisional. A turn becomes durable only after the authored workflow returns the exact expected capability, target, tool call, and schema-valid result. Retries reset the projection, and page reset or browser disconnect cooperatively cancels the active Eve turn.

We considered keeping Eve's structured `{ text }` child output and revealing it only after completion. That offers the smallest protocol surface, but Eve's structured-output tool does not expose the spoken answer as real-time text. We also considered a presentation-only typewriter effect over the completed result; it looks streamed without reducing perceived model latency and would misrepresent the runtime. The chosen plain-text child plus validated workflow result adds a provisional projection layer, but preserves true child output streaming without making unverified text part of the meeting record.

## 2026-09-03 — Migrate pre-meeting setup when live availability resolves

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

The page becomes interactive immediately with the deterministic runtime. If the runtime-status request later confirms live availability, the application snapshots and resets the current selection or briefing session, creates a live session, and replays the search, roster order, briefing, and onboarding phase through public session actions. An active meeting or completed readout is never replaced underneath the user.

We considered blocking onboarding behind the runtime-status request. That removes migration logic, but makes the first interaction depend on a network round trip and turns a transient status failure into a blank or stalled entry experience. Preserving and migrating pre-meeting state adds a small replay helper, while keeping entry immediate and preventing an early selection from silently pinning a keyed visit to the mock runtime.

## 2026-09-03 — Reserve guest admission on the meeting command lane

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

Joining reserves the only guest seat and exposes its joining state synchronously. At the same moment, the session places an admission operation on the existing serialized command lane while its short visual delay runs concurrently. Any contribution, addressed question, or synthesis requested afterward therefore waits for the opening phase, any active public stream, and admission in the same deterministic order. Reset invalidates the entire sequence through the existing generation token.

We considered a separate guest-admission promise that every substantive action would await. That makes the dependency explicit, but creates a second ordering mechanism beside the command lane and expands the number of intermediate failure paths. Reserving admission in the existing lane reuses its ordering and reset guarantees, while still allowing the visual delay to overlap private opening work.

## 2026-09-03 — Isolate the deterministic demo fixture by exact briefing

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

The deterministic runtime uses the hand-authored demo trio only when the briefing exactly equals the one-click example fixture. Every other briefing routes through separate briefing- and transcript-grounded openings, turns, direct answers, synthesis, closings, and readout. Guest evidence is accepted only from an actual non-addressed guest contribution, bounded before reuse, and carried into both synthesis and readout; directed questions alone never become evidence.

We considered topic or substring recognition so lightly edited free-tier prompts could retain the polished rehearsal. That convenience creates ambiguous fixture boundaries and risks introducing demo metrics into an unrelated user decision. We also considered removing scripted behavior entirely, which is maximally uniform but weakens a no-key rehearsal intended by the specification. Exact fixture equality keeps the golden path dependable while making fabricated cross-briefing facts structurally difficult.

## 2026-09-03 — Bound provisional speech at both stream boundaries

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

Public speech remains provisional until the Eve workflow returns a schema-valid turn. Both the authenticated Eve-child relay and the browser's NDJSON reader enforce the same 4,000-character ceiling. A malformed event, explicit error, oversized projection, or event after completion clears the ephemeral UI, rejects the turn, and cooperatively cancels the browser stream so no partial text becomes durable transcript state.

We considered enforcing the ceiling only in the browser. That protects the visible page, but still lets unbounded child output traverse and accumulate in the server relay. Enforcing one shared limit at both trust boundaries adds a small duplicate check, while constraining memory before transport and again before projection. Reader cancellation is best-effort so a cleanup failure cannot replace the protocol error that caused it.

## 2026-09-03 — Bound each runtime attempt independently

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

Every opening, public turn, directed answer, closing, synthesis, and readout attempt has the same configurable deadline. The session tracks all active abort controllers, cancels them on reset, and advances through its existing retry or evidence-grounded fallback when a runtime does not cooperate. A failed directed answer remains a failed tool result rather than reusing earlier speech.

We considered one deadline for an entire meeting phase. That makes the wall-clock ceiling easy to state, but one slow member can consume the budget and starve the remaining parallel or recovery work. Per-attempt deadlines preserve equal opportunity for independently running advisers and reuse the same failure path everywhere. A non-cooperative promise may continue in the background, but its generation can no longer mutate or block the active session.

## 2026-09-03 — Gate only meeting start on runtime readiness

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

Selection and briefing remain interactive while runtime status resolves. The Start action stays visibly disabled until a timely response, explicit failure, or a three-second fallback selects the runtime. If a late live response arrives while setup is still in progress, the application migrates that setup exactly; an active meeting is never replaced.

We considered blocking the entire entry experience until the runtime request completed. It removes migration concerns, but turns a health check into first-interaction latency. We also considered allowing Start immediately, which can silently pin a configured visit to the mock runtime. Start-only gating keeps useful work responsive while making the runtime choice explicit at the irreversible boundary.

## 2026-09-03 — Format the displayed readout once

**Status:** accepted
**Decision maker:** Codex, independently within the approved MVP implementation

One pure formatter derives meeting date, participant context, all eight sections, dissent state, and closing comments from the completed readout and its session snapshot. The UI Copy action and WebMCP retrieval return this exact same string while WebMCP also retains the structured result.

We considered maintaining a compact tool payload and a separately formatted UI memo. That is convenient for each consumer but makes the requirement to retrieve the exact displayed readout unverifiable and lets timestamps drift across midnight. A shared formatter makes equality testable and anchors metadata to the meeting record rather than render time.

## 2026-09-03 — Keep live detail inside stable boardroom regions

**Status:** accepted
**Decision maker:** Codex, independently following the supplied design references

The agenda remains a semantic folio whose header toggles a contained scroll region; it does not become one large scrollable button. Provisional speech remains visually present but hidden from the live region until durable, while the chronological minutes log scrolls instantly during streaming and only animates completed additions when reduced motion is not requested. One semantic participant list contains advisers, chair, and guest with distinct mention actions.

We considered making the entire agenda folio the toggle and letting it grow over the table. That is simpler, but clips long briefing text at laptop heights and makes reading or scrolling prone to accidental closure. The contained region preserves the spatial composition at all target sizes without sacrificing complete text or keyboard semantics.
