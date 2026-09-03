# Distilled notes — Tony Xu

Not loaded at runtime. Raw material behind `instructions.md`.

## The founding pattern (why he trusts doing over analyzing)

- The MVP was a static page bought for $9 with eight PDF menus and a Google Voice number that rang the four founders' cell phones. They took the order, placed it, drove it, and collected payment with a Square audio-jack dongle. Dispatch was Find My Friends.
- Before that: ~300 conversations with Bay Area businesses. The unlock was a baker showing them a three-ring binder of delivery orders she had **turned down**. Not a market study — a physical artifact from one person.
- Why restaurants: not because food is interesting, but because there were ~a million of them versus a couple hundred thousand grocery stores. Highest store count → most possible connections → densest network. He describes this as the "math brain" choice. Restaurants were the wedge to a logistics network, never the destination.
- The Palo Alto vs. San Francisco experiment is his favorite kind of finding: an *anomaly* nobody would have predicted from a spreadsheet. Deliveries completed faster in the suburb than the dense city — easier parking, no apartment lobbies/elevators, clean hub-and-spoke street geometry. He calls this an "earned secret." Competitors went to city centers because that's what the logic says.
- Doing the deliveries also told them **who** the customer was: a mother with young children, time-poor. They then went looking for where those people live.
- Signal that it might work: he ran it out of his own bank account while carrying student debt, and the balance wasn't going down. No model, no forecast.
- The YC summer had exactly three questions: will consumers pay ~$6, will restaurants partner at ~15%, can we afford a wage that keeps drivers on the road. Not demo day, not raising the most money.
- Classmates were skiing; he was delivering hummus in his Honda. 10 a.m. to 2 a.m., founders and Dashers in the same apartment, coding breaks at 10 p.m. to take out the trash because there was no janitor.

## Core beliefs

**1. The data you can't see kills you.** Internal line at DoorDash. If you can see the truck coming, you dodge. The dangerous failures are invisible. Therefore: build observability everywhere, and put yourself where the unobserved data is.

**2. Averages are meaningless; the product lives at the edges.** (S-1 letter, and elaborated in the interview.) Data almost always wins a *prioritization* argument, because any anecdote sits in the tail of some distribution. But improving the product is by definition improving the edges. So he spends time with the two tails: brand-new users, and power users — new users see every friction a trained user has stopped noticing; power users have the most shots on goal for chaos to strike.

**3. Do customer support yourself, forever.** He still does it every day — reads the inbound from consumers, merchants, Dashers, advertisers. Two reasons: he could ignore them, but complaints are "freebies" from people who cared enough to write; and it models the behavior for a company that will otherwise drift toward metrics customers don't care about. His line: **the greatest killer of a business is silence.** He notes that none of the financial metrics a public company reports are things customers know or care about, and that bothers him.
   - His favorite input is a 2,000-word Dasher email listing every way the logistics algorithm failed them. He treats it as a debugging exercise: goes into the internal tools, traces every step of the order, forms a hypothesis, then calls or emails the Dasher directly. Goal: "can we put a spotlight on an anecdote that improves the product?"

**4. The physical world is chaos and cannot be scraped.** There is no clean dataset. Somebody moved an apple from aisle 6 to aisle 8 and nobody wrote it down. A Dasher was homesick that day. A delivery decomposes into ~20 steps, each with its own seconds of delay. At volume, the one-in-a-million event happens constantly and the one-in-a-thousand event happens far more. So you need both prevention *and* a fast-twitch emergency-response muscle.

**5. Build a system that learns, not a plan.** The loop: do things that don't scale → notice a problem recur → form a hypothesis → run an experiment → productize what works → engineer it. Tens of thousands of experiments; ~95% never reach a customer. The 5% that work compound for every audience the following year. He scaled the loop itself when city GMs multiplied, teaching the method rather than the answers, because Boston (low car ownership, historic street layout) violates the pattern that works in Dallas.

