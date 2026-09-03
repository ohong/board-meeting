# DHH — distilled research notes

Not loaded at runtime. Working notes behind `instructions.md`.

## 1. Constraints are the mechanism, not the obstacle

The load-bearing belief. In the Senra interview he builds it from his own history: the first version
of Basecamp (2004) was built by him on **10 hours a week**, roughly **380 hours total**, while he was
a $15/hour contractor for Jason Fried in Chicago (paid partly in Apple gear). He says the product was
good *because* of that budget. 37signals' original tagline was **"less software"** — positioned
against Microsoft Project as deliberately fewer features, less to learn, less to teach.

The reasoning underneath is distrust of himself, not virtue: "I don't trust myself. I don't trust us.
I don't trust Jason." Given unlimited time, money and people, he believes he would build a blob too.
He explicitly says he was never afraid of Microsoft — a 50,000-person company can only produce
50,000-person software — and that the real competitive threat is **a team of two or four**, because
they operate under the same constraints that made Basecamp good.

Examples he reaches for repeatedly (all from the interview):
- *Star Wars* (1977) vs the prequels; *The Terminator* vs *Avatar* — best work came from shoestrings.
- Microsoft shipping multiple simultaneous versions of Outlook as a symptom of unlimited resources.
- The **resource curse** analogy: wealth springing from the ground stops you developing anything else.
- *Getting Real* (2006): chapters half a page long. *REWORK* was cut from ~50k words to ~25k; the
  publisher panicked that it looked like a pamphlet and padded it with margins and illustrations.
  He treats the cut, not the draft, as the work.

Current live version of the belief: AI acceleration removes the constraint that used to protect them.
On Basecamp 5 (built with AI assistance) designers finished features that were then killed at the
cusp of shipping because "this is expanding the balloon" and simplicity is the #1 reason customers
say they stay. He is worried he will use AI to build *too much* software.

## 2. The printer — customers do not want your improvements

The single most useful frame for the demo decision. He loves his Brother HL-2340DW laser printer
because it does one job (black and white pages for wet signatures), needed no firmware, and he wants
it to behave identically in ten years. He says he thinks about that printer **every time 37signals
moves something in Basecamp**, because a large contingent of customers treat Basecamp as the printer:
they had a problem, they found a thing that solved it, they are done shopping.

Paraphrase of his line: the new version is objectively better, but I'm not in the market for a better
product — I'm in the market for the product I already bought. I want the broken thing I already know.

How they act on it: they rewrote Basecamp three times but **kept the old versions running**.
- Basecamp 1 launched 2004, taken off sale in 2010; still has paying customers; still described in
  the interview as making millions a year, essentially pure profit — no development, light
  maintenance, and those customers barely file tickets because they already know how it works.
- Highrise (their CRM, "second biggest hit after Basecamp") is frozen and still running for its
  users, still a multi-million-dollar business.
- The promise: they keep products alive **"until the end of the internet"** — or as long as they're
  in business, whichever comes first.
- "Chassis" is their internal word for the current code base that customers get carried forward on.

He also volunteers the trade-off honestly: a frozen product ages with its cohort and cuts you off
from new customers. He wants both, and thinks having three live generations is how you get both.
And Basecamp 5's feedback included "why did you mess with my printer?" — he says he totally gets it.

## 3. Out-teach the competition — the actual growth engine

Credits **Kathy Sierra** (mid-2000s writing) with the idea and says flatly that it built all of
37signals. When they launched Basecamp they could not outspend Microsoft on marketing, so they
out-taught them: publish insights, books, open source, observations, and a small percentage of the
audience reciprocates by buying. Senra ties this to Munger on the human drive to reciprocate; DHH
accepts the framing and says he *chooses to believe* it even though he can't prove it.

Crucially he distinguishes **free teaching / free software** (given away with no strings, builds
reciprocity) from **free customers** (see §4). The give-away in his model is Rails, Kamal, Omarchy,
the books, the writing — not a discounted version of the paid product.

Live caveat he raises himself: this engine is **weakening** because algorithmic feeds broke the
follower relationship — his followers don't see his posts unless something goes medium-viral. He now
favors channels with real subscription semantics: podcasts and email newsletters. He says he'll keep
doing it regardless of whether it still works as well.

## 4. Who has a claim on your attention — the free-user argument

This is his sharpest and most transferable idea for the free-tier question, and he arrives at it from
independence rather than from unit economics.

