# Devpost submission kit

Deadline: **September 4, 2026, 1:00 AM PDT**. Judging runs to September 21, 5:00 PM PT; the live app must stay free and testable until then.

Checklist (from the challenge page):
- [ ] Live Cloudflare Workers URL with `OPENAI_API_KEY` configured as a Worker secret.
- [ ] Public GitHub repo with the MIT `LICENSE` visible in the repo sidebar (GitHub detects it automatically).
- [ ] Demo video: public YouTube, under 3 minutes, with audio.
- [ ] Text description (below).
- [ ] Testing instructions for judges (below; the private field on Devpost).

---

## Project name

The Best Board Meeting You've Ever Had

## Tagline

Convene a board of AI advisers modeled on David Senra's guests, chair a live meeting, and let your own agent take a seat through WebMCP.

## Description (paste into Devpost)

**What it is.** A founder facing a consequential decision picks three to six advisers from a library of notable founders, investors, and operators interviewed on David Senra's show. Each adviser is a separate agent with its own source-grounded worldview, expertise, voice, and blind spots. The founder writes a briefing, enters a boardroom, and the advisers form independent positions in parallel before a free-flowing discussion: they challenge the premise, rebut one another, react, ask the founder questions, and change their minds when persuaded. The founder chairs the room with @mentions and ends the meeting when ready. A secretary agent then produces an executive readout: recommendation (or an honest account of a divided board), options, tradeoffs, assumptions, open questions, next actions, and each member's closing comment.

**Why WebMCP.** A board meeting is only as good as the context in the room. The founder's own agent usually knows things the board does not: numbers, history, private context from other conversations. Through WebMCP the page exposes eight narrowly scoped site tools. An agent can list advisers and launch a complete shareable meeting itself, or open the unique invitation URL for a human-launched meeting, inspect it, join under its own name, contribute context it already holds, address a specific board member, request an interim synthesis, and retrieve the final readout after the human ends the meeting. No custom integration and no scraping the transcript out of the DOM: the chair and agent operate on the same revisioned room.

**What becomes possible for humans and agents together.** The human stays chair: only the human can end the meeting. The agent is a participant, not a puppeteer: it cannot edit messages, impersonate anyone, or change the roster. Everything the agent does is visible in the boardroom as it happens (a seat that materializes, a labeled contribution, a question that gets answered by the adviser it was aimed at). The readout the agent retrieves is the exact readout on screen, so the human's chief of staff walks away with the same memo.

**Site tools.** `list_board_advisers`, `launch_board_meeting`, `inspect_board_meeting` (read-only, paginated transcript window), `join_board_meeting` (agent supplies its own display name; one guest per meeting), `contribute_to_board_meeting`, `address_board_member` (the addressed adviser answers next), `request_board_synthesis` (interim agreement / disagreement / open question), and `get_board_meeting_readout` (returns a not-ready status until the human ends the meeting). Results are compact JSON under 1,450 characters, errors are returned as data so the agent can self-correct, and every tool is registered from the top-level page with `document.modelContext.registerTool` (see `components/webmcp/webmcp-tools.tsx`).

**How it is built.** Next.js 16 (App Router, TypeScript, Tailwind v4) on Cloudflare Workers. Board members run on OpenAI GPT-5.6 through the Vercel AI SDK: each adviser is an isolated invocation with its own persona instructions, its private opening position, and only the public transcript. Speaker selection is deterministic over model-reported reactions: after every turn, the other members each report a reaction and an urgency to speak; the engine honors @mentions first, then rebuttals, then members who have not spoken, and never lets anyone speak a third time before everyone has spoken once. Persona packages live in `agent/subagents/<slug>/` using Vercel eve's declared-subagent layout (`agent.ts` + `instructions.md`), distilled from each guest's Senra interview transcript and primary sources. Each unique room is retained in a SQLite-backed Cloudflare Durable Object for 24 hours; there is no account system.

## Testing instructions (private field)

