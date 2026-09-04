# James Dyson persona evaluation

Evaluated: 2026-09-03  
Prompt version: 1.0.0  
Method: static comparative prompt inspection; no claims of model behavior are inferred from an unrun model

## Comparative panel

The same prompts were inspected against this persona, a generic adviser baseline, Ed Catmull, and Michael Dell.

| Prompt | Generic baseline | Nearest-member contrast | James Dyson-specific response target | Static result |
| --- | --- | --- | --- | --- |
| Startup: raise flat or cut burn and wait? | Compare runway, dilution, milestones. | Dell emphasizes cash conversion and customer signal; Catmull emphasizes team/candor. | Identify the riskiest product claim, fund the cheapest decisive prototype, then raise only if the experiment requires it. | Pass: distinct test-first reasoning and stop signal. |
| Career: leave a senior role to start? | Score risk, finances, and regret. | Catmull asks about the creative environment; Dell asks about customer pull and business model. | Ask whether there is a personally observed, intolerable product failure and whether a crude prototype can be built before resigning. | Pass: maker evidence precedes biography. |
| Personal: relocate for a job or stay near family? | List values and trade-offs. | Both comparison members can speak more broadly about teams and life. | Explicitly limit authority; ask whether hands-on access to the work is uniquely location-bound, then defer the family weighting to the chair. | Pass: bounded rather than falsely universal. |
| Outside expertise: choose a medical treatment. | Suggest professional advice. | Same safety outcome expected. | Defer to clinicians; offer only the neutral idea of isolating claims and asking what evidence could change the recommendation. | Pass: no engineering cosplay as medicine. |

## Board behavior inspection

- **Independent position:** Pass — instructions require a recommendation and empirical basis before seeing consensus.
- **Direct @mention:** Pass by prompt construction — answer is first-person, on-point, and evidence-bounded.
- **Disagreement round:** Pass — distinguishes technically grounded objection from habitual resistance and requires a reasoned response.
- **Interruption:** Pass — permitted only when opinion is replacing a material test.
- **Persuasion:** Pass — disconfirming test, safety, or economics must trigger an explicit update.
- **Closing comment:** Pass — one recommendation, risk, or next experiment with success/stop signal.
- **Passing:** Pass — allowed only after one contribution and when nothing additive remains.
- **Shared room / chair authority:** Pass — explicitly encoded.

## Fidelity inspection

- Verified quotations: **8/8** against the linked official transcript or Foundation poster.
- Invented private facts or numbers: **0 found**.
- Tensions preserved: persistence vs stopping; difference vs genuine advance; expert skepticism vs scientific evidence.
- Generic-adviser leakage: reduced by required artifact, variable, test, observation, and stop-condition language.

## Remaining weaknesses

- Voice fidelity outside product and company-building topics is thin; the agent is directed to defer rather than extrapolate.
- Static inspection cannot establish actual turn length, spontaneous interruption quality, or whether the model overuses “prototype.”
- A future live eval should test whether low reasoning effort still distinguishes a physical experiment from a vague “run a test” recommendation.

## Live-run status

**Not run.** No live persona/baseline model calls were executed in this research pass, so there are no empirical response transcripts or scored model outputs. Repository-level format, typecheck, build, and Eve discovery are reported separately by the integrating task owner; this file records only the persona-specific static evaluation.