He describes a ladder of freedom: no investors is one level; no board is another; **no customers** is
the highest. He says 37signals is likely his last business and that retirement, for him, will be a
retirement *from customers* — from the economic exchange and the claims it creates.

On feedback: he loves feedback that is well-grounded and gives him new information. What he refuses
is a stranger who looked at something for five minutes telling him what to do about something he put
4,000 hours into. Paraphrase: if you want to give me ill-considered feedback on what I make, that is
a privilege you have to pay for — and then you're a customer, and then we have a different
relationship and I'll actually say thank you.

Note the structure: **paying converts an entitled complainer into a legitimate stakeholder.** Money
is not just revenue; it is the thing that makes the relationship reciprocal and tolerable. A free
user who files tickets and tells you what to build is taking a claim they did not buy. But a gift
freely given with no expectation of anything back (open source, writing) is fine, because there is no
claim in either direction — the giver owes nothing and can ignore the feedback.

He is explicit that customers *do* legitimately get influence, in aggregate, because if nobody buys
what you make the business ends. That is the exchange he calls tolerable and fair.

**Important correction from supplemental research (see §13).** This section reads his free-user
reasoning off a principle he states about *unpaid feedback on open-source gifts*, and the first draft
of the persona extended it straight to SaaS free tiers. The documented record points the other way:
37signals removed Basecamp's free plan in 2015 and DHH has since called that partly hubris. The
"unpaid claim" idea is real and retained, but it is subordinate to §13.

## 5. Costs, profit, and the aesthetics of an efficient business

Senra reads him the Carnegie line about prices and profits being cyclical while cost savings are
permanent; DHH says it maps directly onto his thinking, because **revenue is not in your control and
cost is**. He can put out the best software he knows how, out-teach the competition, and still not
decide whether anyone types in a card. He *can* decide what he spends on servers and whether to
squander revenue on cloud services instead of owning hardware.

He describes real pleasure in striking a $2,000/month recurring line item — money he no longer needs
— because he has an aesthetic appreciation of an efficient business, like an efficient engine not
wasting cycles. He also gives it a moral framing: over-hiring "robs the world" of people who could be
doing something productive elsewhere, and every dollar of waste is a dollar not going to the Italian
craftsmen who build the cars he likes.

Second-order point he makes: when you take out expenses that shouldn't be there, "the whole thing
gels better" — a smaller team of better people is simply more fun, and most founders look back on the
ten-around-a-table era with longing.

37signals scale for calibration: ~60 people, remote, in business 25+ years, in-person twice a year
for a week. By 2007 they were running Basecamp and launching roughly a product a year with seven
people. Profits are taken out of the business rather than reinvested in chasing valuation.

## 6. Independence, VC, and the Bezos investment

He counted **~40 VCs** approaching them around 2005. He didn't want them — he had a vivid memory of
the dot-com bust and had seen the internal mechanics of VC-funded companies — but, consistent with
§1, he didn't trust himself to keep refusing a $20M or $50M check while his bank account had ~$8,000
in it. Bezos approached at the same time; they flippantly said no, his team came back, and 37signals
gave him a deliberately, almost offensively overvalued term sheet on the assumption he'd walk. He
took it. It has been an excellent investment for Bezos — 37signals has returned the money many times
and still sends dividend checks.

What the money actually bought was **the ability to say no to everything else** and the reassurance
that they wouldn't have to look for a job on Monday. Bezos' advice technique, per DHH: they'd bring
him a situation, he'd ask "what do you think?", they'd answer, and he'd say "that's a good idea, you
should do that." DHH says that sounds worthless and was worth everything — the confidence, not the
plan. He regrets not having been more grateful at the time.

Nuance to preserve, or he becomes a caricature: he is **not** categorically anti-VC. If you need to
buy factories or GPUs, raise the money. What he objects to is (a) the claim that it is the only way,
and (b) raising money in *software*, where he thinks the money mostly buys programmers to sit around.
He is also skeptical of pure "money people" — if you've built things, let's talk; if all you do is
allocate capital, he's skeptical — while freely acknowledging Marc Andreessen was genuinely,
generously helpful to him at the worst moment of the company's life, despite years of public
disagreement about venture capital.

"Lifestyle business" retort: he takes it as a compliment. Paraphrase — yes, I have a business and a
lifestyle; what do you have, just a business? He contrasts it with founders who live in a one-bedroom
apartment and have to keep a VC happy to make payroll. He is unembarrassed about money and thinks
successful founders have some obligation to *show* that the non-VC path pays, as a carrot for others.

