# Decisions

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
