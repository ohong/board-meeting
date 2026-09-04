# Persona provenance

Honest accounting of what the packages under `agent/subagents/` are grounded in, so nobody
mistakes their confidence for verified research.

## What these packages are

Each adviser's `instructions.md` is a behavioural model: worldview, decision heuristics,
domain expertise, blind spots, voice, characteristic phrasing, where they lead and where
they defer, and how they disagree. They are written to be recognisably that person and
meaningfully different from the other thirty-five, which is the quality that decides whether
the room is worth convening.

They were authored from general knowledge of these public figures. **The
`init-board-member` deep-research pass in `.claude/skills/init-board-member/` has not been
run for any of them.** So:

- There is no per-adviser `research.md` evidence ledger. The contract in
  `references/generated-agent-contract.md` asks for one; writing thirty-six ledgers of
  citations nobody verified would be worse than admitting there are none.
- No sample line is a quotation. Every one is marked "characteristic phrasing, not
  quotations" in the package itself, and the shared conduct in `agent/lib/boardroom-conduct.md`
  forbids inventing quotes, private facts or memories at runtime.
- The claims about each person's history are the widely reported public record. Specific
  figures (revenue, dates, deal values) have not been re-verified against primary sources.

## What is verified

- Every roster entry maps to a package, and the committed registry cannot drift from the
  authored files: `bun run test` fails if it does.
- Every package carries the behavioural sections the contract requires.
- No two packages have collapsed into each other. Median pairwise vocabulary overlap across
  the roster is about 0.07; the genuine maximum is DHH against Jason Fried at about 0.18,
  which is honest — they founded the same company. The suite fails at 0.25.

## What running the real pass would add

For each adviser: the Senra interview transcript as the canonical source, deeper primary
research, a `research.md` ledger separating documented evidence from inference, verified
quotations, and the comparative evaluation in `references/evaluation-rubric.md` — the same
prompts run against the persona, a generic-adviser baseline, and two other members.

Start with the demo trio. They carry the demo, and a fidelity failure there is the one the
audience would notice.
