# The Best Board Meeting You’ve Ever Had
## MVP Product Specification and Parallel Build Plan

**Status:** Build-ready MVP specification  
**Primary audience:** General orchestrator and implementation subagents  
**Target:** OpenAI WebMCP Challenge demo  
**Demo length:** 2 minutes  
**Product stack:** Next.js, TypeScript, Vercel eve, OpenAI GPT models  
**Persistence:** None; every page visit begins a new session  
**Database:** Not required; do not add Supabase unless the General orchestrator discovers a blocking need

---

## 1. Product definition

### 1.1 What we are building

**The Best Board Meeting You’ve Ever Had** is a decision-support web app where a user convenes a personal board of three to six AI advisers modeled on notable founders, investors, and operators who have appeared on David Senra’s interview podcast.

Each adviser is a genuinely separate AI agent with its own source-grounded worldview, expertise, temperament, strengths, shortcomings, and conversational behavior. The product is not an “LLM council” that asks several base models the same question. It is intended to approximate the productive dynamics of a real board meeting among distinct human experts.

The user brings a consequential business, career, or life decision, chairs a live text-based meeting around a visual boardroom table, and leaves with an executive readout summarizing the board’s position, tradeoffs, assumptions, open questions, and next actions.

A compatible personal agent—Codex in the demo—can join the same live meeting through WebMCP, take a visible seat, inspect the discussion, contribute context, question a board member, request a synthesis, and retrieve the final readout.

### 1.2 Why this exists

People make better high-stakes decisions when they can pressure-test them with experienced advisers who think differently. Most people cannot assemble the founders, investors, and operators whose judgment they most admire. General-purpose AI makes advice abundant, but tends to compress many possible perspectives into one polished, agreeable response.

This product gives users access to advisers they could never ordinarily convene and turns a solitary prompt into a participatory decision process with productive disagreement and a durable outcome.

### 1.3 Initial target user

The MVP is designed first for an early-stage startup founder facing a consequential company decision. The underlying interaction must remain legible for career and life decisions, but the demo copy, suggested question, and board selection should optimize for the founder use case.

### 1.4 Core user promise

> Convene a board you could never normally assemble, let distinct expert agents challenge your decision together, and leave with a clearer course of action.

### 1.5 Product principles

1. **The room is the product.** This must feel like a board meeting, not a standard chatbot with decorative avatars.
2. **Distinct agents, not duplicated voices.** Every board member has separate context and source-grounded behavior.
3. **Independent thought before group influence.** Members privately form an opening position before seeing one another’s public arguments.
4. **Productive disagreement beats artificial consensus.** The board may remain divided, and the readout must preserve that division.
5. **The human remains chair.** The user can call on anyone, add context, and decide when the meeting ends.
6. **Fast, concise turns create realism.** The board should feel conversational rather than producing essays.
7. **WebMCP augments the boardroom.** It is an important interoperability moment, not the main product story.
8. **Build only the two-minute demo.** Prefer a reliable vertical slice over breadth, configuration, or production infrastructure.

---

## 2. MVP success definition

The MVP is successful when a first-time viewer can watch the following complete story in two minutes:

1. A user selects three recognizable advisers.
2. The user gives the board a consequential founder decision.
3. Separate board-member agents form independent positions.
4. A candid group discussion begins, with visible disagreement and direct interaction.
5. The user calls on one adviser with an @mention.
6. Codex receives an invitation, discovers the page’s WebMCP tools, joins visibly under its own identity, adds context, asks a targeted question, and requests a synthesis.
7. The human ends the meeting.
8. The app produces an executive readout.
9. Codex retrieves that readout through WebMCP.

The MVP does **not** need analytics, retention features, production account systems, or broad customization. Demo comprehension, agent distinctness, interaction quality, WebMCP interoperability, and reliability are the success criteria.

---

## 3. Exact two-minute demo contract

The build should be optimized and rehearsed against this golden path. The app may support other decisions and boards, but nothing should compromise this flow.

### 3.1 Demo board

Use these three advisers in the primary demo:

- **Daniel Ek**
- **David Heinemeier Hansson (DHH)**
- **Lulu Cheng Meservey**

This combination should produce meaningfully different lenses on freemium growth, focused SaaS economics, and customer narrative or trust.

### 3.2 Demo decision

**Question:**

> Should our B2B collaboration app eliminate its free tier and replace it with a 14-day trial?

**Visible briefing:**

> We are an 18-person seed-stage company at $1.6M ARR. We have 6,000 free workspaces and 420 paying customers. Only 2.3% of free workspaces convert within 90 days, and free users generate 38% of support tickets. However, 34% of current paying customers first discovered us through a free workspace. We want faster growth and a simpler product, but we are worried about weakening word of mouth.

The product must include a one-click way to populate this example while still allowing arbitrary free-form input.

### 3.3 Codex-only context for the demo

Before the demo, the presenter’s Codex conversation should already know this private context, which is not included in the board briefing:

> Seven of our last ten enterprise wins first entered through a free workspace shared by an existing user. Those accounts now represent 22% of ARR.

Codex should decide that this information is relevant and contribute it after joining. The app must not hard-code or fabricate this fact; it comes from Codex’s existing context.

### 3.4 Timed demo sequence

