---
name: init-board-member
description: Research a living public figure who has appeared on David Senra's interview podcast, then create or refresh a source-grounded Vercel eve subagent for The Best Board Meeting You've Ever Had. Use when asked to add a board member, initialize a Senra guest persona, improve persona fidelity, or refresh an existing board member. Not for historical figures, generic archetypes, or people outside the MVP guest roster.
---

# Initialize Board Member

Turn a David Senra podcast guest into a distinct, evidence-grounded board-member agent. The output should feel like a durable model of how this person thinks and participates—not a transcript summary, celebrity costume, generic executive coach, or collection of catchphrases.

The Senra interview is the canonical starting point. Deep research supplies additional evidence, current context, contradictions, and domain depth. The generated agent must remain recognizably different from every other board member even though all members may use the same underlying OpenAI model family.

## Parse the request

Accept any of these forms:

- `<person>` — initialize the full board-member persona.
- `<person> on <topic>` — initialize the whole person, but weight research and examples toward that domain.
- `<Senra episode URL>` — resolve the guest from the episode.
- `<person> --refresh` — re-research and update an existing persona in place.

Resolve common abbreviations such as `DHH` from the Senra roster. Ask a question only when identity is genuinely ambiguous.

## Establish the project context first

Before researching or writing files:

1. Inspect the repository and identify the Eve root, existing `agent/subagents/` layout, model configuration, shared types, UI metadata, eval conventions, and formatting commands.
2. Read the installed Eve documentation or current primary docs rather than inventing framework APIs.
3. Reuse existing project conventions. Do not create a parallel persona architecture when one already exists.
4. Confirm that the person appears on David Senra's interview podcast. If not, stop and explain that the MVP skill is intentionally limited to that guest roster.
5. Choose a stable kebab-case slug. Preserve an existing slug during refreshes.

## Research the person

Follow `references/research-playbook.md`.

Run autonomously without mid-run checkpoints. Stop only when:

- the identity cannot be resolved;
- the official episode or transcript cannot be found;
- the public evidence is too thin to support a faithful persona;
- sources materially conflict in a way that requires a product decision;
- required repository conventions remain unknowable after inspection.

Do not ask the user to paste a transcript until you have verified that the official Senra episode page does not provide one.

## Distill the "soul"

Build an evidence-backed model of the person across these dimensions:

- core worldview and first principles;
- recurring beliefs, values, and non-negotiables;
- domain expertise and the problems they are unusually good at seeing;
- decision heuristics and favorite diagnostic questions;
- risk posture, time horizon, and treatment of uncertainty;
- what they praise, dismiss, fear, or consider a waste of time;
- strengths, known shortcomings, blind spots, failures, and regrets;
- how they gather evidence and update their mind;
- communication rhythm, vocabulary, humor, stories, and metaphors;
- how they challenge, persuade, concede, interrupt, and disagree;
- topics where they should lead, contribute cautiously, or defer;
- contradictions or changes in their views over time.

Separate **documented evidence** from **responsible inference**. Preserve tensions instead of smoothing them into a perfectly consistent philosophy. A useful board member is opinionated and bounded, not omniscient.

After the individual distillation, compare it with all existing board-member profiles. Sharpen the person's unique contribution where sources support it. Never distort the research merely to manufacture contrast.

## Generate the Eve board member

Follow `references/generated-agent-contract.md`.

The default output is a declared Eve subagent under:

```text
agent/subagents/<person-slug>/
```

Its `agent.ts` must contain a clear delegation description and use the project's existing OpenAI model configuration. Its always-on instructions must contain the behavior-critical identity, worldview, voice, boundaries, and boardroom conduct. Large source notes belong in a load-on-demand source skill or maintainer-facing research files, not in the always-on prompt.

The generated agent must:

- speak in first person and stay in character without repeatedly explaining the simulation;
- reason from the person's documented worldview on novel questions;
- never invent private facts, unsupported quotations, or personal memories;
- give specific advice rather than generic consultant language;
- ask the kind of questions this person would actually ask;
- disagree when its worldview calls for disagreement, not as a forced gimmick;
- remain persuadable and explicitly update its position when warranted;
- calibrate participation to relevance and conviction;
- treat the human as chair and every external WebMCP agent as a visible participant;
- keep all conversation in the shared room—no side conversations;
- produce concise, conversational turns suitable for a live group discussion.

Do not make spoken responses citation-heavy. Keep evidence available through source references or structured metadata when the product supports it, and use explicit citations when the user asks for provenance.

## Encode board-meeting behavior

Every generated persona must understand these phases without making the meeting feel rigid:

1. **Independent position:** Privately form a clear initial view before seeing other members' positions.
2. **Open discussion:** Question the user, address members by name, react, interrupt when material, challenge assumptions, and build on or rebut prior comments.
3. **Position updates:** Change or qualify the initial view when persuaded; do not defend it for theatrical consistency.
4. **Closing comment:** State the most important advice, unresolved concern, or next action in a compact final contribution.

Every selected member must speak at least once. Beyond that minimum, frequency should depend on relevance and strength of view. The agent may pass on a turn when it has nothing additive to say, provided it has already contributed.

A delegated Eve subagent does not automatically inherit the parent's conversation. Its input must include everything needed for the turn: decision brief, phase, public transcript or compact meeting state, the member's prior statements, direct mentions, and any open questions. Conform to the project's existing input/output types; do not create competing schemas casually.

## Evaluate before declaring success

Follow `references/evaluation-rubric.md`.

At minimum:

1. Run the same decision prompts against the new persona, a generic adviser baseline, and at least two existing board members.
2. Test startup, career, and personal decisions, including one topic outside the person's core expertise.
3. Test a disagreement round, an @mention, an interruption opportunity, a persuasive counterargument, and a closing comment.
4. Verify every quotation and source attribution.
5. Revise until the agent is both distinctive and useful. A recognizable voice with poor judgment is not a pass; neither is good advice that could have come from any member.
6. Run the repository's format, typecheck, build, discovery, and relevant eval commands. For Eve projects, use the repository's current equivalent of `eve info` to confirm the subagent is discovered.

## Refresh behavior

On `--refresh`:

- preserve stable IDs, slug, and UI references;
- fetch the current Senra transcript and newer primary sources;
- record what changed in the evidence and persona;
- update the generated timestamp and prompt version;
- rerun distinctness and behavior evaluations;
- avoid rewriting well-supported traits merely for novelty.

## Deliver

Return:

- the created or updated file paths;
- a one-paragraph description of who this board member is;
- the three to five principles that most define the persona;
- the domains where this member should be especially valuable;
- the strongest source material used;
- known coverage gaps or inference-heavy areas;
- evaluation results and any remaining weaknesses.

Do not claim completion when the transcript, research ledger, generated subagent, or evaluations are missing.
