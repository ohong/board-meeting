# Gustav Söderström — persona evaluation

Evaluated: 2026-09-03  
Prompt version: 1.0.0  
Method: static prompt inspection and hand-authored response probes. **No Eve persona run or live model comparison was executed**, so results below are design-time evidence, not behavioral measurements.

## Comparative panel

The same prompts were inspected against this prompt, a generic adviser baseline (“list pros and cons; gather more data”), Daniel Ek's existing operator perspective, and Ed Catmull's creative-organization perspective.

| Case | Prompt | Expected Gustav Söderström distinction | Static result |
|---|---|---|---|
| Startup | “Raise a flat round now, or cut burn and wait?” | First identify the scarce constraint—distribution, learning speed, or runway—then state “optimize X, accept Y, mitigate with Z” and name a fast test. Avoid treating financing as his core expertise. | Pass: trade-off model differs from generic balance and Ek-style ambition/stamina. |
| Career | “Leave a senior role to start something?” | Ask whether the new venture sits on a macro wave, what structural distribution it has, and whether the current role still supplies a new job's worth of responsibility and learning. | Pass: model is specific to his evidence. |
| Personal | “Relocate for a job or stay near family?” | Acknowledge the decision is value-heavy; model the irreversible and compounding dimensions, but defer the utility weights to the person rather than optimizing their life for them. | Pass with caution. |
| Outside expertise | “Which anticoagulant should my parent take?” | Refuse to select medication; defer to a qualified clinician and offer only to help compare questions or organize stated constraints. | Pass by prompt boundary. |

Comparative conclusion: the designed persona is distinguishable from a generic adviser's pros/cons, Ek's mission-and-scale orientation, and Catmull's power-and-candor diagnosis. Its strongest marker is explicit optimization with an accepted downside and mitigation. Runtime distinctness still requires a live blind comparison.

## Board-behavior probes

| Behavior | Probe | Expected behavior | Static result |
|---|---|---|---|
| Independent position | Chair asks whether to split one product into three business-unit apps. | Open with the likely bottleneck and a clear view: do not export org seams before testing whether separate distribution beats a coherent adaptive experience. State the accepted coordination cost. | Pass by phase instruction. |
| Direct @mention | “@Gustav, should we copy Spotify squads?” | Reject cargo-culting: there is no right org; identify the company's product dependency and leadership style first. | Pass. |
| Interruption | Discussion moves on after assuming all engagement is user value. | “Can I say something on the previous point?” Then distinguish time captured from time valued and ask for retrospective-user evidence. | Pass; interruption has a material trigger. |
| Disagreement | Another member says every team should operate autonomously. | Explain when autonomy ships fragmented product and why shared context may justify expensive synchronization. | Pass; avoids universal opposition. |
| Persuasion/update | New data shows each product has a distinct audience and independent distribution channel. | State: “That changes the constraint. I would update toward separate products, with one shared identity and recommendation layer as mitigation.” | Pass; new premise changes conclusion. |
| Closing | Chair asks for final advice. | One compact choice/test: “Keep one experience for now; run the smallest distribution test that could prove separation wins, and define the seam users must never see.” | Pass. |
| Passing | Gustav has spoken and discussion turns to a tax-jurisdiction detail. | Pass and defer to the domain expert. | Pass by instruction. |

## Fidelity checks

- Verified short quotations in `research.md`: **9**, all checked against the official Senra transcript.
- Prompt sample lines are close paraphrases rather than attributed quotations, limiting accidental false quotation in spoken turns.
- Documented tensions retained: synchronization cost vs coherence; tenure vs fresh blood; engagement vs retrospective value; first-mover urgency vs uncertainty.
- No private metrics, unreleased strategy, personal memories, or power to act as Spotify's executive is granted.

## Repository checks

Checks run from the repository root on 2026-09-03:

- targeted ESLint (`bunx eslint agent/subagents/ed-catmull/agent.ts agent/subagents/gustav-soderstrom/agent.ts`): passed with no output;
- `bunx --no-install eve info --json`: status `ready`, zero diagnostics, and `gustav-soderstrom` listed among 37 discovered subagents;
- `bun test`: 3 tests passed, 0 failed, 46 assertions;
- typecheck/build: not run in this persona-only pass;
- live comparative persona suite: not present or not run here.

`agent.ts` preserves the repository's existing `openai/gpt-5.6-luna` model and `low` reasoning configuration. The package contains the declared agent, always-on prompt, evidence ledger, and this design-time evaluation.

## Remaining weaknesses and next validation

- The prompt may overuse “optimization” language or the org-chart metaphor; a live suite should penalize framework recital without a decision.
- Evidence is concentrated in Spotify and consumer media. Transfer to enterprise, hardware, or very small startups should be scored for calibrated analogy.
- Low reasoning effort may omit the accepted downside or mitigation in short turns; test the full “choose X / accept Y / mitigate Z” pattern.
- “Time well spent” is normatively attractive but its public survey methodology is thin; test that the persona asks for evidence rather than asserting Spotify's reported result universally.
- Next required evidence: run the repository's real evaluation harness against a generic adviser, Daniel Ek, and Ed Catmull; blind-score reasoning identity, usefulness, concision, and explicit updating.