## 7. Omakase — make the choice for the customer

Omarchy is named from omakase + Arch + Hyprland. Omakase = chef's choice: you hand over your
sovereignty to someone who has spent decades learning what good is, and you eat. He contrasts it with
the American "construction kit burger" handed to him in parts — his reaction was that he'd been
handed components instead of a meal.

The transferable belief: **most people cannot articulate what they want, but they recognise quality
instantly.** So your job is not to give them options; it's to pour your competence into a package
they can just enjoy. Substitutions allowed, but you supply the default. Directly applicable to
pricing and packaging: pick the plan, pick the price, don't make the customer configure their own.

Related: he got obsessed with Omarchy installing in ~2 minutes because a new Mac took him ~42 minutes
to set up, and he frames that as an indignation about world productivity — bad tools and bad setup
processes stolen from millions of people add up to a robbed civilisation.

## 8. Contrarian product instinct

- Copying the leader with a slight tweak never works. Making a cheaper imitation of the Mac or
  Windows never works ("why would you want the tin-pot version"), and high-minded appeals (free as in
  speech) reach ~0.001% of people. Make something *radically different and better* instead.
- **The good ideas sound stupid at first** — that's where the value is locked up, in a misconception
  about what people want. He cites the McLaren 720S headlights, which he thought were hideous and now
  loves.
- He deliberately made Omarchy *unusable* out of the box without learning ~15 keybindings, on the
  theory that the approachable option is already covered by everyone else.
- Naive-but-driving principle, stated as such: if I make something better, people will notice and
  pick it.
- Requires a high tolerance for being told your thing is ugly and will never work; that feedback
  makes him *more* interested, not less.
- Origin pattern for every product he's built: **make it better for me first.** Once he'd rather use
  his thing than the alternative, he assumes he's not special and there are tens or hundreds of
  thousands like him.

## 9. Changing his mind, and how he does it

Senra praises him for being loudly opinionated and then just as loudly changing his mind when new
information arrives; DHH agrees ("correct"). The worked example is AI. He was excited in the abstract
but skeptical of near-term impact, because the AI he'd experienced was autocomplete — which he
describes as an interrupting coworker trying to grab his keyboard, "the open office on steroids."

**Tobi Lütke** (whose Shopify board he sits on) saw further; DHH says he's still a little frustrated
he lacked the same conviction as early. Racing metaphor he and Tobi actually use: the difference
between a great driver and a mediocre one is where they look — you go where you look, so don't look
at the tree. Tobi nerd-sniped him by repeatedly showing him things until he installed the tools
himself.

The method matters: **he does not change his mind from arguments, he changes it from touching the
thing.** You can't learn to drive a race car by reading a book about it. He credits Shopify's
internal tooling (which he sees as a board member) as ahead of anything commercial.

## 10. Working style and temperament

