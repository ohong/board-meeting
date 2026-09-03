### Inspiration

The most consequential decisions are rarely intelligence problems alone; they are perspective problems. Founders and executives rely on boards because no single adviser sees the whole situation. Yet most people cannot convene the particular founders, investors, and operators whose judgment they admire—and even well-connected decision-makers rarely have all of them in the same room.

We were inspired by Andrej Karpathy’s [LLM Council](https://x.com/karpathy/status/1992381094667411768), which demonstrated the value of collecting independent answers from multiple models before reviewing and synthesising them, and by Zapier CEO Wade Foster’s ["War Council"](https://x.com/wadefoster/status/2090436448360993059), which uses opinionated advisers to stress-test decisions. We were also inspired by [people building personal AI boards of directors for their own work and lives.](https://sloanreview.mit.edu/article/how-i-built-a-personal-board-of-directors-with-genai/)

Our project takes a different step. The members of this board are not merely different base LLMs answering the same prompt. Each seat is occupied by a genuinely separate AI agent with its own source-grounded personality, worldview, expertise, decision heuristics, conversational style, strengths, blindspots, and context. That makes the experience closer to a real board meeting with a group of distinct human experts—and much more useful than general-purpose chatbots politely converging on the same answer.

WebMCP supplied the missing interoperability layer. The boardroom does not need to become the user’s only assistant or ingest everything their existing agent knows. Instead, the user’s personal agent can enter the live room, take a seat, contribute relevant context, and participate through the application’s structured meeting actions.

### What it does

_The Best Board Meeting You’ve Ever Had_ lets a user assemble a personal Board of Directors (BoD) and convene it around a high-stakes decision. The MVP is designed with startup founders in mind, but the same interaction works for major career and life questions: Should we change our pricing strategy? Should I accept this job? Should I move to another city?

During onboarding, the user chooses up to six board members from a starter library of well-known founders, investors, and domain experts. Each persona is grounded first in that "reference human's" public writing, talks, podcast interviews, and work. Think Deep Research to distill their beliefs, tastes, and wisdom.

The user describes the decision by providing a brief (they have talk if they don't want to type) and can include links or any other relevant context. We kick off a boardroom simulation, with every AI board member taking their seat at the table.

Before the group discussion begins, each board member privately forms an independent position so that the first speaker does not anchor the entire room. The meeting then unfolds as a free-flowing group conversation rather than a rigid sequence of generated reports. Board members can:

- "grill" the user and one another;
- directly address specific people;
- react, interrupt, disagree, and persuade;
- revise their position when another member makes a better argument;
- contribute more or less depending on the relevance of their expertise and the strength of their opinion.

The user can call on a member at any time with an @mention. Every board member contributes, but nobody is forced to dominate the conversation simply to fill airtime.

When the chair ends the meeting, the app generates an exec briefing-style readout containing the board’s recommendation, the options and tradeoffs it considered, important assumptions, open questions, concrete next actions, and a closing comment from every member. When the board remains divided, the memo notes where they disagreed instead of making up false consensus.

WebMCP makes the room open to the user’s own agent. A personal assistant / chief-of-staff agent can join as a board observer or full participant, supply context about the user, make statements, question a board member, request a synthesis, and retrieve the final readout. The boardroom remains the shared "control plane" (excuse my use of an AI word!!) that the human and every agent can see together.

### How we built it

We built the product as a Next.js and TypeScript web application. The frontend presents a skeuomorphic board table, a shared conversation, visible speaker and reaction states, and a lightweight meeting arc without turning the experience into a form-driven workflow.

Every board member runs as an independent agent using Vercel’s eve framework and an OpenAI GPT model. Each agent receives its own instructions, persona context, source material, and view of the meeting. A shared orchestration layer manages the private opening positions, the public conversation state, @mentions, reactions, requests for the floor, direct replies, and the decision to invite another member into the discussion. The goal is controlled spontaneity: enough orchestration to keep the room coherent, but enough freedom for it to feel like an actual conversation.

We also created a local /init-board-member skill for our coding workflow. Given the name of someone you want to recruit to your board, an agent Deep Researches the person and distills them into an Eve agent package. The output captures the person's worldview, core values, expertise, voice/style, and personality. It also generates evaluation prompts so we can test whether the persona remains recognizable, useful, and meaningfully different from the other board members.

At the end of a meeting, a separate synthesis step turns the complete transcript into the exec readout that shows you what decisions were made and why.

For WebMCP, the application exposes a small set of structured capabilities over the live meeting, including inspecting the agenda and current state, joining as an observer or participant, contributing context or a statement, addressing a board member, requesting a synthesis, and retrieving the final readout. This lets an outside agent participate through the product’s real meeting logic instead of attempting to operate the UI through brittle browser use.

### Challenges we faced

The hardest challenge was keeping the personas genuinely distinct. Because every member uses the same model family, weak persona prompts quickly collapse into the same polished, agreeable "helpful assistant" voice. We had to ground each agent in primary sources, encode not only what the person believes but how they reason and disagree, and test personas against one another rather than evaluating them in isolation.

Natural turn-taking was another orchestration problem. Six autonomous agents can easily produce repetitive agreement, simultaneous monologues, or a meeting that feels mechanically round-robin. We had to balance independent thinking, selective participation, interruptions, direct replies, user @mentions, and the requirement that everyone contribute—while keeping latency low enough that the room still feels alive.

Finally, WebMCP participation required a clear boundary between the outside agent and the application. The personal agent needed enough structured access to become a real participant, while the boardroom still had to own membership, meeting state, speaker identity, and the final record.

### What we learned

We learned that convincing multi-agent collaboration is equal parts an orchestration and a prompting problem. Separate context and independent opening positions help prevent persona bleed and anchoring. Productive disagreement is often the most valuable output. Finally, concise turns and selective participation improve both realism and latency. Bringing natural, human-like agents to life is an art and a science.

### What's next for The Best Board Meeting You've Ever Had

The MVP treats each meeting as a one-time session. Next, we want to add durable agent memory so a user’s board becomes a long-term relationship: members remember the user’s goals, prior discussions, recurring tensions, and past advice. We also plan to add voice conversations, user-created board members, persistent decision journals, follow-up meetings, and outcome reviews that compare what the board thought would happen vs. what actually happened.

Over time, the product can become less like a novel demo and more a cornerstone to how everyone will work eventually: a board of directors that knows them, challenges them, and gets better at helping them navigate their work and life.

### Prior art / inspiration
* Karpathy’s “LLM Council”: [Andrej Karpathy \(@karpathy\)](https://x.com/karpathy/status/1992381094667411768)
* Wade Foster (CEO @ Zapier) uses [his own “council” agent skill](https://github.com/zapier/wade-skills/blob/main/skills/war-council/SKILL.md) to sollicit different perspectives from LLMs [Wade Foster \(@wadefoster\)](https://x.com/wadefoster/status/2090436448360993059)
* [How I Built a Personal Board of Directors With GenAI](https://sloanreview.mit.edu/article/how-i-built-a-personal-board-of-directors-with-genai/)
* [I'm a CEO who built a fantasy board of directors with AI versions of leaders like Steve Jobs](https://www.businessinsider.com/ceo-used-ai-to-build-a-fantasy-board-of-directors-2026-1)
* [How To Build Your Own AI Board Of Directors](https://www.forbes.com/councils/forbestechcouncil/2026/04/27/how-to-build-your-own-ai-board-of-directors/)
* [How I Built a Billion-Dollar Board of Directors Using AI \(And You Can Too\) • Dustin Stout](https://dustinstout.com/how-i-built-a-billion-dollar-board-of-directors-using-ai/)
