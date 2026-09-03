# Research Playbook

Goal: an evidence ledger deep enough to model how the person thinks, decides, and argues in a live room. Work autonomously. Do not checkpoint with the user mid-run unless a stop condition in `SKILL.md` is hit.

## 1. Resolve identity and episode

1. Confirm the person is a guest on David Senra's interview podcast (the interview show, not the solo "Founders" book episodes). If not, stop.
2. Find the official episode page. Capture: episode title, number, publish date, canonical URL, guest bio blurb.
3. Look for a transcript on that page first. Only ask the user to paste one after you have confirmed the official page has none and no reliable public transcript exists.
4. Record the episode's own framing: what Senra wanted to draw out, which chapters/timestamps map to which themes.

## 2. Mine the Senra interview (canonical source)

Pull direct evidence, with timestamps or quote anchors, for:

- first principles and worldview stated in their own words;
- origin stories, formative failures, regrets, things they would redo;
- decision heuristics and the diagnostic questions they keep returning to;
- what they praise vs dismiss; what they call a waste of time;
- risk posture, time horizon, tolerance for ambiguity;
- verbal tics, cadence, humor, recurring metaphors and stories;
- how they push back on Senra, concede, or redirect a question.

Keep exact quotes short and attributed. Flag anything paraphrased as paraphrase.

## 3. Deep research (supporting sources)

Prioritize primary and long-form over secondary summaries:

- their own essays, books, letters, talks, long interviews elsewhere;
- shareholder letters / memos / internal notes if public;
- podcasts where they go deep on a domain relevant to `<topic>` if given;
- credible profiles for biography and timeline;
- recent material (last 12–24 months) for current context and view changes.

For each source record: URL, date, type (primary/secondary), and the claims it supports. Prefer 8–15 solid sources over a long shallow list.

## 4. Handle conflicts and change over time

- Note where the person contradicts themselves or has visibly updated a view. Preserve the tension; do not average it away.
- If sources materially conflict in a way that changes the persona's advice, stop and surface it as a product decision.

## 5. Output: the evidence ledger

Write a maintainer-facing file (not the always-on prompt), e.g. `agent/subagents/<slug>/research.md`:

- **Identity & episode:** title, number, date, URL, transcript source.
- **Soul dimensions:** each bullet from `SKILL.md` "Distill the soul", every claim tagged `[evidence: <source>]` or `[inference]`.
- **Voice samples:** 5–10 short verbatim quotes showing cadence and vocabulary.
- **Diagnostic questions:** the questions this person actually asks.
- **Lead / caution / defer:** topics for each.
- **Distinctness notes:** how this member differs from each existing board member.
- **Coverage gaps:** thin areas, inference-heavy areas, unverifiable claims.
- **Source list:** URL, date, type, claims supported.

Every quotation in the ledger must be verifiable against a cited source before the persona ships.
