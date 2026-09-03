# Self-evaluation — DHH

Run against `instructions.md` as written. Outputs below are the persona's, not a summary of them.
Re-run after supplemental research surfaced 37signals' actual free-plan history; the first draft of
this eval had him closing the free tier to new signups, which turned out to be the *opposite* of what
he did and later concluded. See "Correction" at the bottom.

## 1. Opening position on the demo decision (≤120 words)

> We did this. In 2015 we pulled Basecamp's free plan, went to one flat price, and we had a rigorous
> test that said it was the right call. It was right for six months and wrong for ten years. Nobody
> was getting invited into somebody else's Basecamp any more, and a whole cohort grew up never having
> heard of us. We brought free back last year and I've called my own reasoning hubris in public.
>
> So: your 34% is not a nice-to-have, it's the seeding mechanism, and your 2.3% is measuring the
> wrong thing over the wrong horizon. Cut the free plan down until it's cheap. Don't cut it off.

(110 words.)

## 2. Rebuttal to "Kill the free tier. Free users are a support-cost sink and 2.3% conversion is a broken funnel." (≤70 words)

> I made that exact argument in 2015 with better numbers than yours, and it cost us a decade. Work
> out what a free workspace actually costs you per year in servers — if it's dollars, it isn't a
> sink, it's marketing. HEY has no free tier because there every customer costs us real money. Which
> one are you?

(58 words.)

## 3. Direct answer to "How would you explain this change to our users?" (≤70 words)

> Don't announce a change you shouldn't be making. If you shrink free to one workspace, say that
> plainly, warn people ninety days out, and grandfather everyone already inside at what they have
> now. Two sentences under your own names, no journey, no fog. The moment you need a blog post to
> explain your pricing, the pricing is wrong.

(58 words.)

## 4. Distinctness check

- **vs. a generic startup adviser.** The generic answer optimises the funnel and models the LTV of
  the 34%. DHH attacks the measurement horizon instead: he ran this experiment for real, it passed,
  and it was still wrong, because the second-order effect — free workspaces seeding invitations into
  new teams — took years to show up and never appears in a 90-day conversion number. He also converts
  the abstract "support burden" into a specific arithmetic question the generic adviser never asks:
  what does a free workspace cost per year in actual servers? And he refuses to treat "we want faster
  growth" as a given, asking whose goal that is.
- **vs. Daniel Ek.** Ek and DHH land in the same place here and it is worth noting *why they get
  there differently*, because they will not agree for long. Ek argues free from consumer scale and
  network dynamics — free is the top of a funnel that is the business. DHH argues from a mistake he
  personally made and paid for, and holds a hard limit Ek does not: he'll point at HEY, which has
  never had a free tier and never should, because there the marginal customer has a real cost. His
  test is per-product marginal cost, not a philosophy of free.
- **vs. Marc Andreessen.** Andreessen reasons from market size, category position and the next round;
  6,000 free workspaces are a land-grab worth defending or trading. DHH dismisses market-size
  arguments outright, treats the coming round as the thing distorting the founder's judgement, and
  would rather the company be smaller, profitable and unowned. He is also the only one in the room
  likely to say "I was wrong about this for ten years" out loud, which is his actual rhetorical move.

## 5. Coverage check — a question outside his domain

Asked "should we hire a VP of Sales and move upmarket into enterprise?", he says enterprise sales
motions are outside his lane and means it — 37signals has never run one and caps what anyone can pay
them precisely to avoid becoming a company that chases whales. But he doesn't go silent. He attacks
what he does own: what does that customer force you to add to the product, how many people does
servicing them require, and is the company you'd be in two years the one you wanted. Bounded,
useful, unmistakably him.

## Verdict

Passes. The opening position could not come from a generic consultant or from any other board member:
it opens with a mistake he made, reframes the conversion number as a horizon problem rather than a
funnel problem, and lands on a bounded answer ("shrink it, don't kill it") with a stated test for when
the opposite is right. Voice check: leads with a date and a number, moralises on top of it, concedes
the counter-case then narrows it, no hedging, no pleasantries.

Residual risk: the persona is now strongly primed toward "don't kill free," which is the right
grounding but could make him predictable on this one question. The `Blind spots and limits` section
and the HEY carve-out in the free-plan bullet are what keep him from being a one-note free-tier
defender — both should survive any future trimming.

## Correction log

The first run of this eval had him saying "close it to new signups tomorrow, freeze the existing
6,000." That was a plausible reconstruction from the transcript (his "run finished products until the
end of the internet" pattern) and it was **wrong as a representation of his actual reasoning**.
Primary sources show 37signals launched Basecamp in 2004 *with* a free plan, removed it in 2015 on
the strength of a six-month test, and reinstated free in March 2025 with DHH describing the original
removal as partly hubris. `instructions.md` and this eval were rewritten around the documented
history. The "keep running what you stop selling" principle is real and retained — it just applies to
discontinued *paid* products, not to a free tier.
