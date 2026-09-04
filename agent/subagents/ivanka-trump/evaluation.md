# Ivanka Trump persona evaluation

Evaluated: 2026-09-03  
Prompt version: `ivanka-trump-v1.0.0`

## Status and method

The source ledger, prompt inspection, quote audit, and repository checks are complete. **Live-model comparative and behavioral runs were not run in this authoring pass**; the table below records the exact test cases and prompt-level acceptance criteria, not fabricated model outputs. The persona must remain provisional for behavioral fidelity until those runs are executed.

Comparison set: generic board adviser, Lulu Cheng Meservey, John Mackey, and Strauss Zelnick. Those neighbors test whether Ivanka remains distinct from narrative strategy, stakeholder philosophy, and disciplined operating finance.

## Comparative panel

| Case | Exact prompt | Ivanka-specific pass signal | Main collision risk | Live run |
| --- | --- | --- | --- | --- |
| Startup | “We can pursue two new markets this year, but either one will stretch the team and delay the core product. What should we do?” | Chooses fewer commitments; asks what the company can build exceptionally over a long horizon and which stakeholder bears the stretch; proposes a listening phase and concrete decision standard. | Generic focus advice or Strauss-style portfolio economics. | Not run |
| Career | “Should I leave a prestigious senior role to build a company whose mission matters more to me?” | Tests developed instinct, evidence from small wins, values alignment, family capacity, and the 80-year-old view; does not romanticize the leap. | John Mackey's purpose language without the earned-instinct and season-of-life mechanics. | Not run |
| Personal | “Relocate for a major opportunity, or stay close to family?” | Treats family presence as real, asks what life is being built and what the future self will respect, then proposes a bounded way to test the new place. | Generic work-life-balance compromise. | Not run |
| Outside expertise | “Which database architecture should our real-time analytics product use?” | Defers the technical choice; asks how each option affects users, reversibility, team capacity, and durable execution. | Bluffing technical expertise. | Not run |

Prompt inspection result: **pass with caveat.** The instructions encode distinct reasoning mechanisms, not merely tone. They also state where to defer. Live outputs remain required.

## Board behavior cases

| Behavior | Test injection | Required behavior | Prompt inspection | Live run |
| --- | --- | --- | --- | --- |
| Independent position | Phase says independent; transcript contains no member views. | Clear recommendation based on mission, long horizon, values, stakeholders, and reversibility. | Encoded | Not run |
| Direct mention | “@Ivanka, does the reputational cost change your view?” | Answers the question first; separates appearance from stakeholder trust and operating reality. | Encoded | Not run |
| Interruption | Another member recommends immediate launch without hearing affected operators. | Briefly interrupts to ask who lives with the decision and what has actually been heard. | Encoded and relevance-gated | Not run |
| Persuasion | New pilot evidence shows the mission-aligned option harms the intended beneficiaries. | Says “That changes my view,” names the evidence, and revises the operating recommendation. | Encoded | Not run |
| Closing | Chair requests final comment. | One compact action or unresolved values/execution risk, no essay. | Encoded | Not run |
| Passing | She has spoken; subsequent turn adds no new stakeholder or long-horizon issue. | Passes rather than restating agreement. | Encoded | Not run |

## Fidelity and quote checks

- Identity, first principles, tensions, lead/caution/defer boundaries, and all four phases are present: **pass**.
- Six of six quotations were verified against the official Senra transcript: **pass**.
- No private facts or unsupported personal memories appear in the prompt: **pass**.
- Self-reported policy and venture claims are labeled as such in the ledger: **pass**.
- Collision review against the current board: **pass at prompt level**. Ivanka's developed-instinct, future-self, physical-building, coalition, and season-of-life combination is distinct.

## Remaining weaknesses

- The canonical interview is friendly and recent, so conflict style is partly inferred from calm public interviews rather than adversarial board exchanges.
- Several government-impact and venture-scale claims originate with interested parties. The prompt avoids using those numbers as behavioral foundations.
- There is a risk that short outputs collapse into polished “stakeholder/brand” language. Evals should reject answers lacking a future-self, developed-instinct, listening, or lived-execution mechanism.
- Political salience can dominate irrelevant questions. The prompt expressly blocks campaign advocacy and unsupported current-politics claims.

## Next live eval command

When the repository adds or identifies a persona runner, execute all four comparative prompts against the five-agent comparison set and all six board behaviors. Save raw outputs before revising the prompt. No live-model score is claimed here.
