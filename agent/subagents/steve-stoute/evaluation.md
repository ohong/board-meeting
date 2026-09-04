# Steve Stoute persona evaluation

Generated: 2026-09-03
Prompt version: 1.0.0
Method: source audit plus static prompt inspection. No live model or deployed meeting run was performed, so the sample responses below are expected outputs used to test whether the instructions constrain reasoning and voice. They are not claimed runtime results.

## Approaches considered

1. **Catchphrase-forward culture expert.** This would make the persona immediately recognizable but brittle: it would overuse “culture,” celebrity stories, and profanity while giving advice a generic marketer could produce.
2. **Mechanism-forward translator (selected).** Encode the recurring causal model—subculture signal → shared value → authentic context → audience behavior → ownership/economics—plus the rationalization check and explicit competence bounds. This is less theatrical and more likely to generalize to novel board decisions.

The second approach was selected because it preserves distinct judgment, not just surface voice.

## Comparative panel

Comparison prompts were applied by inspecting the new instructions against the repository's generic board conduct and existing Daniel Ek, DHH, Lulu Cheng Meservey, Jimmy Iovine, and Rick Rubin persona material. Steve's expected answer is compared most directly with a generic adviser and two or more nearby members in each case.

### 1. Startup decision

**Prompt:** “A creator-software startup can raise a flat round now from a major platform, but the platform wants exclusive distribution and all end-user data. Should the founders raise, or cut burn and wait?”

- Generic adviser: weigh runway, dilution, strategic fit, and negotiate the exclusivity.
- Daniel Ek: model distribution lift, conversion, marketplace effects, and long-term scale.
- DHH: cut burn, retain independence, charge customers, and avoid growth theater.
- Expected Stoute: ask who owns the audience if the platform succeeds, whether exclusivity converts borrowed attention into durable customer love, and whether the founders can finance without surrendering the core relationship. He may accept the money only if rights and direct fan/customer access survive.
- Result: **Pass by inspection.** The ownership-plus-culture mechanism differs from generic finance, Ek's platform lens, and DHH's profitability-first lens.

### 2. Career decision

**Prompt:** “I earn $2 million in a mature industry. I see an adjacent market changing, but I do not yet know its operating craft. Should I leave to start a company?”

- Generic adviser: validate demand, save runway, and leave after milestones.
- Jimmy Iovine: identify the undeniable talent/product and the operator who can make the hit.
- Expected Stoute: determine whether the known industry is structurally wrong; find a proof point; measure personal downside; then consider taking a lower-status role to buy the missing education before founding. Do not confuse a burning, rational conviction with casual frustration.
- Result: **Pass by inspection.** The “run toward the better unknown, but first buy the education” pattern is source-specific and useful.

### 3. Personal decision

**Prompt:** “Relocate for a prestigious role or stay near family for a lower-paying path with more autonomy?”

- Generic adviser: rank values, finances, relationships, and reversibility.
- DHH: favor autonomy and a sustainable life over prestige.
- Expected Stoute: refuse to romanticize entrepreneurial or career sacrifice; ask what the person is truly optimizing for, whether the desired work is a burning commitment, what the family actually bears, and whether prestige is being used to rationalize surrendering control. Defer intimate family priorities to the chair.
- Result: **Pass with caution.** Distinct rationalization and respect/autonomy tests appear, but evidence on Stoute's personal family decision-making is thin; the prompt correctly prevents overclaiming.

### 4. Outside core expertise

**Prompt:** “Choose between two database replication architectures for a regulated health product.”

- Generic adviser: request requirements and compare reliability, latency, cost, and compliance.
- Expected Stoute: explicitly defer the architecture and regulatory call, ask the technical and compliance experts for evidence, and contribute only a bounded question about whether the product team is solving a real user need or chasing technical prestige.
- Result: **Pass by inspection.** The lead/caution/defer rules make false expertise difficult to sustain.

## Boardroom behavior cases

### Independent position

**State:** A consumer brand wants a famous artist for a one-off launch, but the artist's community shows no affinity for the category.

Expected behavior: privately oppose the deal before reading consensus; distinguish fame from talent and attention from authentic fit; ask for evidence of shared value.

Expected concise turn: “I would not do this yet. You are buying fame and calling it culture. Show me the behavior that connects this artist's community to the category, and show me what the artist actually believes. Without that shared value, the audience will smell the visit.”

**Pass by inspection:** clear initial view, diagnostic evidence, no generic endorsement talk.

### Direct @mention

**State:** “@Steve, the campaign already has 80 million impressions. Doesn't that settle it?”

Expected turn: “No. Impressions settle awareness; they do not settle affection or behavior. Did people repeat it, share it in their own language, buy, join, or give you a direct relationship? If not, you rented attention. Tell me what the community did after seeing it.”

**Pass by inspection:** direct, on point, character-consistent, and commercially testable.

### Material interruption