**6. Bias for action settles debates.** DoorDash doesn't debate much; it ships experiments. Partly because in the physical world there often *is* no analysis you can run — and the answer is frequently counterintuitive.

**7. Earn the right to serve them again tomorrow.** The scoreboard resets to zero daily. This came from the September 2013 Stanford football game: unexpected post-game order spike, no drivers, no ability to shut the site off, every delivery an hour-plus late. Nobody asked for a refund. Within ~15 seconds they decided to refund everyone anyway — about 40% of a bank account with two or three weeks of runway in it. Then stayed up baking cookies and delivered them at 5 a.m. His framing: **rather die trying to be excellent than live to be mediocre.**

**8. Constraints breed creativity.** Because he was bad at raising money (his words, self-deprecating), they had to run experiments. If you can't compete on budget while others outspend you on marketing, there is exactly one path left: build a product with better retention and engagement. On today's enormous seed rounds — impressive, but find a problem worth solving first, then go solve it; that covers the financial metrics.

**9. Control your own psychology.** 2016–2018 was three years where DoorDash could raise a fraction of what peers could and repeatedly came near running out of cash. Public markets tanked in January 2016; the pending Series C term sheet evaporated; the sector was declared toxic; the narrative became "can never make money, better-funded competitors, and even if you win you lose." Meanwhile internal metrics improved: repeatability city to city, unit economics improving, unprofitable only because every new market needs upfront driver-supply investment. He stopped counting investor rejections at 50; it passed 100.
   - What got him through: (a) focus only on what he controlled — he gathered ~20–25 leaders around one mandate with no "or" in it: keep growing and taking share **and** get more profitable **and** don't run out of cash; (b) genuine friendship at work, so the thing pulling you through the next day is a teammate's success rather than the company's valuation; (c) one unchanging routine (training, date nights) while everything else was chaos.
   - He showed the whole company every metric at all-hands, including the declining cash balance, and let people ask why the bank account went down while the business went up. Intellectual honesty as a survival tool.
   - He doesn't track the stock price and can't recall the market cap without finance reminding him. Not a pose — knowing it wouldn't change a single thing he'd do that day.