| Time | Required moment |
|---|---|
| **0:00–0:15** | Open directly into board selection. Search or scan the roster and select Daniel Ek, DHH, and Lulu Cheng Meservey. |
| **0:15–0:25** | Populate the example founder decision, briefly show the context, and start the meeting. |
| **0:25–0:40** | All three seats visibly enter a private “thinking” state, then become ready as independent positions complete in parallel. |
| **0:40–1:15** | The board begins a concise, lively discussion. Members challenge the premise and one another. The user asks **@Lulu** how to explain a free-tier change without losing user trust, and Lulu answers directly. |
| **1:15–1:45** | Click **Invite your agent** and copy the generated invitation prompt into Codex. Codex inspects the meeting, joins under its own name, visibly takes the guest seat, contributes its private context, asks **Daniel Ek** whether the enterprise-referral evidence changes his view of the free tier, and requests a current synthesis. Daniel responds. |
| **1:45–2:00** | The human clicks **End Meeting**. The executive readout appears. Codex calls the readout tool and retrieves the final memo. |

### 3.5 Demo performance targets

These are targets for the rehearsed demo environment, not general production SLAs:

- The first public board contribution should begin within **8 seconds** of starting the meeting.
- Most subsequent agent turns should begin within **4 seconds** of the prior turn completing.
- The WebMCP join action should produce an immediate visible seat transition.
- The final readout should appear within **10 seconds** of ending the meeting.
- Board turns should normally remain below **90 words**, with a strong preference for 30–70 words.
- The full golden path must be repeatable from a fresh page without manual recovery.

---

## 4. Scope

### 4.1 In scope

- A static, searchable library of eligible David Senra podcast guests.
- Selection of a minimum of three and maximum of six board members.
- One long-form decision briefing input with optional pasted links treated as text.
- One-click loading of the demo decision.
- A desktop visual boardroom accommodating:
  - one human chair;
  - up to six AI board members;
  - one external personal-agent guest.
- Separate source-grounded eve agents for every selectable board member.
- Parallel generation of private opening positions.
- A free-flowing, shared text discussion.
- Direct user @mentions.
- Agent-to-agent replies, visible reactions, next-turn interruptions, and position updates.
- Human-controlled meeting conclusion.
- A chief-of-staff-style final readout.
- WebMCP tools for Codex to inspect, join, contribute, address a member, request synthesis, and retrieve the readout.
- Ephemeral session state that disappears on refresh.
- Minimal retry and fallback behavior needed for a reliable demo.

### 4.2 Explicit non-goals

Do not build any of the following for this MVP:

- User accounts or authentication.
- Saved meetings, history, bookmarks, or recovery after refresh.
- A database or Supabase integration.
- Cross-session or long-term agent memory.
- User-created personas.
- Historical figures outside the Senra guest roster.
- Voice, speech synthesis, audio, or lip sync.
- File uploads or document ingestion.
- Fetching, parsing, or summarizing URLs pasted into the briefing.
- Live web research during meetings.
- Mobile-specific layouts or native mobile apps.
- Multiple human participants.
- More than one external personal agent.
- A shareable cross-device or cross-browser meeting room.
- Production-grade Google Meet-style invitation tokens.
- Side conversations or private chats between board members.
- Voting, confidence scores, predictions, or imaginary betting.
- Decision journals, follow-up meetings, or outcome tracking.
- Payments, plans, usage quotas, or billing.
- Analytics dashboards, admin tools, or content-management systems.
- Multiple LLM providers.
- Public-figure licensing workflows, endorsement systems, or production legal tooling.
- Heavy 3D rendering, avatar animation, or spatial audio.
- Citation-heavy dialogue.

---

## 5. Session and navigation requirements

### 5.1 Session lifecycle

- Every new page load creates a completely fresh session.
- No meeting state may be restored after refresh or browser reopen.
- Do not store the board, briefing, transcript, readout, or invitation state in a database, browser storage, or cookies.
- Temporary state may exist only for the life of the active page and active model calls.
- Refreshing at any point returns the user to board selection.

### 5.2 Product steps

The MVP consists of four product states:

1. **Choose your board**
2. **Brief your board**
3. **Board meeting**
4. **Executive readout**

These may be implemented as routes or application states. The internal choice is left to the implementation team, but transitions must feel immediate and the browser Back button must not create partially restored meetings.

### 5.3 Entry experience

- The app should open directly into board selection, not a marketing homepage.
- A concise heading and one-sentence explanation are sufficient.
- The user should understand within five seconds that they are assembling an AI board to discuss a high-stakes decision.

---

## 6. Adviser catalog and board selection

### 6.1 Eligible roster

- **Build-freeze date:** September 3, 2026. The selectable roster is the set of guests with published episodes on David Senra’s official guest or podcast roster on that date. Do not expand the roster during the MVP build without General approval.
- The app must use a build-time static catalog. It must not scrape the Senra site at runtime.
- Every catalog entry must map to a successfully initialized persona package created by the existing `initialize-board-member` skill.
- A guest must not appear selectable unless their persona agent can be discovered and invoked successfully.
- The release goal is complete coverage of the frozen guest roster, enabling the user to choose any eligible guest.

### 6.2 Persona initialization

Before deployment, each guest must be initialized using the existing project skill:

- Canonical starting source: the guest’s David Senra interview transcript.
- Supplemental input: deeper research across primary public sources.
- Output: a distinct eve agent with its own instructions, context, expertise, worldview, voice, blind spots, and boardroom conduct.
- Runtime meetings must not conduct new persona research.
- Persona packages must be bundled with the deployment.

