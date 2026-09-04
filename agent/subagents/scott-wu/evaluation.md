# Scott Wu persona evaluation

Evaluated: 2026-09-03

Prompt version: `scott-wu-v1.0.0`

## Evaluation status and method

This is a **static prompt inspection**, not a live model run. It tests whether the instruction contract contains the decision rules needed to produce distinctive behavior and records expected failure modes. No claim below should be read as empirical model-output evidence. Live comparative evals remain recommended when the repository gains a persona harness and provider credentials.

Two implementation approaches were considered:

1. **Transcript-summary prompt:** load biography, stories, and quotations directly into the always-on instructions. This can increase surface resemblance, but it bloats permanent context and encourages catchphrase imitation instead of transferable judgment.
2. **Behavioral kernel plus evidence ledger:** keep identity, load-bearing beliefs, heuristics, voice, boundaries, and meeting conduct in `instructions.md`; keep claims and provenance in `research.md`. This makes behavior easier to audit, leaves room for meeting state, and follows Eve’s context guidance.

Approach 2 was chosen. The main residual risk is that a compact prompt may need live tuning to reproduce Wu’s cadence without overusing verbal tics.

## Comparative panel

Static comparators:

- **Generic adviser baseline:** balanced pros/cons, risk matrix, stakeholder alignment, and a cautious pilot; no stable theory of technical progress or task execution.
- **Sam Altman profile in this repository:** ambition, steep capability curves, iteration speed, and avoiding local maxima.
- **DHH profile in this repository:** charge for value, preserve profitability and calm, reject growth theater and excess complexity.

The same prompts were inspected against all four instruction sets.

### Startup decision

**Prompt:** “We can raise a flat round now and hire 30 people, or cut burn and wait 12 months. What should we do?”

- Generic baseline likely requests runway, milestones, dilution, and scenario probabilities.
- Sam likely asks which path increases iteration speed and protects the chance at very large scale.
- DHH likely prefers default-alive economics unless capital clearly buys profitable customer value.
- Scott should first define the win condition, ask which capability/customer bottleneck the 30 hires remove, trace competitor responses, and require a tight output measure. He supports concentrated capital only if it accelerates the narrow bet; “more resources” alone cannot be the strategy.

**Static result:** Pass on distinct reasoning. Scott combines ambition with task-level bottleneck and output verification, unlike Sam’s broader scale lens and DHH’s profitability prior.

### Career decision

**Prompt:** “I’m a senior engineer considering leaving a stable role to start an AI company. Should I?”

- Generic baseline weighs savings, market validation, co-founder fit, and reversibility.
- Sam likely tests founder-market fit, speed of learning, and whether the opportunity is a local maximum escape.
- DHH likely asks whether the person wants an actual durable business rather than fundraising theater.
- Scott should ask which accepted constraint is no longer true, what focused wedge the founder will care more about than a lab, whether the team has high ownership, and which narrow task can be tested end to end now. He should not recommend quitting based only on “AI is big.”

**Static result:** Pass. The wedge + feedback-loop + incumbent-focus combination is specific.

### Personal decision

**Prompt:** “Relocate for a demanding role or stay near family?”

- Generic baseline balances relationships, growth, finances, and hybrid options.
- Sam may weight trajectory and the option value of an unusually steep learning curve.
- DHH may resist letting work consume the life the job is meant to support.
- Scott’s prompt explicitly puts intimate personal decisions in the defer zone. It should ask what outcome the person would regret, acknowledge that lived family context dominates tree search, and avoid universalizing an intense founder culture.

**Static result:** Pass on boundedness, with a weakness: the regret lens can still overweight ambition if the model ignores the deference rule.

### Outside core expertise

**Prompt:** “Should our hospital change its sepsis-treatment protocol based on this observational study?”

- Generic baseline may summarize methodological risks and recommend expert review.
- Sam and DHH have no repository-specific clinical authority.
- Scott must defer the clinical decision, identify the missing expert and prospective validation requirement, and restrict his contribution to software implementation, monitoring, and feedback-loop design only if asked.

**Static result:** Pass by explicit medical and safety-critical deference boundary.

## Boardroom behavior cases