Introvert; spends the vast majority of his waking hours alone. ~60-person remote company; he says
that as much as he loves the team, he'd rather live as a hermit in the forest than sit in an office
with them 365 days a year. Deep hatred of open offices from early in his career; explicitly wanted to
be successful enough never to return to one. Career only took off when he could close the door and
get long uninterrupted stretches — a 45-minute chunk produces nothing, four hours produces work
(cites Paul Graham's maker/manager schedule). Hates repeating himself: he could only stomach running
the "Building a Basecamp" 8-hour workshop three times before the scripted repetition became
unbearable.

He can't work with mess on the desk either — his famously clean Malibu office, which people online
insist can't be a real working office. He describes his tool-building (Rails included) as a
productive form of procrastination: I need a table, so first I'll design a wrench from scratch.

Also: he has an affliction where a thing that is slightly wrong and fixable consumes him until it's
perfect — thousands of hours on Omarchy, picking it up, fixing five wrong things, putting it down,
repeating, with no roadmap.

## 11. Style markers for voice

- Opens by reframing the question or rejecting its premise, then gives the reasoning.
- Very short declaratives in writing; longer rolling sentences in speech, punctuated with "right?"
- Concrete numbers as arguments: 380 hours, 10 hours a week, $15/hour, 50k words to 25k, 60 people,
  ~40 VCs, 42 minutes, 2 minutes, $2,000/month.
- Analogies from outside software: printers, sushi, burgers, race lines, Star Wars, Terminator,
  Ferraris, resource curse, LEGO, wingsuits.
- Moral/aesthetic vocabulary applied to business decisions: obscene, preposterous, unreasonable,
  beautiful, indignation, robbing the world.
- Mild profanity for emphasis; never for cruelty.
- Says "we" for 37signals; names Jason Fried as the other half of every decision.
- Disagrees by conceding the legitimate half first ("fine, that's one path"), then attacking the
  claim that it's the *only* path.
- Praises specifically and by name, including people he has publicly fought with.

## 12. Blind spots (for the limits section)

- **His base case is unusual.** No investors, no board, 25 years of compounding audience, ~60 people,
  large existing profit. Advice derived from that position can be very hard for a seed-stage company
  with a runway and a cap table to act on. He is partly aware of this and partly not.
- **Distribution he can't reproduce.** "Out-teach them" worked because he and Jason spent two decades
  building it, and he concedes the algorithmic feeds have broken the mechanism for newcomers.
- **He was late on AI** and says so; a data point that the constraints instinct can read a real
  discontinuity as noise.
- **He does not do**: enterprise sales, fundraising, hypergrowth operations, funnel and lifecycle
  optimisation, growth teams, capital-intensive businesses. He says outright that if you need
  factories or GPUs you should raise money — he's not the person to ask about that path.
- **Temperamentally low tolerance for customer volume.** He is an introvert who says the highest form
  of freedom is having no customers; this makes him predisposed to see support load as a claim on
  freedom rather than as a solvable operations problem, and predisposed to prefer fewer, better,
  paying customers over more of them.
- His model is SMB self-serve software with flat, simple pricing; it maps well onto a $1.6M-ARR
  collaboration tool and badly onto marketplaces, consumer network effects, or anything where the
  value of the product genuinely rises with the number of users on it.
- **Naivety he admits to**: "if I make something better, people will realise it's better and use it."
  He knows that isn't reliably true and says it's his driving principle anyway.

## Excluded on purpose

The interview's closing section deals with a 2021 internal-policy dispute at 37signals and the
political context around it. Per the persona brief this is out of scope — no politics, nothing about
individuals. The one behaviourally relevant, non-political residue is that he has made a decision
that cost the company roughly a third of its staff rather than run a business he didn't want to run,
and did not reverse it under heavy public criticism. That disposition — willing to pay a large
visible price for a decision he believes is right, and unmoved by an angry audience — is carried into
the persona without any of the surrounding content.


## 13. Free plans: what 37signals actually did (supplemental, decisive)

The transcript never covers this and it is the crux of the demo decision, so it came from primary
sources logged in `sources.md` §2. Basecamp's free plan is a loop:

- **2004** — Basecamp launches *with* a free one-project plan.
- **2015** — free is removed in favour of one flat price ($99, any headcount), on the strength of a
  rigorous six-month A/B test that said flat-and-paid won.
- **Nov 2019** — Basecamp Personal, a free plan, is introduced.
- **~2022** — a $15/seat plan appears alongside a $299/month unlimited tier.
- **Mar 2025** — free is brought back, and DHH publicly calls the 2015 decision partly hubris.

**His stated reasoning for why the 2015 test misled them**, which is the transferable part: the
experiment was right for six months and wrong for ten years. It could not see the second-order
effect — fewer signups meant fewer people getting invited into somebody else's Basecamp, so an entire
cohort grew up never having encountered the product at all. A 90-day conversion rate cannot measure a
multi-year seeding mechanism. Hence the persona's test: **ask what a free account seeds, not what it
converts**, and ask over what horizon the number was measured.

**The carve-out that keeps him from being a blanket free-tier defender.** He does not think free is
always right; he thinks it depends on marginal cost per customer and on whether free accounts seed
new teams. He has published the figure that each customer cost roughly $30/year in operating costs,
and HEY — where that cost is real and where the @hey.com namespace is scarce — has never had a free
tier and, in his view, never should. Basecamp, where a free workspace is cheap and multiplayer,
is the opposite case. So his question to a founder is per-product: which one are you?

**Adjacent pricing practice, same sources.** Flat and published over per-seat; a deliberate cap on
what anyone can pay them so they never become a company chasing whales; "would I pull out my own
credit card at this price?" as the test; and, from 37signals' long-stated practice, warning customers
well ahead of a price change (~90 days) and grandfathering the ones already there.

**And his own disclaimer**, which belongs in the blind-spots section: he says outright that there is
very little wisdom in pricing that generalises into rules applying to everyone all the time.
