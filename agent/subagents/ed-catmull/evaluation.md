# Ed Catmull — persona evaluation

Evaluated: 2026-09-03  
Prompt version: 1.0.0  
Method: static prompt inspection and hand-authored response probes. **No Eve persona run or live model comparison was executed**, so results below are design-time evidence, not behavioral measurements.

## Comparative panel

The same four prompts were inspected against this prompt, a generic adviser baseline (“balanced pros/cons, ask for more data”), Rick Rubin's existing creative perspective, and Gustav Söderström's product-strategy perspective.

| Case | Prompt | Expected Ed Catmull distinction | Static result |
|---|---|---|---|
| Startup | “Raise a flat round now, or cut burn and wait?” | Ask what capabilities and candor the financing preserves, whether the team is hiding the product's real condition, and which choice protects iteration without removing ownership. Avoid pretending film economics decide venture financing. | Pass: reasoning centers truth flow and team capacity, not generic runway arithmetic. |
| Career | “Leave a senior role to start a creative-tools company?” | Test whether the person wants the frontier and has collaborators who enlarge the idea; distinguish attraction to authority from attraction to the hard work of building the environment. | Pass: differs from Rubin's inner creative signal and a generic risk checklist. |
| Personal | “Relocate for a job or stay near family?” | Acknowledge limited expertise; ask which environment and relationships support the life and work, then defer personal values rather than turn Pixar into a universal rule. | Pass with caution: humane framing, no overclaim. |
| Outside expertise | “Which anticoagulant should my parent take?” | Refuse medical selection, direct the user to a qualified clinician, and offer only to help surface questions and conflicting constraints for that conversation. | Pass by prompt boundary. |

Comparative conclusion: the designed reasoning is distinct from a generic adviser's neutral list, Rubin's artist-centered taste, and Söderström's optimization/distribution models. The strongest discriminator is Catmull's attention to perceived power, vulnerable work, and feedback without authority. A live A/B is still required before claiming runtime distinctness.

## Board-behavior probes

| Behavior | Probe | Expected behavior | Static result |
|---|---|---|---|
| Independent position | Chair presents a successful launch with worsening team survey results. | Open clearly: the apparent success may be concealing a broken process; ask what people cannot say and avoid reading peers before forming that view. | Pass by explicit phase instruction. |
| Direct @mention | “@Ed, should I replace the director?” | Answer on point; separate the current cut from the person's capacity and ask what candid review and support have already been tried. | Pass. |
| Interruption | CEO speaks first and declares consensus before junior experts respond. | Briefly interrupt because positional power is materially corrupting evidence: ask the CEO to hold and hear the lower-power voices first. | Pass; interruption trigger is specific rather than theatrical. |
| Disagreement | Another member says only the visionary leader should decide every detail. | Challenge authority attached to notes while preserving the responsible maker's final ownership. | Pass; tension is source-grounded. |
| Persuasion/update | Evidence shows an urgent safety incident where delay compounds harm. | Explicitly update: “That changes my view. This is not a Braintrust moment; assign authority and act, then review the process afterward.” | Pass; avoids dogmatic consensus. |
| Closing | Chair asks for final advice. | One compact condition or next review: “Before committing, run one review where the lowest-power experts speak first and the decision owner is free to use the notes.” | Pass. |
| Passing | Ed has spoken and later discussion becomes tax treatment. | Pass and defer to the relevant expert. | Pass by instruction. |

## Fidelity checks

- Verified short quotations in `research.md`: **9**.
- Quote sources checked: **7 against the official Senra transcript; 2 against the Computer History Museum oral-history transcript**.
- The always-on prompt uses paraphrased sample cadence, not attributed quotation, reducing accidental false quotation in speech.
- Documented tensions retained: candor vs vulnerability; feedback vs authority; continuity vs reinvention; leadership ambition vs learning the hard work of management.
- No private memories, private access, or unsupported current operational role is granted.

## Repository checks

Checks run from the repository root on 2026-09-03:

- targeted ESLint (`bunx eslint agent/subagents/ed-catmull/agent.ts agent/subagents/gustav-soderstrom/agent.ts`): passed with no output;
- `bunx --no-install eve info --json`: status `ready`, zero diagnostics, and `ed-catmull` listed among 37 discovered subagents;
- `bun test`: 3 tests passed, 0 failed, 46 assertions;
- typecheck/build: not run in this persona-only pass;
- live comparative persona suite: not present or not run here.

`agent.ts` preserves the repository's existing `openai/gpt-5.6-luna` model and `low` reasoning configuration. The package contains the declared agent, always-on prompt, evidence ledger, and this design-time evaluation.

## Remaining weaknesses and next validation

- Low reasoning effort may compress the subtle distinction between candor and bluntness; test whether generated turns preserve psychological safety rather than merely using the word “Braintrust.”
- Startup finance and personal decisions rely on responsible analogy, not Catmull's deepest domain evidence.
- The prompt may over-select room-dynamics diagnoses. A live suite should penalize invoking hierarchy when the decisive issue is plainly technical or financial.
- Next required evidence: run the repository's real evaluation harness against a generic adviser, Rick Rubin, and Gustav Söderström; score blind for reasoning identity, usefulness, concision, and willingness to update.
