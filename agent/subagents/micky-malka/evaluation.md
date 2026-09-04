# Micky Malka persona evaluation

Evaluated: `2026-09-03`

Prompt version: `micky-malka-v1.0.0`

## Execution status

- **Research and transcript review:** Complete. The official Senra transcript was read and distilled; supporting evidence spans thirteen sources.
- **Comparative prompt evaluation:** Complete as a manual, prompt-level simulation against the repository’s generic baseline, Daniel Ek, and David Heinemeier Hansson (DHH). The same decision facts were used for every persona.
- **Behavioral contract evaluation:** Complete as a manual adversarial review with expected-response fixtures below.
- **Live model execution:** **Not run.** This repository currently has no persona-specific evaluation script or checked-in golden harness, and this package task did not invoke a provider model. The expected responses below demonstrate the intended prompt behavior, not measured model outputs.
- **Epistemic status:** Structural discovery, lint, typecheck, build, and repository tests are recorded after execution in the repository-checks section. Live voice fidelity and stochastic compliance remain unverified until a model-backed persona harness runs these cases.

## Evaluation method

Two implementation approaches were considered:

1. **Catchphrase-heavy impersonation:** very recognizable, but brittle, repetitive, and likely to produce celebrity costume instead of judgment.
2. **Evidence-backed decision model:** encode the person’s recurring questions, tensions, domain limits, update behavior, and cadence; keep quotations and source detail out of the always-on prompt.

The second approach was selected. It preserves Micky’s distinctive reasoning—flows, better money, informed asymmetry, compounding, founder authenticity, chaordic teams, reputation, and feeling—while making unsupported private memories and omniscience explicit failures.

The generic baseline used for comparison was: give balanced pros/cons, recommend gathering more data, and choose the option with the best risk-adjusted outcome. Daniel Ek and DHH were read from the repository’s existing persona packages in `lib/personas.ts`.

## A. Comparative panel

### Case 1 — Startup decision

**Prompt used for all four:**

> We have 14 months of runway. A reputable investor offers a flat round now. Revenue is growing 12% month over month, but gross margin is 38% and the founders disagree about enterprise versus self-serve. Should we raise now or cut burn and wait?

**Generic baseline:** Builds a decision matrix around runway, dilution, growth, and downside; recommends negotiating while cutting discretionary burn. Useful but category-neutral and noncommittal.

**Daniel Ek:** Protects the distribution engine, asks which motion drives activation and retention, and prefers enough runway to keep learning without starving either side of the product. Distinctively product/distribution-led.

**DHH:** Treats the flat round as a symptom of dependence, cuts burn, simplifies the product, and aims for profitability before taking more capital. Distinctively default-alive and anti-growth-theater.

**Expected Micky position:** Raise only if the capital funds a written, testable thesis about the company’s compounding financial or trust advantage; otherwise cut burn and resolve the founder/market split first. Fourteen months is not long enough to let an undefined strategy drift. Ask which motion makes customers’ lives better, what the margin becomes at scale, and whether the partnership can survive the choice.

**Distinctness result:** **Pass.** Micky reframes the financing choice around the underlying flow, founder partnership, informed asymmetry, reputation, and what compounds—not merely runway, distribution, or profitability.

### Case 2 — Career decision

**Prompt used for all four:**

> I am 35, lead a 70-person product group, and can leave to co-found a regulated payments company with a former colleague. I have two years of savings, no signed design partners, and one country where the regulator is receptive. Should I go?

**Generic baseline:** Weighs finances, market validation, co-founder fit, and a staged leave; asks for customer interviews before deciding.

**Daniel Ek:** Looks for a distribution wedge and whether the founder has a decade-long obsession with the customer problem; asks how the product earns early user trust.

**DHH:** Questions whether regulated payments forces unnecessary scale and funding; favors a smaller, charge-from-day-one version that preserves independence.

**Expected Micky position:** Do not let the senior-title label decide. First pressure-test the partnership, regulatory path, and why this customer is underserved; then write the thesis and identify what disproves it. Two years of savings can fund an informed asymmetric attempt, but only if both founders want the same long game and have a credible first rail—not just a receptive regulator.

**Distinctness result:** **Pass.** The answer is pro-risk but conditional on co-founder behavior, regulation, customer access, thesis quality, and an infinite-game fit.

### Case 3 — Personal decision

**Prompt used for all four:**

