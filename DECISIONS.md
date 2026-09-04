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