| Case                       | Test input                                                                                                          | Required Scott behavior                                                                                                          | Static result                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Independent position       | “Everyone else favors a company-wide AI mandate; open the round.”                                                   | Form a view before consensus; reject token-usage quotas; propose one valuable workflow and an output measure.                    | Pass: explicit independent-position and outcome rules. |
| Direct @mention            | “@Scott, are we moving too slowly?”                                                                                 | Answer directly; distinguish slow execution from an unproven objective; name one next test.                                      | Pass: direct-address and start-with-answer rules.      |
| Material interruption      | A member celebrates 10x token spend as adoption.                                                                    | Briefly interrupt: ask what useful work was completed and whether failed sessions were counted.                                  | Pass: this exact proxy failure is encoded.             |
| Non-material interruption  | Two members differ on copy tone.                                                                                    | Stay quiet unless the language hides a goal or measurement error.                                                                | Pass: relevance-calibrated participation is explicit.  |
| Persuasive counterargument | Evidence shows the narrow migration wedge has low retention while a harder review workflow has strong verified ROI. | Say the observed data changes the branch; move to the review workflow while preserving the narrow-feedback-loop principle.       | Pass: evidence-triggered update behavior is explicit.  |
| Hold position              | A member argues a giant incumbent will inevitably copy the product, with no customer evidence.                      | Hold; explain that resources are not a complete strategy and identify the focus/customer-learning advantage that must be tested. | Pass: focused-startup heuristic is distinct.           |
| Closing comment            | Chair asks for one final recommendation.                                                                            | One move, one outcome metric, one checkpoint; no recap essay.                                                                    | Pass: closing contract is explicit.                    |
| Passing                    | Scott has spoken and discussion turns to tax treatment.                                                             | Defer to the tax expert and pass.                                                                                                | Pass: explicit domain and passing boundaries.          |

## Fidelity checks

- Identity and Senra roster eligibility: verified against the official guest and episode pages.
- Canonical transcript: present on the official Senra episode page; no user-supplied transcript was needed.
- Research ledger: present with 12 sources, favoring direct long-form interviews, primary talks, and first-party material.
- Quotations: 8 short quotations in `research.md`; all 8 verified against the official Senra transcript. The always-on prompt uses no attributed quotations.
- Private facts or unsupported memories: none intentionally encoded. Sensitive biographical details that do not affect board judgment were omitted from the prompt.
- Tensions preserved: competition/friendliness, conviction/current limitations, independence/cooperation, and intensity/opt-in are all explicit.
- Distinctness: strongest against generic advice, DHH, and Sam Altman on startup/AI prompts; adequate against the rest of the currently declared roster by static comparison.

## Repository check record

These are authoring and discovery checks, not live persona-output tests.

- `bunx prettier --check agent/subagents/scott-wu/agent.ts agent/subagents/scott-wu/instructions.md agent/subagents/scott-wu/research.md agent/subagents/scott-wu/evaluation.md` — passed after formatting the two new Markdown ledgers.
- `bun run lint -- agent/subagents/scott-wu/agent.ts` — passed.
- `bunx tsc --noEmit --skipLibCheck --moduleResolution bundler --module preserve --target ES2022 agent/subagents/scott-wu/agent.ts` — passed.
- `bun run test -- tests/persona-packages.test.ts -t scott-wu` — passed 2 Scott-specific tests; 71 unrelated parameterized cases were skipped.
- `git diff --check -- agent/subagents/scott-wu` — passed.
- `bunx eve info` — passed with 0 errors and 0 warnings; Eve discovered 37 subagents, including `scott-wu`, and the compiled manifest contained this package’s updated description and instructions.
- `bun run typecheck` — did not pass repository-wide because concurrent `site/` work referenced missing UI and board-data modules and produced duplicate React-type errors. No Scott Wu error appeared in the output; the targeted compile above passed.
- `bun run build` — Next.js compilation completed, then the repository-wide type-check phase stopped on the same unrelated `site/` module/type errors. This is not a successful full build and is not evidence of live persona behavior.

## Remaining weaknesses

- No live model outputs were generated, so cadence, verbosity, deference compliance, and resistance to verbal-tic caricature remain unmeasured.
- Several other board-member packages are thin. Distinctness comparisons may shift as those profiles become evidence-rich.
- Wu’s public evidence is concentrated in company-building and software agents. Personal or nontechnical advice should remain cautious.
- His employment-abundance thesis and company performance figures are claims or forecasts, not independent proof; the prompt is instructed not to treat them as current facts.
- A future live eval should add adversarial tests for intensity universalization, overconfident capability timing, and converting emotionally complex decisions into overly neat algorithms.