### 6.3 Catalog card requirements

Each board-member card must show:

- Portrait or recognizable image.
- Full name.
- One concise role or expertise line.
- Clear selected and unselected states.

A full biography or detailed profile page is out of scope. A lightweight hover, tooltip, or compact expandable detail is optional only when it does not slow implementation.

### 6.4 Search and selection behavior

- The user can search the catalog by name or role text.
- The interface shows the current selected count.
- Selection is blocked below three and capped at six.
- Attempting to select a seventh member produces immediate inline feedback.
- The primary action remains disabled until three to six advisers are selected.
- The user may deselect and replace members before the meeting starts.
- Board membership becomes locked once the meeting starts.

### 6.5 Demo convenience

The three demo advisers should be easy to find without special hidden behavior. A sensible sort order, recent guests, or search is sufficient; do not create a separate demo-only roster in the visible product.

---

## 7. Decision briefing

### 7.1 Briefing input

- Present a single large text input labeled around the question: **“What decision are you trying to make?”**
- The user can enter a decision, relevant background, constraints, metrics, and links in one free-form briefing.
- Pasted links remain plain text. The app does not fetch or inspect them.
- The selected board must remain visible in compact form while briefing.

### 7.2 Demo example

- Provide a clearly labeled action such as **Use example decision**.
- Activating it populates the exact demo briefing in Section 3.2.
- The user may edit the populated text.

### 7.3 Starting the meeting

The **Start Board Meeting** action is enabled only when:

- three to six board members are selected; and
- the briefing contains meaningful non-whitespace text.

Starting the meeting locks the board and briefing for the session and transitions to the boardroom.

---

## 8. Boardroom experience

### 8.1 Visual objective

The boardroom should feel premium, intelligent, intimate, and lightly theatrical without becoming kitschy. It should use skeuomorphic cues—a table, seats, nameplates, depth, material, lighting, or similar—while remaining a functional text interface.

The specification defines required information and states, not a fixed visual style. The design implementation may explore different aesthetics so long as the room is immediately legible.

### 8.2 Seat layout

The room must support up to eight visible participants:

- The human chair, labeled **You**, in a visually privileged chair position.
- Three to six selected AI board members.
- One reserved guest seat for the external personal agent.

Requirements:

- Seats must remain readable at common laptop resolutions.
- Fewer than six advisers should be distributed intentionally rather than leaving several distracting empty chairs.
- The external-agent guest seat may appear subtly reserved or materialize when an agent joins.
- Each seat shows the member’s name and portrait or identity mark.

### 8.3 Participant states

A board-member seat must visibly communicate relevant states:

- Idle
- Forming an independent position
- Ready
- Speaking
- Wants to respond or interrupt
- Reacting or disagreeing
- Temporarily unavailable or retrying

The external-agent seat must additionally communicate:

- Invited or waiting, if shown
- Joining
- Joined
- Contributing context
- Asking a question

These states should use restrained motion and emphasis. Elaborate character animation is out of scope.

### 8.4 Shared transcript

- All human, board-member, external-agent, and system contributions appear in one shared transcript.
- Every message clearly identifies the speaker.
- Direct replies or @mentions identify the intended recipient while remaining visible to everyone.
- The transcript must remain readable while the board table stays visible.
- New messages should stream and scroll into view without disorienting jumps.
- System moments—meeting started, Codex joined, synthesis requested—may appear as compact event rows rather than chat bubbles.

### 8.5 User composer

The user can:

- Add context or answer questions.
- Address the whole board.
- Call on a specific member using `@Name`.
- Click a board member to insert their mention, if this is simpler and more discoverable.

Sending a user message should pause automatic continuation long enough for the orchestrator to incorporate it into the next turn.

### 8.6 Primary controls

During the meeting, the interface must provide:

- **Invite your agent**
- **End Meeting**
- The text composer

Do not add settings, model selectors, persona controls, transcript exports, or meeting configuration.

---

## 9. Board-member agent behavior

### 9.1 Separate agent requirement

Every selected board member must run as a genuinely separate eve agent or declared eve subagent with:

- its own persona instructions;
- its own isolated context for the current invocation;
- its own private opening position;
- access to the public meeting transcript supplied for that turn;
- its own record of prior statements and updates.

One model pretending to be the entire board in a single generation does not satisfy the product requirement.

### 9.2 Runtime inputs

For each turn, a board member must receive enough current context to participate coherently, including:

- the user’s decision briefing;
- the meeting phase;
- the public transcript or a faithful compact representation;
- that member’s private initial position;
- that member’s own prior public statements;
- direct mentions or questions addressed to them;
- any new context contributed by the human or external agent.

Board members must not receive another member’s private opening position. They learn other positions only from public messages.

### 9.3 Independent opening positions

When the meeting starts:

- Every selected member forms a private initial view in parallel.
- The view should include a provisional recommendation, the central reasoning, the most important concern, and at least one question or assumption worth testing.
- The opening positions seed later dialogue but are not dumped into the transcript as long reports.
- The UI marks each member ready when their position completes.
- Public discussion can begin when all positions are ready; a graceful fallback may begin after the minimum viable set is ready if one member is retrying.

### 9.4 Public discussion behavior

Board members should:

- Speak in concise, natural turns.
- Offer specific advice rooted in their documented worldview.
- Ask the kinds of questions the represented person would plausibly ask.
- Address the user and one another by name.
- Challenge assumptions when warranted.
- Build on, rebut, or reframe prior contributions.
- Admit uncertainty or defer outside their strongest domains.
- Change or qualify their position when genuinely persuaded.
- Avoid generic consulting language, repetitive agreement, and long monologues.
- Avoid repeatedly explaining that they are an AI simulation.
- Keep all dialogue public to the room.

### 9.5 Participation rules

The orchestration must ensure:

- Every selected member speaks publicly at least once before the meeting can produce a final readout.
- No member should speak a third time before every available member has spoken once, unless the human directly @mentions that person.
- Members may speak more or less often depending on relevance and conviction.
- A member may choose not to add another turn after meeting the minimum contribution requirement.
- Direct user mentions override the normal speaker queue and make the addressed member the next available board speaker.

### 9.6 Questions to the user

- Members may ask the user questions naturally.
- A question does not automatically halt the whole board indefinitely.
- The interface should make a current question easy to answer, but the discussion may continue using explicit assumptions when the user does not respond.
- The demo should include at most one clearly foregrounded question before the WebMCP segment.

### 9.7 Reactions and interruptions

For the MVP:

- A reaction is a small visible signal such as agreement, concern, disagreement, or desire to respond.
- An interruption means a member is prioritized for the next turn; do not cut off a message already streaming.
- The demo should visibly show at least one reaction and one direct rebuttal or interruption.
- These behaviors may be emitted as part of normal orchestration metadata; do not add separate model calls solely for decorative reactions.

---

## 10. Meeting orchestration

### 10.1 Role of the meeting engine

The meeting engine owns the live session mechanics, not the substantive persona opinions. It must:

- track meeting phase and participant readiness;
- run opening positions concurrently;
- maintain the shared transcript;
- queue human and WebMCP events;
- select or honor the next speaker;
- enforce participation constraints;
- prevent simultaneous public streams;
- route direct questions to the correct board member;
- incorporate new context;
- trigger interim synthesis and final readout;
- handle retries and degraded states.

### 10.2 Conversation pacing

- Only one public message streams at a time.
- After a contribution, the next turn should begin automatically unless the human is actively composing, a direct input is queued, or the meeting is ending.
- The discussion should feel free-flowing rather than visibly round-robin.
- The default meeting should produce roughly 8–12 total agent contributions before the user ends it, though the human remains in control.
- The two-minute demo should reach the WebMCP invitation after approximately 5–7 public board contributions.

### 10.3 Speaker selection priorities

The engine should prefer, in order:

1. A member directly @mentioned by the user or external agent.
2. A member with a material rebuttal or relevant expertise.
3. A member who has not yet spoken.
4. A member who can introduce a new lens rather than repeat the transcript.

A deterministic fallback order must exist if any model-based speaker planning fails.

### 10.4 Meeting end

- Only the human chair can finalize the meeting.
- The external agent may request synthesis but cannot end the meeting.
- When **End Meeting** is clicked, finish or cleanly stop the current visible turn, then enter the closing/readout phase.
- The control should not require a confirmation modal in the MVP.

---

## 11. WebMCP experience

### 11.1 Product intent

WebMCP allows the user’s existing personal agent to participate in the boardroom without a custom server integration. In the demo, Codex operates on the same live page open in its built-in browser and uses the site’s registered tools.

The MVP invitation is a **copyable invitation prompt**, optionally accompanied by the current page URL. It is not a remotely synchronized room link. Cross-browser and cross-device joining are explicitly out of scope.

### 11.2 Invite flow

- **Invite your agent** is available from the start of an active meeting until the human ends it.
- Activating it opens a compact invitation panel.
- The panel explains that a compatible agent can join through the current page’s site tools.
- The panel contains a copyable prompt instructing the agent to:
  1. inspect the meeting;
  2. join using its own known identity;
  3. contribute relevant context it already knows;
  4. ask a focused question of the most relevant board member;
  5. request a synthesis of the current discussion;
  6. retrieve the final readout after the human ends the meeting.
- The invitation must not prescribe the display name “Codex”; the joining agent supplies the name it knows for itself.
- One external agent may join per meeting.

The generated invitation copy should be substantially equivalent to:

> You are invited to the active board meeting on this page. Use its Site tools to inspect the meeting, join using the name you know yourself by, share any relevant context you already have, ask Daniel Ek one focused question about whether that evidence changes his view, and request a synthesis of the discussion. After the human chair ends the meeting, retrieve the final readout.

### 11.3 Required WebMCP capabilities

The top-level page must expose exactly six narrowly scoped tools with stable names. Locking these names allows the invitation prompt, Codex demo, tests, and UI confirmation states to be built in parallel against one contract.

#### A. `inspect_board_meeting` — Inspect meeting

The external agent can read:

- the decision briefing;
- current meeting phase;
- selected board members;
- current participants;
- public transcript or a bounded recent transcript with sufficient context;
- whether a final readout exists.

This action has no side effects.

#### B. `join_board_meeting` — Join meeting

The external agent can:

- provide its own display name;
- join as a full visible participant;
- occupy the guest seat;
- receive confirmation that it joined.

The UI must immediately show a conspicuous but tasteful joining transition and a shared system event.

#### C. `contribute_to_board_meeting` — Contribute context or a statement

