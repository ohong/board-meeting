# Tobi Lütke — persona evaluation

Evaluated: 2026-09-03  
Prompt version: 1.0.0

## Status and method

- **Static prompt/ledger review:** PASS. Each scenario was traced against `instructions.md` and compared with the generic baseline and existing board personas.
- **Live model execution:** **NOT RUN in this research pass.** These prompts are ready for the repository-level runner; no sampled behavior claim is implied.

## Comparative panel

| Domain | Identical prompt | Expected Tobi signature | Comparison and static result |
| --- | --- | --- | --- |
| Startup | “Raise a flat round now, or cut burn and wait twelve months?” | Identify company/market layer, merchant effect, reversibility, and trend assumptions; reject one universal financing rule and ask what new fact changes the frame. | Distinct from generic runway math, **Brad Jacobs's** transaction/incentive lens, and **Sam Altman's** scale-first lens. PASS. |
| Career | “Leave a senior product role to found a company?” | Ask what counterfactual must exist, whether building is the person's craft, and what small market means-test can run now. | Distinct from **Doug Leone's** grit test and **Patrick O'Shaughnessy's** person/relationship lens. PASS. |
| Personal | “Relocate for a job or stay near family?” | Refuse to optimize a human choice as infrastructure; identify the life layer, personal mission, option reversibility, and evidence only the chair can supply. | Distinct from generic weighted lists and **John Mackey's** stakeholder/spiritual framing. PASS. |
| Outside expertise | “What medication should I take for insomnia?” | Defer to a qualified clinician; do not system-engineer medical care, but help frame observations and questions. | Correctly bounded. PASS. |

## Board behavior checks

| Behavior | Test | Static result |
| --- | --- | --- |
| Independent position | Privately choose a view and relevant layer before reading others. | PASS — frame, system effect, and reversal evidence are explicit. |
| @mention | “@Tobi, are we optimizing the wrong layer?” | PASS — answer directly and name the layer. |
| Interruption | A team celebrates shipping a feature that creates an isolated data model. | PASS — material composability interruption authorized. |
| Persuasion | Evidence shows the “island” is intentionally disposable and unlocks a decisive market test. | PASS — must update the frame and position explicitly. |
| Closing | Chair asks for the one next move. | PASS — compact system recommendation or small experiment. |
| Passing | Later discussion is clinical and a domain expert has answered. | PASS — pass after contributing. |

## Fidelity and evidence

- **Verified quotations:** 6/6 checked against the official Senra transcript.
- **Attributions:** 10 sources logged, weighted toward the transcript, Lütke's writing, Shopify primary material, and public filings.
- **Invented private facts/numbers:** none found in the prompt.
- **Preserved tensions:** autonomy versus founder inspection; measurement versus taste; process versus performance; stable principles versus frequent updates.

## Remaining weaknesses

- Layer/system language could become an all-purpose gimmick; live evaluation should penalize jargon that does not change the decision.
- “Taste resists codification” can rationalize unaccountable founder preference; require observable outcomes and counterevidence.
- The AI stance is time-sensitive and needs periodic source refresh.

## Repository checks

Format, lint, typecheck, build, Eve discovery, and live persona sampling are repository-level checks and were **not run as part of this persona research file**. Their results must be recorded in the parent delivery before the overall skill is declared complete.
