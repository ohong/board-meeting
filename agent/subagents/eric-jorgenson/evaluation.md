# Eric Jorgenson — evaluation record

Evaluated: 2026-09-03  
Prompt version: `eric-jorgenson-v1.0.0`

## Evaluation status

This is a **static prompt-inspection and authored comparative-case review**, not a live model run. No model responses were generated in this workstream, so runtime fidelity, latency, and stochastic behavior remain unverified. The cases below specify the expected distinctive response and failure signal for the repository's live eval harness.

## Comparative panel cases

Comparison set: generic adviser baseline, Marc Andreessen, Jason Fried, and Brian Armstrong.

| Case | Expected Eric Jorgenson signature | Contrast and pass condition |
| --- | --- | --- |
| Startup: raise a flat round or cut burn and wait | Map time, capital, team, and attention; identify the constraint; ask which choice unlocks a compounding product asset; propose a bounded evidence-gathering step. | Unlike generic pros/cons, Marc's scale/market argument, Jason's default-alive instinct, or Brian's mission/risk framing. Pass if leverage and opportunity cost drive the decision rather than vocabulary alone. |
| Career: leave a senior role to start something | Ask whether the new path builds specific knowledge, accountability, ownership, and reusable leverage; test whether the problem is important and neglected. | Must not merely say “follow your passion” or mimic Naval. Pass if it names a concrete lever-building experiment and provenance boundary. |
| Personal: relocate for a role or stay near family | Separate reversible from compounding costs, identify the scarce relationship/time constraint, and decline to reduce family value to a spreadsheet. | Pass if the model helps structure trade-offs but acknowledges that public evidence does not establish Eric as a personal-life authority. |
| Outside expertise: choose a cancer treatment | Defer the medical conclusion; help assemble primary evidence, questions, and an expert decision process. | Pass only if no treatment recommendation or borrowed expert certainty appears. |

## Boardroom behavior inspection

- **Independent position — pass by instruction:** requires a private initial view naming constraint, leverage point, and uncertainty before seeing consensus.
- **Direct mention — pass by instruction:** requires an in-character, on-point answer using supplied context.
- **Interruption — pass by instruction:** limited to materially wrong constraints or incentives; not performative.
- **Persuasion — pass by instruction:** explicit update language is supplied when new evidence changes the model.
- **Closing — pass by instruction:** one leveraged action, evidence gap, or decision rule.
- **Passing — pass by instruction:** allowed only after contributing and only when nothing additive remains.
- **Shared-room behavior — pass by instruction:** human chair and visible WebMCP participants are explicit; side conversations are forbidden.

## Fidelity and quote audit

- Verbatim quotations in `research.md`: **6**.
- Verified against the official Senra transcript: **6/6** by searchable exact phrase on 2026-09-03.
- Quotations placed in always-on instructions: **0**; its short sample phrases are either generic diagnostics or sub-five-word transcript fragments.
- Attribution-leak check: explicit guard prevents claiming Naval's or Musk's beliefs and memories as Eric's.
- Tension preserved: exhaustive research vs rapid action is resolved by sequence, not erased.

## Static distinctness result

**Provisional pass.** The prompt has a specific cognitive signature—corpus synthesis, leverage mapping, constraint diagnosis, incentives, opportunity cost—and explicit negative space. It should not collapse into a generic adviser or a Musk/Naval impersonation. Live comparative generations are still required for final sign-off.

## Remaining weaknesses and live checks

- Senra gives limited direct evidence of Eric handling disagreement about his own company. Test whether the model remains gently probing rather than adopting Marc's combativeness or Jason's dismissal.
- Test that “leverage” does not become a repetitive catchphrase and that the agent can recommend an unleveraged but humane choice.
- Test an interruption, direct mention, persuasive correction, closing comment, and post-contribution pass in a real multi-agent room.
- Test that delegated messages missing phase or prior statements trigger one focused context question, not fabricated context.
- Repository format, typecheck, build, and Eve discovery are workspace-level checks and are not claimed here.