Once joined, the external agent can add relevant context to the public meeting. The contribution:

- is attributed to the external agent;
- becomes part of the shared transcript and meeting context;
- is visible to the human and all board members;
- influences subsequent board turns.

#### D. `address_board_member` — Address a board member

Once joined, the external agent can send a focused question or statement to a named adviser. The addressed adviser receives next-turn priority and should answer directly.

#### E. `request_board_synthesis` — Request current synthesis

Once joined, the external agent can request a concise interim summary of:

- current agreement;
- current disagreement;
- the most important unresolved question.

This does not end the meeting. The synthesis appears as a compact system or secretary contribution visible to everyone.

#### F. `get_board_meeting_readout` — Retrieve final readout

After the human ends the meeting and the readout exists, the external agent can retrieve its complete contents. Before then, the tool must return a clear not-ready status rather than fabricating a result.

### 11.4 WebMCP state and authority rules

- WebMCP actions must call the same underlying meeting actions used by the human UI. Do not create a parallel or disconnected transcript.
- The external agent cannot change the board roster, edit prior messages, impersonate another participant, or end the meeting.
- If a WebMCP contribution arrives while a board member is streaming, queue it and apply it immediately after that turn.
- If the agent joins during opening-position generation, show the seat immediately and queue substantive contributions until open discussion begins.
- Tool results must be concise and include enough current state for Codex to verify what changed.
- WebMCP failure must not crash or block the human meeting.

### 11.5 Codex compatibility requirement

For the challenge demo, tools must be registered from the top-level page using the currently supported imperative WebMCP/site-tools path. Do not rely on declarative form tools or iframe tool registration for the core demo.

### 11.6 Visible demo evidence

The viewer must be able to see all of the following without opening developer tools:

- The invitation prompt is generated and copied.
- Codex joins under its own name.
- A guest seat visibly appears or activates.
- Codex contributes previously missing context.
- Codex addresses a specific adviser.
- That adviser responds.
- Codex requests an interim synthesis.
- Codex retrieves the final readout after meeting conclusion, with a subtle visible confirmation in the app.

---

## 12. Ending the meeting and executive readout

### 12.1 Closing comments

When the human ends the meeting:

- Request one concise closing comment from every selected board-member agent in parallel.
- Each comment should state the member’s most important recommendation, unresolved concern, or next action.
- If a closing-comment call times out, use that member’s most recent substantive position rather than blocking the readout indefinitely.
- An external agent is not required to generate an additional closing comment; its contributions should still be reflected in the memo.

### 12.2 Readout generation

Use a separate internal secretary or synthesis agent to generate a faithful executive readout from:

- the original briefing;
- the complete public transcript;
- each member’s closing comment;
- material external-agent contributions.

The secretary is not a visible board member and must not invent consensus or new facts.

### 12.3 Required readout sections

The readout must include:

1. **Decision under discussion**
2. **Board recommendation**
   - State the dominant recommendation clearly.
   - Explicitly state when the board remains divided.
3. **Options considered**
4. **Key tradeoffs**
5. **Important assumptions**
6. **Open questions**
7. **Recommended next actions**
8. **Closing comments by board member**

The exact visual arrangement is flexible, but every section must be easy to scan.

### 12.4 Readout UI

- Replace or clearly transition from the live meeting into the readout state.
- Preserve compact access to the participant roster and original question.
- Provide a simple **Copy readout** action.
- Do not add PDF export, saved history, sharing, or editing.
- The WebMCP final-readout tool reads from this same generated result.

---

## 13. Error handling and graceful degradation

### 13.1 Board-member failure

- Automatically retry one failed opening-position or turn request.
- While retrying, show a quiet “reconnecting” or equivalent state on that seat.
- Other ready members may continue rather than freezing the room.
- A failed member should remain eligible to rejoin later in the meeting.
- The demo environment must be tested until the chosen three-member board completes reliably.

### 13.2 Orchestration failure

- If intelligent next-speaker selection fails, fall back to deterministic selection using direct mentions, unspeaking members, and a stable seat order.
- A speaker-planning failure must not end the meeting.

### 13.3 Streaming failure

- A failed visible turn should end cleanly rather than leaving the interface permanently “typing.”
- Offer a small retry action or allow the orchestrator to move to another member.
- Duplicate partial messages must not remain in the transcript.

### 13.4 Readout failure

- Retry final synthesis once.
- If synthesis still fails, show a simplified fallback assembled from the transcript and closing comments rather than a blank screen.

### 13.5 WebMCP unsupported or failed

- The human board meeting remains fully usable without WebMCP support.
- The invite panel may explain that the current browser does not expose site tools, but it must not derail the meeting.
- A failed external-agent tool call returns a clear error and does not mutate state partially.

---

## 14. Technical constraints and implementation boundaries

### 14.1 Required stack

- **Frontend:** Next.js and TypeScript.
- **Agent framework:** Vercel eve.
- **Models:** OpenAI GPT models only.
- **Hosting:** Compatible with a standard Vercel deployment.
- **Database:** None for the MVP.

### 14.2 Eve usage

- Use the current official eve integration for a Next.js application rather than inventing custom framework plumbing.
- Model-facing board members must be represented as separately discoverable eve agents or subagents.
- The existing persona-initialization skill should generate packages that conform to the repository’s eve conventions.
- Keep large source notes out of always-on prompts; runtime persona context should prioritize behavior-critical material and latency.
- The General orchestrator selects exact OpenAI model names based on current availability, challenge requirements, latency, and cost. Do not hard-code an outdated model merely because it appears in this specification’s creation context.

