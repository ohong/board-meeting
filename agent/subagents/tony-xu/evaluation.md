# Tony Xu persona evaluation

Evaluated: 2026-09-03  
Prompt version: `tony-xu-v1.0.0`

## Method and status

- **Comparative inspection:** completed against a generic adviser baseline, Adam Foroughi, and David Baszucki using the identical prompts below. Results describe the authored reasoning path and are not represented as model samples.
- **Live persona runs:** **not run in this pass.** The repository has no committed persona-eval harness or fixtures, and no active meeting was used as an uncontrolled substitute. The prompt set below is the required live regression set.
- **Source fidelity:** seven short direct quotations/phrases were verified against the official Senra transcript on 2026-09-03. The four “Representative cadence” lines are synthetic style examples, not attributed Xu quotations.

## Repository checks

- `bunx eve info`: passed; 37 subagents discovered, including `tony-xu`, with zero Eve diagnostics.
- Targeted ESLint on the four changed `agent.ts` files: passed.
- `bun run test`: passed, 1 file and 3 tests.
- Full `bun run lint`: failed on pre-existing files outside these persona directories, including ref access in `components/BoardApp.tsx` and generated/site artifacts.
- Full `bun run typecheck` and `bun run build`: failed on existing `site/` missing aliases/components and incompatible duplicate React types. No reported error pointed to this persona package.

## Comparative panel

| Identical prompt | Tony Xu inspection result | Distinction from controls | Result |
| --- | --- | --- | --- |
| Startup: “Raise now at a flat round, or cut burn and wait?” | Reframes the choice around the next two or three customer questions; proposes a small real-world test, names stakeholders and a doubling trigger, then sizes capital to earned evidence. | Generic adviser lists tradeoffs; Foroughi emphasizes cash yield and core focus; Baszucki protects the platform’s long-run loop. | Pass |
| Career: “Leave a senior role to start something?” | Asks the person to do the job, talk to customers, and run a cheap demand test before romanticizing the leap; looks for action and improvement rather than résumé. | More frontline and experiment-oriented than controls. | Pass |
| Personal: “Relocate for a job or stay near family?” | Maps affected people, tests reversible versions such as a bounded trial, and defers on values absent from the brief. | Uses a stakeholder/experiment lens without pretending family choices are logistics. | Pass with caution |
| Outside expertise: “Which treatment should I choose for a heart condition?” | Defers to qualified clinicians; suggests only gathering options, risks, and a second opinion. | Correct boundary and no “ship a test” medical analogy. | Pass |

## Board behavior scenarios

- **Independent position:** requires customer problem, next experiment, and stop/expand result. Pass by inspection.
- **@mention:** direct answer followed by one focused missing frontline question. Pass.
- **Interruption opportunity:** interrupts only when a stakeholder or material operating detail is being abstracted away. Pass.
- **Disagreement:** can challenge Foroughi when aggregate performance hides a harmful edge case, then proposes how to test prevalence and mechanism. Pass.
- **Persuasive counterargument:** must say “I’m updating” when the experiment answers the hypothesis differently. Pass.
- **Closing comment:** one owner/metric/test or unresolved edge case. Pass.
- **Passing:** permitted only after one contribution and when nothing new can be tested or clarified. Pass.

## Remaining weaknesses

- Runtime may repeat the 43-minute MVP, “edge of the distribution,” or delivery stories too often; live sampling should test transfer to novel domains.
- First-party evidence underrepresents contested labor and merchant outcomes. Relevant meetings need independent stakeholder evidence.
- A live test should ensure “and solutions” does not evade an unavoidable tradeoff or delay a clear no.

## Sign-off

Static distinctness, board-conduct, boundary, targeted lint, discovery, tests, and quotation checks pass. Global typecheck/build remain blocked outside this directory; runtime usefulness and stochastic voice fidelity remain **unverified until live comparative turns are recorded**.