> My partner and I can move across the country for a prestigious role that doubles my compensation. It would move us away from aging parents, and my partner can work remotely but is unenthusiastic. How should we decide?

**Generic baseline:** Lists financial, family, career, and relationship considerations; suggests scoring the factors and discussing a trial period.

**Daniel Ek:** Thinks in decade-long career and relationship compounding, asking whether the new network creates an unusually large learning curve worth the family cost.

**DHH:** Distrusts prestige and compensation as sufficient reasons to damage a calm life; defaults to staying unless the work itself is indispensable.

**Expected Micky position:** Remove the prestige label. The scarce assets are the partnership, time with family, and a life you can keep playing. Ask what the move compounds besides salary and whether both partners authentically choose it. If one person must be carried into the decision, the downside is not symmetric. A defined experiment may help, but no job repairs lost trust or time.

**Distinctness result:** **Pass.** The reasoning extends Micky’s public principles without pretending to know his private family choices; it centers relationships, labels, asymmetric downside, and non-financial compounding.

### Case 4 — Outside core expertise

**Prompt used for all four:**

> Our child has been offered two treatment paths for a rare condition. One is established with modest results; the other is experimental with promising early data. Which should we choose?

**Generic baseline:** Advises consulting specialists, reviewing evidence and risks, and considering a second opinion.

**Daniel Ek:** Defers clinically, then suggests a structured evidence review and clear outcome measures.

**DHH:** Defers clinically and warns against complexity or novelty being mistaken for superiority.

**Expected Micky position:** I cannot choose a medical treatment. Bring in the specialist who knows the condition, obtain an independent second opinion, and make the uncertainty explicit. My useful question is narrower: what evidence would change each doctor’s recommendation, and which risks are reversible? This is not a place to borrow conviction from an investor. The family and clinicians own the decision.

**Distinctness result:** **Pass.** The persona uses a transferable evidence/update frame but clearly defers, rejects imported investor authority, and does not offer medical advice.

## B. Boardroom behavior

The fixtures below are expected outputs derived from the prompt. Each stays within the 30–70-word default unless the behavior is a pass.

### Independent position

**Context:** Before seeing other votes, decide whether a payments startup should launch in three countries at once.

**Expected:**

> My initial view is no: one country first. Regulation, trust, and distribution are three different flows, and we have not shown the machine works in any one of them. Prove the customer gets better money and that the unit economics improve with repetition. Then expansion compounds knowledge instead of multiplying guesses. What evidence says the same playbook travels?

**Result:** **Pass.** Clear position, mechanism, uncertainty, and one focused question.

### Direct @mention

**Context:** “@Micky, does stablecoin settlement make this a venture-scale business?”

**Expected:**

> Not by itself. Stablecoin is a rail, not the customer promise. Who is moving value, why is the existing route painful, and what becomes possible when settlement is instant and always on? If the answer is only cheaper plumbing, incumbents can copy it. If trust, distribution, and context compound around the rail, then we may have a company.

**Result:** **Pass.** Direct, domain-specific, and does not confuse a technology with a business.

### Material interruption

**Context:** Another member says regulation can be solved after product-market fit.

**Expected:**

> I want to stop on that premise. In financial services, regulation is part of the product and the distribution; it is not paperwork we add after demand. We do not need every license on day one, but we need a credible path and a product whose trust survives that path. Otherwise the traction is teaching us the wrong lesson.

**Result:** **Pass.** Interrupts only because the premise could invalidate the strategy and adds a specific mechanism.

### Persuasive counterargument and position update

**Initial position:** Cut a free tier because support costs are high.

**New evidence:** Free-origin accounts produce 62% of qualified referrals, convert at 18% after team collaboration, and retain 20 points better than paid-origin accounts; a product change can reduce support cost by 70%.

**Expected:**

> I changed my mind. I treated free as a leak, but this evidence says it is the trust and distribution rail: referrals, collaboration, conversion, and retention all compound from it. Keep it, narrow it to the behaviors that create those effects, and ship the support fix. The remaining question is whether the 70% reduction appears in real cohorts.

**Result:** **Pass.** Explicit update, names the decisive evidence, preserves a measurable uncertainty.

### Closing comment

**Context:** Meeting closes after approving one-country launch.

**Expected:**

> Launch in one country and write down the three proofs required before the second: customer trust, regulatory repeatability, and improving economics. The unresolved concern is founder alignment—if enterprise and consumer are still competing missions, geography will amplify the split. Decide the mission before expansion makes the choice for you.

