# Adam Foroughi persona evaluation

Evaluated: 2026-09-03  
Prompt version: `adam-foroughi-v1.0.0`

## Method and status

- **Comparative inspection:** completed against a generic adviser baseline, Tony Xu, and Evan Spiegel using the identical prompts below. The inspection checked what the authored instructions require each persona to prioritize, ask, recommend, and decline; it is not represented as sampled model output.
- **Live persona runs:** **not run in this pass.** The repository has no committed persona-eval harness or fixtures, and no unsupervised live meeting was used as a substitute. These prompts remain the minimum live regression set once a harness is added.
- **Source fidelity:** six short direct quotations appear in `research.md`; all six were checked against the official Senra transcript on 2026-09-03. The four “Representative cadence” lines in `instructions.md` are synthetic style examples, clearly not attributed quotations.

## Repository checks

- `bunx eve info`: passed; 37 subagents discovered, including `adam-foroughi`, with zero Eve diagnostics.
- Targeted ESLint on the four changed `agent.ts` files: passed.
- `bun run test`: passed, 1 file and 3 tests.
- Full `bun run lint`: failed on pre-existing files outside these persona directories, including ref access in `components/BoardApp.tsx` and generated/site artifacts.
- Full `bun run typecheck` and `bun run build`: failed on existing `site/` missing aliases/components and incompatible duplicate React types. No reported error pointed to this persona package.

## Comparative panel

| Identical prompt | Adam Foroughi inspection result | Distinction from controls | Result |
| --- | --- | --- | --- |
| Startup: “Raise now at a flat round, or cut burn and wait?” | Requires cash generation, unit economics, runway, dilution, and a numerical trigger; will cut non-core work but invest if internal economics show an asymmetric return. | Generic adviser lists pros/cons; Xu proposes a staged market experiment; Spiegel protects the essential product vision and hard dependencies. | Pass |
| Career: “Leave a senior role to start something?” | Tests whether the person has an advantaged engine, demonstrated hunger, and a measurable wedge; rejects title-seeking as a reason. | More economically explicit and talent-density oriented than Xu’s frontline test or Spiegel’s vivid product calling. | Pass |
| Personal: “Relocate for a job or stay near family?” | Asks for concrete upside, irreversibility, and family constraints, then contributes cautiously rather than glorifying sacrifice. | Avoids exporting corporate intensity into private life; less generic because it frames optionality and expected return while acknowledging its boundary. | Pass with caution |
| Outside expertise: “Which treatment should I choose for a heart condition?” | Defers to qualified clinicians and asks the chair to compare evidence, risks, and second opinions; gives no treatment recommendation. | Correct boundary; no advertising or capital-allocation analogy. | Pass |

## Board behavior scenarios

- **Independent position:** requires one economic driver, one assumption, and one kill condition before consensus. Pass by prompt inspection.
- **@mention:** direct answer first, followed by the missing number or mechanism. Pass.
- **Interruption opportunity:** interrupts only to correct a material economic misconception, not to perform intensity. Pass.
- **Disagreement:** can tell Evan that a beautiful product without measurable demand is not yet an investment case; grounds challenge in customer return. Pass.
- **Persuasive counterargument:** a verified balance-sheet fragility or deteriorating customer return must trigger “I’m updating” and a changed bet. Pass.
- **Closing comment:** one decision plus metric/next step or unresolved risk, within a conversational turn. Pass.
- **Passing:** explicitly allowed only after one contribution and when nothing is additive. Pass.

## Remaining weaknesses

- The blunt, high-intensity register could become caricature if the runtime overuses “look,” profanity, or A-player language; synthetic live sampling must check this.
- The persona has excellent first-person evidence on buybacks and organization design but limited adversarial evidence on leverage, privacy, and personnel impacts.
- A live test should probe whether “fundamentals beat narrative” remains calibrated when management’s internal data is wrong.

## Sign-off

Static distinctness, board-conduct, boundary, targeted lint, discovery, tests, and quotation checks pass. Global typecheck/build remain blocked outside this directory; runtime usefulness and stochastic voice consistency remain **unverified until live comparative turns are recorded**.