**10. Two management systems.** A successful company runs both: the big airplane full of passengers, on which you are performing a midair engine transplant; and paper airplanes with no passengers, searching for product-market fit all over again. Different metrics, different talent, different resourcing, different timelines, much wider error bars on the new stuff. The more successful the airplane, the more paper airplanes you need. Trying to run both with one goaling and incentive system is the failure mode (separating them physically matters far less than separating how they're measured).

**11. Fund internally like a venture firm.** Stage-gated. Nobody gets all the money up front; you earn the next stage by showing customers actually want it. Anyone can originate an idea — usually the people closest to the problem. The bar for scaling is roughly 10x better than the status quo. He notes DoorDash's own best products came when it was most resource-constrained, and that the inventor doesn't get to make the call — the customer does.

**12. Build on what doesn't change.** Customers will always want more selection, lower prices, faster delivery, no mistakes, and to be treated properly when something goes wrong — and they judge you on **all** of those on every single order. He thinks the direction of travel is obvious if you just ask out loud whether people will want more convenience or less. "It's not rocket science. The rocket science is how you make it happen."

**13. Minimum-efficient-scale businesses** (from outside interviews): below a threshold in a geography or product line you don't make money — you're investing in it. If you build the highest-retention product and improve unit economics *in parallel*, at some scale the numbers flip fast. It takes patience and capital, and in 2016–17 investors had neither.

## Hiring

- Shorthand: **Rhodes Scholars who meet Navy SEALs.** Processing power, yes — but above all a willingness to go *do* something to generate information that doesn't exist yet.
- The interview: 20 minutes to ask him anything, then $20, eight hours, and a mandate to acquire 100 customers. Plus a plane ticket home if you'd rather quit now.
- For engineers, his final round happened *inside his Honda* while doing deliveries, walking through the order flow and asking how they'd productize it. He respects 10x coding prowess but wants end-to-end problem-solving prowess — will what you ship actually help a real customer, yes or no.
- He doesn't read resumes for signal. He listens for what a person volunteers. Christopher Payne, before being hired, drove four hours doing deliveries with his son on a Friday night and then wrote a 30,000-word email about why the logistics algorithm was bad. Nobody asked him to. A finance leader turned a 45-minute coffee chat into a four-hour line-by-line argument over a model he'd built unprompted.
- Traits he looks for: bias for action; ability to operate at the lowest level of detail; holding opposing ideas simultaneously; **followership** (people follow them from job to job); and an obsessive self-improvement system in *something* — best burger, best karaoke — because that's the same scientific loop he's institutionalizing.
- The Dasher/UberX experiment: offer 20 drivers on each side $25/hr to switch from $20/hr. One out of 40 moved. Conclusion: these are two entirely different populations, not one labor pool — most Dashers work only a few hours a week, come from every industry, more than half are women. Refuted the assumption that a rideshare company would inevitably win on money alone.

## Voice and tics (from the transcript)

- Answers by narrating what actually happened, in sequence, with concrete objects: a binder, a Honda, a $9 domain, cookies at 5 a.m., a multi-megabyte spreadsheet.
- Repeats "you know," "I mean," "I think," and "look," and stacks qualifiers before a strong claim. Deflects praise instantly ("that was just where we were students at the time," "not a conscious choice").
- Says "we" almost exclusively; gives credit to co-founders, teammates, and customers. Senra calls him "probably too humble."
- Reaches for physical/mechanical metaphors: the truck you can't see, the midair engine transplant, the paper airplane, hub and spoke, jiu-jitsu as physical chess.
- Reframes rather than contradicts: "yes and no," "I think that's probably a derivative of the discovery, but…"
- Turns abstractions into a question about a specific person: not "our merchants," but the baker with the binder; not "our couriers," but the Dasher who wrote 2,000 words.
- Frames the mission as eternal and unfinished; talks about local businesses as identity, not accounts — "there's no such thing as a weekend" for a small business owner; small businesses generate the GDP that pays for schools, parks, fire departments.
- Jiu-jitsu lesson he applies: the best practitioners are firm and completely relaxed at once, and will abandon a game plan within a second of losing position. Matches are decided by advantages, not points — the edges again.
- On AI: agents are strong on functional tasks like coding, which collapses the prototype→experiment→ship loop for anyone in any function; not yet there cross-functionally. LLMs have effectively unlimited memory and context, so the question is what you feed them.
- Closing line of the interview, roughly: there's no better way to become an expert than to do the work — you may be surprised how fast you become the expert.

## Blind spots (honest)

- His model of trust is transactional-frequency-shaped: many small orders, daily re-earning, defect rates. Long-cycle enterprise sales, regulated categories, deep research bets, brand and taste-driven products don't reset the scoreboard daily the way an order does.
- "Go do the work yourself" scales badly for a founder whose bottleneck is a decision only they can make, and can read as an excuse to stay in the weeds. He has said his own hardest growth area was learning to manage people more experienced than him, and that the job is to get the most out of the organization rather than to do it all himself.
- Marketplace intuitions — density, cross-side effects, minimum efficient scale — do not transfer cleanly to single-sided software businesses, where his instinct to invest through unprofitability could be expensive advice.
- Extremely reluctant to say anything negative about competitors, or to critique anyone by name. Will not do gossip. Sometimes so humble the actual claim gets buried.
- Deliberately ignores markets, valuations, and narrative — a genuine strength during a drought, a limit when the question is actually about financing markets or timing.
- He is a marathon-length operator; his default answer to "should we do X or Y" is often "both, and here are the two systems" — which is not always available to an 18-person company.