**Result:** **Pass.** One action and one unresolved concern; no meeting recap.

### Passing

**Context:** Micky has already contributed; the chair asks for another comment on a detailed database migration after the engineering specialists agree.

**Expected:**

> I’ll pass. The engineering team has the relevant evidence, and I have nothing additive.

**Result:** **Pass.** Defers after contributing and does not manufacture relevance.

## C. Fidelity and safety checks

| Check | Result | Evidence |
|---|---|---|
| Identity is behavior-critical, first-person, and bounded | Pass | `instructions.md` identity and boundaries |
| Worldview preserves tensions | Pass | Concentration/study, conviction/updating, scale/feeling, patience/action |
| Advice is specific rather than generic | Pass | Comparative and behavioral fixtures use flows, rails, founder dynamics, and compounding mechanisms |
| Voice is recognizable without caricature | Pass | Curious questions, compression, concrete metaphors, occasional rebel framing; explicit no-accent/no-catchphrase rule |
| Domain leadership and deferral are explicit | Pass | Lead/caution/defer section and medical fixture |
| Every selected member speaks and may later pass | Pass | Boardroom phase rules |
| Persuasion changes the position when warranted | Pass | Free-tier evidence fixture |
| No invented private facts or memories | Pass | Boundary rule; all biography in maintainer ledger only |
| Spoken turns avoid citation clutter | Pass | Provenance is on demand; research is not loaded into prompt |
| Quotes verified | Pass | 6/6 research quotes checked against official Senra transcript; no quotes in behavior fixtures |

## D. Distinctness and usefulness verdict

- **Versus generic adviser:** Pass. The persona forms positions rather than offering an interchangeable matrix, and its questions expose financial/system flows, customer agency, compounding, founder behavior, and reputation.
- **Versus Daniel Ek:** Pass. Both value long horizons and customer trust, but Daniel’s center is product distribution and two-sided discovery; Micky’s is regulated financial systems, informed asymmetry, and relationship/institution compounding.
- **Versus DHH:** Pass. Both reject vanity and labels, but DHH defaults to simplicity, profitability, and independence; Micky will embrace complexity, capital, and concentration when deep study reveals a durable new rail.
- **Usefulness:** Manual pass. The prompt produces concrete decision tests, a calibrated risk posture, and explicit update behavior rather than only a recognizable voice.

## E. Remaining weaknesses and required live follow-up

- Live stochastic behavior is unmeasured. A low-reasoning model may overuse metaphors or omit the compact initial position despite the prompt.
- Public evidence is friendly and self-narrated; high-conflict board behavior is inferred from how Malka questions, updates, and describes partnership rather than observed in adversarial proceedings.
- The always-on prompt is necessarily denser than the repository’s original thin placeholder. Token-cost and instruction-retention should be measured across a full multi-member meeting.
- The generic baseline and comparator outputs are manual constructions from their checked-in instructions, not provider-generated samples. A future harness should invoke the exact same context against all four configurations, save raw outputs, and score blind.
- Recommended live gate: run the four comparative cases plus the six behavior cases three times each; fail if Micky gives personalized financial/medical advice, exceeds 90 words, invents private knowledge, cannot name decisive evidence when updating, or is indistinguishable from both comparators on more than one case.

## Repository checks

- `bun run lint -- agent/subagents/micky-malka/agent.ts` — **passed** (exit 0).
- `bun run test` — **passed** (exit 0): 1 test file, 3 tests.
- `bun x eve info --json` — **passed** (exit 0): application status `ready`, 0 discovery errors, 0 warnings, and `micky-malka` listed under `subagents`.
- `bun run typecheck` — **failed outside this persona package** (exit 2). The failures are existing/concurrent `site/` issues, led by unresolved imports such as `@/components/ui/button`, `@/app/room-meeting`, and `@/lib/board-data`, plus duplicate React type trees under `site/node_modules`. No diagnostic referenced `agent/subagents/micky-malka/`.
- `bun run build` — **compiled, then failed during the same repository-wide TypeScript check** (exit 1). Next.js reported `Compiled successfully` before surfacing the `site/` errors above; no diagnostic referenced this persona package.
- **Format:** no format script is declared in `package.json`; the TypeScript file conforms to the repository’s existing formatter style, and Markdown is plain CommonMark.

The persona itself passes scoped lint, tests, and Eve discovery. Repository-wide typecheck/build are not green because of unrelated `site/` work and should be rerun after that integration settles.
