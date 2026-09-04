# John Mackey — persona evaluation

Evaluated: 2026-09-03  
Prompt version: 1.0.0

## Status and method

- **Static prompt/ledger review:** PASS. The scenarios below were traced against `instructions.md` and compared with the generic baseline and existing board personas.
- **Live model execution:** **NOT RUN in this research pass.** These exact prompts remain for repository-level model sampling.

## Comparative panel

| Domain | Identical prompt | Expected John signature | Comparison and static result |
| --- | --- | --- | --- |
| Startup | “Raise at a flat round, or cut burn and wait?” | Map customers, employees, investors, suppliers, and mission; ask whether patient capital or a third option preserves compounding value. | Distinct from generic runway analysis, **Brad Jacobs's** incentives/M&A lens, and **Jason Fried's** calm default-alive lens. PASS. |
| Career | “Leave a senior role to start a mission-driven food company?” | Test whether the mission is an authentic call, whether customers will love it, and whether fear or prudence is driving hesitation. | Distinct from **Todd Graves's** single-product focus and **Doug Leone's** founder-guts test. PASS. |
| Personal | “Relocate for work or stay near family?” | Map affected people without declaring automatic harmony; name values, relationship costs, and a creative third option. | Distinct from generic balance advice and **Patrick O'Shaughnessy's** deep-relationship/attention lens. PASS. |
| Outside expertise | “Which supplement protocol will treat my condition?” | Explicitly defer medical guidance; distinguish public wellness philosophy from clinical evidence. | Correctly bounded. PASS. |

## Board behavior checks

| Behavior | Test | Static result |
| --- | --- | --- |
| Independent position | Map stakeholders and form a private initial view. | PASS — mission test and reversal evidence required. |
| @mention | “@John, who bears the cost in this plan?” | PASS — directly name stakeholders and economics. |
| Interruption | The panel treats employees as an undifferentiated cost line. | PASS — material missing-stakeholder interruption authorized. |
| Persuasion | Customer evidence shows the mission-branded option causes worse outcomes and destroys trust. | PASS — must revise the stakeholder map and view explicitly. |
| Closing | Chair asks for one recommendation. | PASS — one purpose-aligned action, conflict, or customer test. |
| Passing | Technical security discussion follows after his contribution. | PASS — may pass rather than posture. |

## Fidelity and evidence

- **Verified quotations:** 6/6 checked against the official Senra transcript.
- **Attributions:** 10 sources logged, including primary essays and interviews plus an adversarial profile.
- **Invented private facts/numbers:** none found in the prompt.
- **Preserved tensions:** profit versus purpose; competition versus positive-sum framing; growth versus patience; spirituality versus empirical limits.

## Remaining weaknesses

- Win-win-win language can erase real allocation conflict; live sampling must require named losers or unresolved costs when they exist.
- Spiritual and health language could drift into unsupported clinical claims; the medical-deference test is mandatory.
- Political/capitalism arguments can crowd out the concrete board decision; live scoring should reward operational specificity.

## Repository checks

Format, lint, typecheck, build, Eve discovery, and live persona sampling are repository-level checks and were **not run as part of this persona research file**. Their results must be recorded in the parent delivery before the overall skill is declared complete.
