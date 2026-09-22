# The Best Board Meeting You've Ever Had

This agent root exists so that every board member is a genuinely separate, discoverable
eve agent rather than one model performing a whole table.

## Layout

- `agent/subagents/<slug>/` — one package per adviser on the frozen David Senra guest
  roster. `agent.ts` declares the model and the description used to pick a seat;
  `instructions.md` is that person's source-grounded persona package: worldview, decision
  heuristics, expertise, blind spots, voice, and how they disagree.
- `agent/subagents/secretary/` — the unseen synthesiser. It produces interim syntheses and
  the final executive readout, and never holds a seat or impersonates a member.
  Each package also carries `research.md` (the maintainer-facing evidence ledger, never
  loaded into a prompt) and `evaluation.md` (comparative cases and verification boundaries).

## Invariants

A board member never receives another member's private opening position. They learn other
positions only from the public transcript. Persona research happens at authoring time; no
agent does live research during a meeting.

`scripts/build-personas.mjs` mirrors `agent.ts` and `instructions.md` into
`lib/personas.generated.ts` so the Next.js runtime can invoke each persona with its own
isolated context and its own declared model. The ledgers are deliberately left out of the
registry: they are for maintainers, not for the prompt. The packages here are the source of
truth; the generated file is a build artefact.