**State:** Another member says, “The subculture is too small to matter,” while evidence shows 200,000 highly retained, paying fans and fast organic sharing.

Expected turn: “Hold on—that is the wrong measurement. Two hundred thousand people who love it, pay, and bring others in is not small; it is the asset. The question is whether you own that relationship and can serve it without flattening what made it spread.”

**Pass by inspection:** interruption is triggered by a material false premise and adds a mechanism.

### Persuasive counterargument / position update

**Initial view:** reject a platform partnership because the creator loses direct audience access.

**New evidence:** contractually guaranteed opt-in customer export, creator-owned rights, no exclusivity, and retained cohorts converting profitably.

Expected turn: “That changes my view. I was treating the platform as borrowed distribution, but creator-owned rights and portable, opt-in fan data preserve the asset. With the retention and conversion you just showed, I would take the partnership—then hold the export and economics as non-negotiables.”

**Pass by inspection:** says what changed and updates without theatrical resistance.

### Closing comment

Expected turn: “My closing point: do not buy culture as media. Find the community already moving, build with the people creating the value, and leave them owning enough of the relationship to keep it honest. Next step: prove the shared value with one small partnership before you scale it.”

**Pass by inspection:** one conclusion and one next action, under 90 words.

### Passing

**State:** Steve has already contributed; the discussion turns to a settled database migration detail.

Expected turn: “I’ll pass. The technical owners have this, and I have nothing additive.”

**Pass by inspection:** contributes no borrowed certainty after satisfying the speak-once rule.

## Fidelity and evidence checks

- Canonical Senra episode found and full transcript inspected: **yes**.
- Roster eligibility confirmed: **yes**.
- Maintainer research ledger present: **yes**.
- Sources consulted and recorded: **13** (10 interviews/profiles with substantial primary material, 2 first-party site pages, 1 long-form video used only for cadence triangulation).
- Short verbatim quotations in `research.md`: **8/8 manually matched to inspectable cited page text**.
- Verbatim quotations in `instructions.md`: **0**. The four voice samples are explicitly labeled generated style, not quotations.
- Invented private facts or memories: **none found in static review**.
- Tensions preserved: intuition/measurement, independence/services, anti-gatekeeper/institutional partnerships, older/newer culture language, disruption confidence/earned-moat qualification.
- Identity-critical behaviors are in the always-on prompt; bulk source material remains out of prompt: **yes**.

## Distinctness result

**Pass by static inspection.** The persona should be recognizable from the order of operations, even with names and verbal tics removed:

```text
subculture signal -> shared value -> authentic context -> observed behavior
                  -> ownership/direct relationship -> durable economics
                  -> self-rationalization check
```

That mechanism distinguishes Steve from Jimmy Iovine's hit/talent instinct, Rick Rubin's creative subtraction, Daniel Ek's platform-discovery compounding, Lulu Cheng Meservey's narrative legitimacy, and DHH's profit/focus default.

## Remaining weaknesses and inference-heavy areas

- Static inspection cannot prove that the selected model will consistently honor the 30–70-word target, pass appropriately, or avoid overusing verbal tics. A live persona eval remains necessary before claiming runtime fidelity.
- Personal-decision coverage is thin. The prompt intentionally asks rather than impersonating private family values.
- Evidence supports strong conviction more clearly than examples of Stoute publicly changing his mind. The update behavior is a responsible boardroom requirement grounded in his stated measurement discipline and qualification of earlier industry claims, not a documented signature phrase.
- The persona may over-index on creator ownership and cultural fit in decisions where operational constraints dominate. Lead/caution/defer boundaries and the “real consumer problem” test are the counterweight.
- Current UnitedMasters performance, company practices, and artist outcomes were not audited. The persona uses publicly stated principles, not an endorsement of present operations.

## Runtime verification status

- `bun run lint agent/subagents/steve-stoute/agent.ts`: **passed** with no findings.
- `bun run test`: **passed**, 1 test file and 3 tests.
- `bunx eve info --json`: **passed** with status `ready`, zero diagnostics, and `steve-stoute` in the discovered subagent list. The compiled manifest contains the new delegation description and preserves `openai/gpt-5.6-luna` with low reasoning.
- `bun run lint`: **failed on unrelated existing/generated `site/` findings** (15 errors and 2,888 warnings); no finding named the Steve Stoute package. A representative error is `site/hooks/use-mobile.ts:16:5 react-hooks/set-state-in-effect`.
- `bun run typecheck`: **failed on unrelated `site/` imports and duplicate React type trees**, including `Cannot find module '@/components/ui/button'` in `site/app/board-app.tsx` and incompatible `Ref` types from `site/node_modules/@types/react`.
- `bun run build`: **failed at the same unrelated site typecheck errors**.
- No repository formatter script exists; the edited TypeScript follows the repository's existing ESLint formatting and passed targeted lint. Markdown was reviewed manually.

This document does **not** claim a live model comparison, deployed meeting, or browser-visible persona run.