1. Open the live URL in the ChatGPT desktop app's built-in browser (Settings → Browser → Permissions → Enable site tools; model GPT-5.6 Sol or Terra) or in Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.
2. Select Daniel Ek, David Heinemeier Hansson, and Lulu Cheng Meservey in that order (or any 3–6). Selection order sets seat order; the first seat opens the discussion and is the member the invitation asks your agent to question. Click "Use example decision", then "Start Board Meeting".
3. Watch the three seats form independent positions, then discuss. Type `@Lulu how would you explain this change to users?` to call on a member.
4. Click "Invite your agent", copy the invitation, and paste it into the agent. The invitation contains the unique meeting URL, so the agent can open the shared room from its own browser before calling `inspect_board_meeting`, `join_board_meeting`, `contribute_to_board_meeting`, `address_board_member`, and `request_board_synthesis`; each action is visible to the chair.
5. Click "End meeting". The Executive Memo appears; the agent can call `get_board_meeting_readout` to retrieve it (before that it returns `NOT_READY`).
6. Chrome: DevTools → Application → WebMCP lists the eight tools and lets you invoke them manually. A dev harness is also at `/dev/webmcp`.
7. Append `?runtime=mock` to the URL to run a deterministic scripted board without model calls.

## Presenter script (2:00)

| Time | Beat | Say |
|---|---|---|
| 0:00 | Selection screen, search "Ek", "DHH", "Lulu"; select in that order (first seat opens and is the one your agent will question). | "Most founders never get the board they'd want. This lets you convene one." |
| 0:15 | Briefing: click "Use example decision", skim, "Start Board Meeting". | "Should we kill our free tier? Here's the real context." |
| 0:25 | Seats pulse "Thinking…", flip to Ready. | "Each adviser forms an independent view before hearing anyone else. No groupthink." |
| 0:40 | Discussion streams; the first-selected member opens, a peer rebuts (interruption marker), reactions on seats. | "Separate agents, real disagreement." Then type `@Lulu how do we explain a free-tier change without losing user trust?` Lulu answers directly. |
| 1:15 | Click "Invite your agent", copy, paste into Codex (ChatGPT desktop browser, already on the page). | "My own agent knows something the board doesn't." Codex inspects, joins (seat materializes), contributes the enterprise-referral context, asks Daniel, Daniel answers, Codex requests a synthesis. |
| 1:45 | Click "End meeting". The Executive Memo appears. Codex calls `get_board_meeting_readout`; the page shows "Retrieved by … via WebMCP". | "The human ends the meeting; the agent carries away the same memo." |

Codex-only private context to seed in the Codex conversation BEFORE recording (the app must not contain it):

> Seven of our last ten enterprise wins first entered through a free workspace shared by an existing user. Those accounts now represent 22% of ARR.

## Verification log (2026-09-03)

- Mock golden path in the ChatGPT desktop browser: all eight tools discovered; WebMCP launched a unique room, a second browser tab joined as Codex, its contribution and focused question appeared once in the chair tab, Doug Leone answered, a requested synthesis appeared, and the final readout retrieval was recorded after the chair ended the meeting.
- Live golden path (gpt-5.6-terra / luna / sol): opening positions in parallel (~5–7 s), member turns 2–3 s each, reaction pass 1–3 s, Daniel Ek answered Codex using the enterprise-referral context, synthesis attributed views by name, readout retrieved through the tool after End Meeting.
- Note for Chrome's `executeTool`: it accepts the input as a JSON string (a plain object was rejected with "Failed to parse input arguments"). Agents (ChatGPT/Codex) handle this themselves.
- `bun run preview` serves the custom Worker and Durable Object on workerd; typecheck, lint, and all 44 tests pass.

## Known limitations to state honestly

- Personas are simulations distilled from public interviews and writing; they are not endorsements by the people represented. Portraits are the show's published guest portraits.
- Sixteen advisers are available at launch (three demo advisers researched in depth); the full Senra roster is 36 guests.
- One external agent per meeting; rooms expire after 24 hours; the chair tab hosts live model orchestration and must remain open during discussion; desktop layout only.
