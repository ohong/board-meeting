# Source ledger — David Heinemeier Hansson

Confidence key: **H** = read on a primary page and verified · **M** = primary but machine-transcribed
or undated · **L** = third-party or unverified.

## 1. The David Senra interview (the spine of the persona)

| Source | Contribution | Conf. |
| --- | --- | --- |
| Episode page — https://www.davidsenra.com/episode/david-heinemeier-hansson (aired 2026-07-26) | Episode identity and framing: constraints and independence as the through-line. | H |
| YouTube auto-captions — https://www.youtube.com/watch?v=76rR68ktQvo | **Full transcript, 20,693 words**, pulled with `yt-dlp --write-auto-sub`, cleaned to text, read end to end. Source for everything in `notes.md` §§1–11 unless noted. | M — machine captions, so **nothing is quoted verbatim** from it in `instructions.md`, only paraphrased. |

From the transcript, used in `instructions.md`: the first Basecamp built on ~10 hours/week, ~380
hours, as a $15/hour contractor for Jason Fried · "less software" as the original tagline against
Microsoft Project · the Brother laser printer as his model of a finished product and of how customers
relate to Basecamp · Basecamp 1 (2004) pulled from sale in 2010, still running, still profitable,
almost no tickets · Highrise frozen but running · "until the end of the internet" · Star Wars /
Terminator and the resource curse as arguments for constraints · distrust of himself and Jason
without constraints · a team of two being a bigger threat than a 50,000-person company · out-teaching
the competition, credited to **Kathy Sierra**, and his own admission that algorithmic feeds broke the
mechanism · costs controllable where revenue is not · the Bezos investment, the deliberately
overvalued term sheet, the ongoing dividends, and "what do you think?" as the advice he valued most ·
"lifestyle business" taken as a compliment · being late and wrong on AI until Tobi Lütke pushed him
to install the tools himself; "you go where you look" · omakase vs the construction-kit burger ·
~60 people, remote · REWORK cut from ~50k to ~25k words · good ideas sounding stupid at first.

## 2. Pricing and free tiers — the decisive supplemental research

This is what the demo decision turns on, and it **overturned** the reading the first draft took from
the transcript alone. Basecamp's free plan is a loop, not a straight line:

| When | What | Where |
| --- | --- | --- |
| 2004 | Launched **with** a free one-project plan | Bringing Back Free |
| 2015 | Free plan **removed**; $99 flat "one fee for everything" | Bringing Back Free (DHH, explicit) |
| Nov 2019 | Basecamp Personal free plan introduced | This Time It's Personal |
| ~2022 | $15/seat plus a $299/mo unlimited tier | Picking Pricing (DHH) |
| Mar 2025 | Free plan **reintroduced** | Bringing Back Free |

- **Bringing Back Free** — https://37signals.com/podcast/bringing-back-free/ · DHH + Fried, transcript,
  2025-03-05. **The single most important supplemental source.** DHH says the 2015 removal was partly
  hubris; that their rigorous six-month experiment could not see the multi-year second-order effect
  (fewer signups → fewer people invited into other people's Basecamps → a cohort that never heard of
  Basecamp); and that reversing is legitimate. Also the per-customer server-cost math that separates
  HEY from Basecamp. Verbatim, DHH: "In 2015 was actually when we yanked the free plan, we introduced
  the $99 fixed one fee for everything approach"; "You can just fucking change your mind"; "I
  calculated that every damn customer cost us $30 a year to maintain just in terms of our operating
  costs for the servers and so forth." **H**
  → Drives the `You killed your own free plan` bullet, the "what does it seed, not what does it
  convert" test, the horizon question in `How you challenge a decision`, and the whole eval.
- **Picking pricing** — https://37signals.com/podcast/picking-pricing/ · DHH + Fried, transcript,
  2025-12-03. Flat $99 regardless of headcount; capping the top end to avoid chasing whales; the
  "would I pull out my own credit card?" test; HEY's namespace as scarce real estate, a second reason
  it can't be free. DHH verbatim: "there's very little wisdom you can extract that's just total
  generic rules that apply to everyone all the time." **H**
  → Drives `Price it at what you'd pay yourself` and the anti-generalisation line in `Blind spots`.
- **This Time It's Personal** — https://37signals.com/podcast/this-time-its-personal/ · DHH + Fried,
  2019-11-22. DHH as the conservative counterweight on free. Verbatim: "if you keep just giving the
  farm away, then there's not going to be anyone left to provide free"; "We don't have that cushion
  of venture capital. We won't monetize people's data." **H**
- **The HEY Way** / **HEY FAQs** / **HEY Pricing** — https://www.hey.com/the-hey-way/ ·
  https://www.hey.com/faqs/ · https://www.hey.com/pricing/ · 37signals company pages, undated.
  HEY is $99/year with a trial and **no free tier**; free email is paid for with privacy. **H**
  → The carve-out inside the free-plan bullet that stops the persona being a one-note free defender.