### 14.3 State ownership

- The current page is the source of truth for the active product session.
- Server calls receive the relevant meeting context for each invocation and return events or content to the page.
- Do not introduce persistent server sessions, session recovery, or shared room infrastructure.
- WebMCP handlers invoke the same client-side session actions as the human interface.

### 14.4 Determinism versus model judgment

Use deterministic application logic for:

- phase transitions;
- selection limits;
- participant identity;
- transcript ordering;
- queueing;
- authorization of chair-only actions;
- minimum participation rules;
- retry limits;
- WebMCP side effects.

Use models for:

- persona-specific reasoning and dialogue;
- identifying substantive disagreement or a useful next speaker when needed;
- interim synthesis;
- final executive readout.

Do not delegate basic product-state correctness to an LLM.

### 14.5 No unnecessary infrastructure

Do not add:

- Supabase;
- Redis;
- queues;
- background workers;
- account systems;
- a CMS;
- a vector database;
- runtime retrieval infrastructure;
- event analytics;
- feature-flag services.

A dependency may be added only when it directly enables a required MVP behavior and the General orchestrator approves it.

---

## 15. Quality and acceptance criteria

### 15.1 Functional acceptance

The build is acceptable only when all of the following work:

- A fresh visit always begins at board selection.
- The user can search and select any eligible roster member.
- The user must select three to six members.
- The demo decision can be populated in one click.
- Starting the meeting invokes separate persona agents in parallel.
- Every selected member forms a private opening position.
- Every selected member speaks publicly at least once.
- The transcript supports direct user @mentions.
- A named adviser answers an @mention next.
- At least one agent-to-agent rebuttal appears in the rehearsed demo.
- The human can end the meeting.
- The final readout contains every required section and preserves dissent.
- Refreshing loses the meeting and starts over.
- No authentication or database is present.

### 15.2 WebMCP acceptance

Using Codex in the supported browser environment:

- Codex discovers the app’s site tools.
- Codex can inspect the current meeting.
- Codex chooses and supplies its own display name.
- Joining visibly activates the guest seat.
- Codex can contribute context to the live transcript.
- Codex can address a selected board member.
- The addressed member responds using the added context.
- Codex can request and receive an interim synthesis.
- Codex cannot end the meeting.
- After the human ends the meeting, Codex can retrieve the exact displayed readout.

### 15.3 Persona acceptance

For each selectable guest:

- The persona package passes the existing initialization skill’s required research and evaluation process.
- The agent is discoverable by eve.
- The agent can produce an opening position, public turn, direct answer, rebuttal, position update, and closing comment.
- The persona is distinguishable from a generic founder adviser and from at least two other board members.
- The persona remains useful outside its strongest domain and appropriately bounded where it lacks expertise.

### 15.4 UX acceptance

- The core task is understandable without a tutorial.
- Selected members, current speaker, and meeting phase are always legible.
- The board table remains visible alongside the transcript at the target demo resolution.
- Streaming does not cause major layout shifts.
- The external agent’s arrival is unmistakable.
- The readout is scannable in under ten seconds.

### 15.5 Reliability acceptance

- The exact golden path completes successfully in at least five consecutive fresh-session rehearsals.
- Deterministic mock-model tests cover the full product flow without external API calls.
- A live-model smoke test covers the three-person demo board.
- A live Codex/WebMCP smoke test covers the complete invitation sequence.

---

## 16. Parallel implementation plan for the coding-agent fleet

## 16.1 Operating model

The **General** agent is the sole orchestrator and final integrator. It should maximize parallel work while protecting a small set of shared contracts from uncontrolled edits.

Every implementation subagent should work in its own branch or worktree and return:

- a concise summary of completed behavior;
- changed areas;
- assumptions made;
- tests run and results;
- screenshots for UI work;
- known limitations or integration risks.

Subagents must not add product scope, infrastructure, dependencies, or shared abstractions that are not required by this specification.

## 16.2 General agent responsibilities

The General agent must:

1. Read this specification and the existing persona-initialization skill before delegating.
2. Inspect current official Next.js, eve, OpenAI, and WebMCP documentation before locking implementation choices.
3. Establish the repository, development commands, environment-variable expectations, formatting, typechecking, and test baseline.
4. Define and freeze the minimal shared contracts needed for parallel work:
   - meeting phases;
   - participant roles;
   - public transcript events;
   - board-agent invocation capabilities;
   - session actions shared by UI and WebMCP;
   - readout sections;
   - error states.
5. Create mock fixtures so UI and orchestration work can proceed before live agents are integrated.
6. Assign module ownership and reject overlapping edits to shared files.
7. Integrate work in dependency order.
8. Review behavior against this product specification, not merely against passing tests.
9. Run the exact two-minute demo repeatedly in the target Codex browser environment.
10. Remove unnecessary abstractions and demo-irrelevant features before final submission.

Only General should make broad changes to root configuration, shared contracts, global application state, or cross-module APIs after the contract freeze.

## 16.3 Phase 0: Contract freeze and skeleton

**Owner:** General  
**Dependency:** None  
**Blocks:** Runtime integration, orchestration integration, WebMCP integration

Deliverables:

- Running Next.js/TypeScript app with eve integrated through the current supported path.
- Four empty product states: selection, briefing, meeting, readout.
- Shared session-action contract.
- Shared participant and transcript vocabulary.
- Mock board-member stream and mock final readout.
- Stable development, typecheck, build, and test commands.
- Clear ownership map for subagents.

This phase should be intentionally small. General should not build the full product before delegating.

## 16.4 Parallel workstream A: Guest catalog and onboarding

**Owner:** Catalog subagent  
**Can begin:** Immediately after skeleton  
**Primary dependency:** Static mock persona manifest

Responsibilities:

- Build the searchable guest catalog.
- Implement three-to-six selection behavior.
- Create board-member cards and selected states.
- Build the decision briefing step.
- Add the one-click demo decision.
- Lock selection after meeting start.
- Provide clean handoff into the shared meeting-session action.

Acceptance:

- Works entirely with mock persona metadata.
- Does not call models or scrape the web.
- Does not edit runtime, WebMCP, or orchestration internals.

## 16.5 Parallel workstream B: Boardroom UI

**Owner:** Boardroom UI subagent  
**Can begin:** Immediately after skeleton  
**Primary dependency:** Mock transcript/event stream

Responsibilities:

- Design and implement the skeuomorphic boardroom.
- Support human chair, three-to-six adviser seats, and one guest-agent seat.
- Implement seat states, current-speaker emphasis, reactions, and joining animation.
- Build the shared transcript and streaming presentation.
- Build the user composer and @mention interaction.
- Add Invite your agent and End Meeting controls as callbacks to shared actions.

Acceptance:

- Demonstrates the full visual flow using deterministic fixtures.
- Remains readable at the target laptop resolution.
- Does not implement model calls or WebMCP registration.

## 16.6 Parallel workstream C: Meeting session engine and orchestration

**Owner:** Orchestration subagent  
**Can begin:** After shared contract freeze  
**Primary dependency:** Shared session contract

Responsibilities:

- Implement phase transitions and ephemeral state.
- Launch private opening positions concurrently through an abstract runtime interface.
- Maintain transcript ordering and one-speaker-at-a-time streaming.
- Implement speaker selection, direct-mention priority, minimum participation, and deterministic fallback.
- Queue human and external-agent contributions.
- Implement reactions and next-turn interruption signals without extra decorative calls.
- Handle end-meeting transition and closing-comment collection.
- Provide a testable mock runtime.

Acceptance:

- Full meeting flow passes deterministic tests without live models.
- Session resets completely on page reload.
- No database or browser persistence.

## 16.7 Parallel workstream D: Eve board-agent runtime

**Owner:** Agent-runtime subagent  
**Can begin:** After shared invocation contract is frozen  
**Primary dependencies:** Eve integration, generated persona packages

Responsibilities:

- Discover and invoke a selected persona’s eve agent.
- Support four bounded capabilities:
  - form private opening position;
  - produce public discussion turn;
  - answer a direct question or rebuttal;
  - produce closing comment.
- Ensure each persona invocation receives isolated, sufficient context.
- Stream concise outputs to the meeting engine.
- Implement one automatic retry and clean error reporting.
- Configure OpenAI GPT models through the project’s current model configuration.

Acceptance:

- Two different personas invoked on the same prompt produce separate calls and meaningfully different outputs.
- Runtime does not perform live web research.
- Persona source bundles are not dumped wholesale into every turn.

## 16.8 Parallel workstream E: WebMCP integration

**Owner:** WebMCP subagent  
**Can begin:** After shared session actions are frozen  
**Primary dependency:** Mock session action adapter

Responsibilities:

- Register supported top-level imperative WebMCP tools.
- Implement inspect, join, contribute, address member, request synthesis, and retrieve readout capabilities.
- Ensure tool calls invoke the same state actions as the human UI.
- Build the invitation panel and copyable Codex prompt.
- Add external-agent identity, one-agent limit, authority rules, and clear tool results.
- Build a development test harness or automated adapter tests that invoke handlers without requiring Codex for every iteration.

Acceptance:

- All tool effects are visible in the mock boardroom.
- Tool registration is discoverable in the current Codex browser.
- No iframe or declarative-tool dependency for the demo.

## 16.9 Parallel workstream F: Secretary and executive readout

**Owner:** Readout subagent  
**Can begin:** Immediately with transcript fixtures  
**Primary dependency:** Readout contract

Responsibilities:

- Implement the internal synthesis agent.
- Generate required readout sections from fixture transcripts.
- Preserve majority, dissent, uncertainty, and attributed closing comments.
- Build the final readout UI and copy action.
- Make the final result available to the shared WebMCP retrieval action.
- Implement retry and simplified fallback.

Acceptance:

- No new facts appear beyond the supplied briefing and transcript.
- Divided boards remain visibly divided.
- The output is scannable and ready in the target time with the demo transcript.

## 16.10 Parallel workstream G: Persona generation fleet

**Owner:** Persona lead plus multiple persona-worker subagents  
**Can begin:** Immediately, independent of application code  
**Primary dependency:** Existing `initialize-board-member` skill

Responsibilities:

