# Decisions

## 2026-09-04 — Use the fal queue HTTP API for local video generation

**Status:** accepted
**Decision maker:** Codex, independently within the requested local fal.ai setup

The local image-to-video command calls the documented fal queue HTTP endpoints with Bun's built-in fetch and filesystem APIs. It submits once, records the request ID and returned queue URLs, polls for up to 240 seconds, and supports later retrieval by request ID. Authenticated requests are restricted to `https://queue.fal.run` with redirects disabled; the generated media download carries no API key.

We considered adding `@fal-ai/client`. Its subscription helper would reduce protocol code, but it would add a dependency and hide the submit/persist/resume boundary that prevents accidental duplicate paid generations. Direct HTTP keeps that boundary visible and leaves the application runtime unchanged. The tradeoff is maintaining a small amount of queue handling against fal's published OpenAPI contract.

## 2026-09-04 — Let Astra direct each motion film from the product and references

**Status:** accepted
**Decision maker:** Oscar specified the creative role, reference quality bar, default 10/20/30-second films, and paid-resource approval; Codex chose the packaging and implementation workflow independently.

The global `motion-video` skill uses product research, two candidate treatments, designed style frames/storyboards, editable animation, sound, and inspection. It follows the supplied formula's Dream outcome → Solution → Demo → Outro structure while giving Astra responsibility for the concept and final selection. Remotion is the preferred available compositor, with other tools chosen for specific shots; the skill does not install or assume native After Effects.

We considered a fixed Remotion starter with reusable visual layouts. It would make the first render easier but encourage repeated compositions across unrelated products. A directing workflow with technical helpers preserves creative freedom and requires actual proof, temporal review, and revisions. Each duration gets its own edit rather than a sped-up or truncated long cut.

The skill bundles all 12 supplied reference films and a timestamped atlas, using relative paths so other product repositories can use them. Keeping only links to this checkout would be smaller but fragile. Originals remain unchanged and reference assets are study material, not cleared footage for new films. Reference study used full-timeline frame sampling, denser transition sequences, and local transcription; direct continuous playback and listening were unavailable and are not claimed.

Free sound effects may come from sources such as Pixabay with asset-specific source/license records. Any new API or paid resource needs a concrete, currently priced proposal, a reasonable cap, and user approval tied to a material improvement in the output. Ordinary local preparation proceeds without a purchase checkpoint.

## 2026-09-04 — Keep dependencies out of version control at every depth

**Status:** accepted
**Decision maker:** Codex, independently within the requested Git push repair

All `node_modules/` directories are ignored, including those inside export and media subprojects. Package manifests and lockfiles remain versioned so dependencies are reproducible without committing generated packages, browser binaries, or build caches.

We considered removing only the two files above GitHub's 100 MB limit. That would make the immediate push pass, but it would leave thousands of generated dependency files in the repository and allow the same failure to recur as caches change. Ignoring dependency directories by path keeps intentional media assets versioned while excluding the generated source of the oversized blobs.

## 2026-09-03 — Keep persona behavior beside each Eve subagent

**Status:** accepted
**Decision maker:** Codex, independently within the requested persona initialization

Each of the 36 selectable advisers keeps its stable behavior-critical identity in `agent/subagents/<slug>/instructions.md`. Full provenance, contradictions, and coverage limits live in `research.md`; comparative cases and verification boundaries live in `evaluation.md`.

We considered loading transcript-heavy research into every turn. That would make provenance immediately visible but would increase prompt cost and encourage quotation mimicry. Tight always-on instructions plus separate ledgers preserve the person's reasoning, voice, boundaries, and boardroom conduct while keeping source material available for maintainers.

The official David Senra interview transcript is the canonical source. Supporting primary and long-form sources sharpen current context and contradictions. The Travis Kalanick package uses the auto-generated transcript from the public YouTube interview linked by Senra because the official episode page exposes the video but not populated transcript text; the ledger records that lower-confidence provenance.

This persona-package change does not migrate the existing direct-AI-SDK meeting runtime away from `lib/personas.ts`. The separately developed Eve-routing branch demonstrates that broader migration, but importing its runtime, security, streaming, and session changes is deferred rather than folded into this bounded persona task.

## 2026-09-03 — Keep the Sites proof of concept isolated

Decision made independently from the user's request to avoid depending on Next.js for this prototype. The new `site/` project uses the default Sites stack and leaves the existing application available as a reference implementation. Detailed product and runtime decisions are recorded in `site/DECISIONS.md`.