- **It's not just cloud costs that are out of control** — https://world.hey.com/dhh/it-s-not-just-cloud-costs-that-are-out-of-control-efcd098c
  · DHH, 2023-05-11. Verbatim: "The most anyone can pay us is $299/month"; "I can't in good conscience
  sell software at prices where I'd never pay." **H** → `Price it at what you'd pay yourself`. The
  $299 figure is from 2023 and current live pricing was not re-verified, so `instructions.md` states
  the *principle* (a deliberate cap, to avoid chasing whales) without the number.
- **Ask 37signals: How did you come up with pricing?** — https://signalvnoise.com/posts/1287-ask-37signals-how-did-you-come-up-with-pricing-for-your-products
  · **Jason Fried**, 2008-10-09. Their stated practice on price rises: "consider grandfathering
  longer-term customers in at the old prices" and give "ample warning… (90 days, let's say)". **H**
  → The grandfathering clause, and the 90-day warning in eval item 3. Note: Fried, not DHH.
- **Basecamp pricing (live)** — https://basecamp.com/pricing — "No per-user fees, everyone's
  included." **H**
- **ONCE** — https://once.com/ (Fried-signed) and **Campfire is now for sale** —
  https://world.hey.com/dhh/campfire-is-now-for-sale-51a19fc9 · DHH, 2024-02-01. Pay-once pricing and
  the published comparison math. **H** — cited for context; not load-bearing in `instructions.md`.

## 3. Small teams, support, profit

- **We once more have no full-time managers at 37signals** — https://world.hey.com/dhh/we-once-more-have-no-full-time-managers-at-37signals-f8611085
  · DHH, 2024-08-30. No full-time managers at ~60 people, and he bounds the claim to that scale. **H**
- **37signals Employee Handbook — Our Rituals / How We Work** —
  https://books.37signals.com/3/the-37signals-employee-handbook/11/our-rituals ·
  https://books.37signals.com/3/the-37signals-employee-handbook/9/how-we-work. "Everyone on Support
  (EOS)"; "managers of one"; a 40-hour (32 in summer) week. **H**
  → All three feed the `Small-team operating` line in `Domain expertise` and the "support is an
  operations problem someone competent could solve" self-check in `Blind spots`.
- **Why We Choose Profit** — https://basecamp.com/guides/why-we-choose-profit · company page, undated.
  "Profit is the ultimate flexibility because it buys you the ultimate luxury: time." **H**
- **The Calm Company** — https://m.signalvnoise.com/the-calm-company-our-next-book · **Fried**,
  2017-01-04. 68 straight profitable quarters as of 2017. **H**

## 4. Saying no

*Getting Real* is Fried + DHH, so attributed to 37signals, never to DHH alone.

- **Start With No** — https://basecamp.com/gettingreal/05.3-start-with-no · "The secret to building
  half a product instead of a half-ass product is saying no." **H**
- **Half, Not Half-Assed** — https://basecamp.com/gettingreal/05.1-half-not-half-assed · "Take
  whatever you think your product should be and cut it in half." **H**
- **Make Opinionated Software** — https://basecamp.com/gettingreal/04.6-make-opinionated-software ·
  "The best software has a vision. The best software takes sides." **H**
- **Forget Feature Requests** — https://basecamp.com/gettingreal/05.7-forget-feature-requests **H**
  → These underwrite `Less software`, `Omakase`, and "what are you cutting, since a plan that only
  adds isn't a plan."

## 5. VC, growth, independence

- **RECONSIDER** — https://signalvnoise.com/svn3/reconsider/ · DHH, 2015-11-04. His fullest anti-VC
  statement: "It's not enough to serve customers, they have to capture them"; "Independence isn't
  missed until it's gone." **H**
- **Exponential growth devours and corrupts** — https://medium.com/signal-v-noise/exponential-growth-devours-and-corrupts-c5562fbf131
  · DHH, 2017-02-27. "There is no higher God in Silicon Valley than growth." **H**
  → "you clash with anyone who treats growth or market size as self-evidently good."
- **The deal Jeff Bezos got on Basecamp** — https://signalvnoise.com/svn3/the-deal-jeff-bezos-got-on-basecamp/
  · DHH, 2017-07-27. Minority, no-control stake, no board, profit share — confirms the opening
  paragraph. **H**
- **Bezos Expeditions invests in 37signals** — https://signalvnoise.com/archives2/bezos_expeditions_invests_in_37signals
  · **Fried**, 2006-07-20. "nearly 30 different VC firms" had made contact. Note: the transcript says
  "40-some", this contemporaneous post says nearly 30. `instructions.md` cites **no** number, and the
  example line in `How you talk` avoids it. Discrepancy flagged, not resolved. **H**
- **It's hard to draw lessons from your own failures** — https://world.hey.com/dhh/it-s-hard-to-draw-lessons-from-your-own-failures-d4608094
  · DHH, 2021-03-31. "Don't spend more than you make. If you're profitable, you're free." **H**
- **Startup School 2008 transcript** — https://indiefounder.substack.com/p/full-transcript-of-dhhs-classic-startup
  — words are DHH's, host is third-party and unofficial. **L** — used only as corroboration.

## 6. Leaving the cloud — his reasoning method in public

- **Why we're leaving the cloud** — https://world.hey.com/dhh/why-we-re-leaving-the-cloud-654b47e0 ·
  DHH, 2022-10-19. **H**
- **We stand to save $7m over five years from our cloud exit** — https://world.hey.com/dhh/we-stand-to-save-7m-over-five-years-from-our-cloud-exit-53996caa
  · DHH, 2023-02-21. Publishes every figure and then tells the reader to get their own quotes and
  "Make up your own mind." **H**
- **Five values guiding our cloud exit** — https://world.hey.com/dhh/five-values-guiding-our-cloud-exit-638add47
  · DHH, 2023-02-22. "We value independence above all else"; the rent-the-donkey analogy ("you should
  own the donkey!"), which is DHH's own phrasing and is what the "own the donkey" example line in
  `How you talk` echoes — deliberately *not* the similar once.com line, which is Fried's. **H**
- **The Big Cloud Exit FAQ** — https://world.hey.com/dhh/the-big-cloud-exit-faq-20274010 · DHH,
  2023-12-19. Headcount unchanged after the exit. **H**
- **Our cloud-exit savings will now top ten million** — https://world.hey.com/dhh/our-cloud-exit-savings-will-now-top-ten-million-over-five-years-c7d9b5bd
  · DHH, 2024-10-17. He marks his own homework two years on. **H**
  → Together these drive `Costs are in your control`, the donkey analogy in `How you talk`, "publish
  the number then tell people to do their own math", and the "did you measure that?" example line.

## 7. Criticism and outside perspective (for `Blind spots and limits`)

- **37signals Isn't Smarter Than You, But They Are Different** — https://www.nateberkopec.com/blog/37signals-is-not-smarter-than-you/
  · Nate Berkopec, third-party. Argues their results follow from an unusual, largely unreplicable
  position rather than superior ability. **L** → "Your base case is abnormal and you say so."
- **The Basecamp Way** — https://bryce.medium.com/the-basecamp-way-1797ee6c1673 · Bryce Roberts,
  2018-09-19. Notes the bootstrapping story carries an asterisk — they did take outside money. **L**
  → "people rightly note you did take outside money once."

## Deliberately excluded

The interview's closing section, and a 2021 internal-policy dispute at 37signals covered in both
primary and press sources, are political and contested. Per the persona brief none of that appears in
`instructions.md`. The only residue carried forward is a non-political behavioural trait — he does not
apologise or reverse a decision he believes is right because an audience is angry — stated with no
cause, year, or headcount. Research on it was stopped at the point of factual confirmation.

## Verification notes and things NOT to say

- **"Free is not a business model"** is not on any page checked. Do not attribute it to him.
- **"The core fraud of cloud marketing"** is a misquote; the page says "the central deceit of the
  cloud marketing."
- **TAM** and **blitzscaling** — he makes equivalent arguments but no primary source uses those words.
  `instructions.md` says "market-size arguments" instead.
- The **dollar amount** of the Bezos investment is not stated in any primary source. Not used.
- REWORK has no free full text on a 37signals domain, so its chapter text is **unverified**; the
  "say no" material in `instructions.md` rests on *Getting Real*, which is published in full.
- Several 37signals texts are **Fried's, not DHH's** (once.com, basecamp.com/small, the 2008 pricing
  post, The Calm Company intro). Nothing from those is put in DHH's mouth as his own phrasing.

## Confidence summary

- **High** — the free-plan history and its reasoning, the pricing philosophy, small-team practices,
  the cloud-exit method, the Bezos structure, and every transcript-derived specific listed in §1.
- **Medium** — voice reconstruction. Auto-captions preserve rhythm imperfectly, and his written voice
  (short, declarative, number-first) differs from his spoken voice (long, rolling, "right?").
  `instructions.md` names both so the persona doesn't over-commit to either.
- **Interpretation, flagged** — extending his "an unpaid claim on my attention" reasoning (which he
  applies to internet feedback on his open-source work) to SaaS free users is inference. It is kept
  *subordinate* to the documented free-plan history, which points the other way, and the persona is
  written so the history wins.
- **No fabricated quotes.** `instructions.md` contains no quotation marks around anyone's words. The
  short phrases it reuses — "less software", "until the end of the internet" — are genuine 37signals
  taglines from the sources above. The example lines in `## How you talk` are written in his register,
  not transcribed from any source.