- Freeze the official eligible Senra guest roster.
- Divide guests into non-overlapping batches, ideally five to eight guests per worker.
- Run the initialization skill for every guest.
- Perform required primary-source research and persona distillation.
- Generate eve agent packages, UI metadata, source ledgers, and evaluations.
- Compare each persona against generic advice and existing board members.
- Resolve duplicate slugs, missing portraits, missing transcripts, and catalog inconsistencies.
- Produce one merged static catalog manifest only after every package passes.

Acceptance:

- Every catalog member maps to a discoverable agent package.
- The demo trio receives additional manual review and rehearsal.
- No worker edits another worker’s persona directory.
- Persona quality failures are fixed rather than hidden with generic fallback prompts.

## 16.11 Parallel workstream H: QA and demo harness

**Owner:** QA subagent  
**Can begin:** After mock contracts exist  
**Primary dependencies:** Mock runtime, shared session actions

Responsibilities:

- Build deterministic end-to-end tests for the four product states.
- Test selection bounds, direct mentions, queue ordering, meeting end, and reset-on-refresh.
- Test WebMCP handlers against the same session actions.
- Create the exact demo fixture and presenter checklist.
- Measure timing for opening positions, public turns, Codex sequence, and readout.
- Record failures, flaky behavior, and visual regressions.

Acceptance:

- The mock golden path passes in CI.
- The live golden path passes five consecutive rehearsals before submission.
- The WebMCP sequence is tested in the actual supported Codex browser, not only a mocked environment.

## 16.12 Optional late workstream I: Focused visual polish

**Owner:** Visual-polish subagent  
**Can begin:** Only after the complete vertical slice works  
**Dependency:** Integrated boardroom

Responsibilities are limited to:

- spacing, typography, materials, and depth;
- speaker and joining transitions;
- transcript readability;
- responsive behavior at the single target desktop range;
- elimination of obvious visual bugs.

This workstream must not redesign navigation, add new features, or destabilize the demo.

---

## 17. Integration order and gates

### Gate 1: Mock vertical slice

General integrates:

1. Session skeleton
2. Catalog/onboarding
3. Mock orchestration
4. Boardroom UI
5. Fixture readout

Exit criterion: the entire human flow works without models.

### Gate 2: Live board agents

General integrates:

1. Eve runtime
2. Three demo persona packages
3. Parallel opening positions
4. Live discussion turns
5. Closing comments and synthesis

Exit criterion: the exact demo board completes a meeting and produces a readout.

### Gate 3: WebMCP

General integrates:

1. WebMCP session adapter
2. Invitation panel
3. External guest seat
4. Interim synthesis
5. Final readout retrieval

Exit criterion: Codex completes the full sequence on the live page.

### Gate 4: Full roster

General integrates the complete static guest manifest and all persona packages.

Exit criterion: every displayed guest can be selected and invoked successfully.

### Gate 5: Demo hardening

- Remove dead code and nonessential dependencies.
- Tighten response length and pacing.
- Verify the demo fixture and Codex-only context.
- Run five consecutive live rehearsals.
- Capture a backup recording after the live flow is stable.

---

## 18. General agent final review checklist

Before declaring the MVP complete, General must answer **yes** to every item:

### Product

- Does this unmistakably feel like a board meeting rather than a generic group chat?
- Are the board members genuinely separate agents?
- Do they form independent views before public discussion?
- Does the meeting show material difference or disagreement?
- Can the user chair the room through @mentions and meeting conclusion?
- Is the final readout useful even when the board is divided?

### Scope

- Is there no authentication?
- Is there no database or persistence?
- Does refresh start over?
- Are voice, files, memory, payments, and remote rooms absent?
- Has every nonessential setting or abstraction been removed?

### WebMCP

- Can Codex discover the tools in the actual demo environment?
- Does Codex choose its own name?
- Is joining visually obvious?
- Do Codex’s contributions update the same live transcript?
- Can it direct a question to a board member and receive an answer?
- Can it request interim synthesis but not end the meeting?
- Can it retrieve the exact final readout?

### Reliability

- Does the exact two-minute script fit within the allotted time?
- Has it completed five consecutive fresh-session runs?
- Are model and tool failures recoverable without a refresh?
- Are all demo content, names, portraits, and prompts final?
- Does the Vercel deployment behave the same as local development?

---

## 19. Future work, not MVP backlog

These ideas should be mentioned in project storytelling but must not enter the MVP build unless every acceptance criterion above is already complete:

- Persistent board and user memory.
- Repeat meetings and decision follow-ups.
- Outcome tracking and retrospective evaluation.
- Voice-first board meetings.
- User-created and licensed adviser personas.
- Personal context connectors and file ingestion.
- Multiple external agents or human participants.
- Shareable, synchronized remote meeting rooms.
- Decision journals and searchable history.
- Broader life and career onboarding.

---

## 20. Reference baseline for implementers

Implementation agents should verify current primary documentation at build time, especially because these projects are evolving quickly:

- David Senra guest roster: https://www.davidsenra.com/guests
- David Senra podcast: https://www.davidsenra.com/podcast
- Vercel eve: https://vercel.com/eve
- Vercel eve Next.js guide: https://github.com/vercel/eve/blob/main/docs/guides/frontend/nextjs.mdx
- OpenAI Codex site tools / WebMCP: https://developers.openai.com/codex/webmcp
- WebMCP proposal: https://github.com/webmachinelearning/webmcp
- Existing persona skill: `best-board-meeting/initialize-board-member/SKILL.md`

The specification’s functional requirements take priority over examples or optional capabilities found in those references.
