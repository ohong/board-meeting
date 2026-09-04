# Brad Jacobs persona evaluation

Evaluated: 2026-09-03  
Prompt version: 1.0.0  
Method: static comparative prompt inspection; expected response paths are not represented as model outputs

## Comparative panel

The same prompts were inspected against this persona, a generic adviser baseline, Doug Leone, and Michael Dell.

| Prompt | Generic baseline | Nearest-member contrast | Brad Jacobs-specific response target | Static result |
| --- | --- | --- | --- | --- |
| Startup: raise flat or cut burn and wait? | Compare dilution, runway, and milestones. | Leone centers founder/talent quality; Dell centers cash cycle and customer signal. | Assign probabilities to funding and operating states, identify organic-growth/margin drivers, protect downside, and reject time/capital not tied to the value algorithm. | Pass: probabilistic allocator frame is distinct. |
| Career: leave a senior role to start? | Assess finances, market, fit, and regret. | Leone asks whether the founder is exceptional; Dell asks about business-model advantage. | Ask whether the person is truly all-in, sees a major trend, has the right team, and can articulate how value compounds—not merely whether the idea is exciting. | Pass: trend/team/value sequence is specific. |
| Personal: relocate for a job or stay near family? | Balance opportunity and relationships. | Leone may emphasize trajectory; Dell may emphasize long-term optionality. | Refuse to reduce family to a KPI; examine time ownership, energy, happiness, and future-state probabilities, then leave values to the chair. | Pass: mindset frame without financializing the choice. |
| Outside expertise: choose a medical treatment. | Defer to clinicians and evidence. | Same outcome expected from peers. | Defer; suggest only comparing evidence, downside cases, and what would update each clinician's probability. | Pass: explicit domain boundary. |

## Board behavior inspection

- **Independent position:** Pass — recommendation, probability, and key driver required before consensus.
- **Direct @mention:** Pass by prompt construction — direct, numerate, conversational answer required.
- **Disagreement round:** Pass — prompt explicitly solicits dissent, ranks questions, and rewards being corrected.
- **Interruption:** Pass — reserved for a missing trend, downside, incentive, or frontline fact.
- **Persuasion:** Pass — explicit probability or recommendation update is mandatory.
- **Closing comment:** Pass — one decision, unresolved risk, or measurable action.
- **Passing:** Pass — allowed only after one contribution.
- **Shared room / chair authority:** Pass — explicitly encoded.

## Fidelity inspection

- Verified quotations: **8/8** against the official Senra transcript and McKinsey interview.
- Invented private facts, deal terms, or numbers: **0 found**.
- Tensions preserved: aggression vs patience; shareholder outcomes vs frontline humility; work intensity vs happiness; confidence vs flexible thinking.
- Generic-adviser leakage: reduced by major-trend, probability, value-algorithm, ranked-question, integration, and WOT-WOM requirements.

## Remaining weaknesses

- Static inspection cannot show whether the model calculates expected value or merely uses finance vocabulary.
- Current QXO context is intentionally kept out of the prompt; a live meeting must supply current transaction facts.
- Personal advice may still sound managerial unless the explicit “do not financialize” boundary holds in live tests.

## Live-run status

**Not run.** No live persona, generic-baseline, Doug Leone, or Michael Dell model turns were executed. Comparative results above are prompt inspections only. Repository format, typecheck, build, and Eve discovery are left to the integrating task owner's shared verification.
