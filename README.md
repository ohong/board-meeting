# The Best Board Meeting You've Ever Had

Convene a personal board of three to six AI advisers modeled on David Senra's podcast guests, brief them on one consequential decision, chair a live meeting around a virtual table, and leave with an executive readout. Through **WebMCP**, your own agent (Codex in the ChatGPT desktop browser, or any agent in a WebMCP-capable browser) can take a seat at the same table: inspect the meeting, join under its own name, contribute context, question a board member, request a synthesis, and retrieve the final readout.

Built for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com/). MIT licensed.

## How it works

1. **Choose your board.** A searchable catalog of advisers. Each is a separate agent package distilled from the guest's Senra interview transcript and primary sources (see `agent/subagents/`).
2. **Brief your board.** One free-form briefing. "Use example decision" loads the demo: should a B2B collaboration app kill its free tier?
3. **Board meeting.** Every member forms a private opening position in parallel, then the room opens. Members rebut one another, react on their seats, ask the chair questions, and change position when persuaded. The chair calls on anyone with `@Name`.
4. **Invite your agent.** Copy the invitation into your agent. It discovers the page's six site tools and joins the guest seat; everything it does is visible in the room.
5. **End meeting.** Closing comments are collected and a secretary agent writes the readout: recommendation (with dissent preserved), options, tradeoffs, assumptions, open questions, next actions, closing comments. Your agent can retrieve the same readout.

Nothing is persisted. Refreshing the page starts a new session.

## WebMCP site tools

Registered from the top-level page in [`components/webmcp/webmcp-tools.tsx`](components/webmcp/webmcp-tools.tsx) with `document.modelContext.registerTool(...)` (with a `navigator.modelContext` fallback), unregistered via `AbortSignal`, and routed to the same `MeetingSession` actions the human UI uses:

| Tool | Effect |
|---|---|
| `inspect_board_meeting` | Read-only: briefing, phase, board, participants, bounded recent transcript window (paged with `transcript_offset`), readout readiness. |
| `join_board_meeting` | Take the single guest seat under the agent's own `display_name`. |
| `contribute_to_board_meeting` | Add context to the shared transcript; the board responds in later turns. |
| `address_board_member` | Put a question to a named member, who answers on the next turn. |
| `request_board_synthesis` | Secretary posts an interim agreement / disagreement / unresolved-question synthesis (optionally `wait_seconds` to receive the text). |
| `get_board_meeting_readout` | Returns the readout after the human ends the meeting; before that, a clear `NOT_READY` status. |

Every result is a compact JSON object under 1,450 characters; errors are returned as data (`{ ok: false, error: { code, message } }`) so the agent can self-correct. There is deliberately no tool to end the meeting: only the human chair can.

## Running locally

```bash
bun install
cp .env.example .env.local   # add OPENAI_API_KEY
bun run dev                  # http://localhost:3000
```

- `?runtime=mock` on the URL runs a deterministic scripted board with no model calls.
- `/dev/fixtures?fixture=discussion` renders UI fixtures for each phase; `/dev/webmcp` is a harness that invokes the tool handlers directly.
- `bun run typecheck`, `bun run test` (vitest: session, engine with mock runtime, WebMCP tools), `bun run lint`.

### Testing the WebMCP tools

- **Chrome 149+**: enable `chrome://flags/#enable-webmcp-testing`, open the app, then DevTools → Application → WebMCP lists the six tools and lets you invoke them manually.
- **ChatGPT desktop app**: Settings → Browser → Permissions → Enable site tools (GPT-5.6 Sol or Terra). Open the app with `@Browser <url>`, click "Invite your agent", and paste the invitation into the chat.

## Architecture

- **Next.js 16 App Router, TypeScript, Tailwind v4.** State lives only in the page: `lib/meeting/session.ts` is the single deterministic store (phases, selection limits, transcript ordering, queueing, chair-only authorization). `lib/meeting/engine.ts` runs the meeting loop.
- **Separate agents per seat.** Each turn is an isolated invocation with that member's `instructions.md` as the system prompt, its private opening position, its own prior statements, and the public transcript. Members never see one another's private positions.
- **Speaker selection** is deterministic over model-reported signals: after each turn, the other members each report a reaction and an urgency to speak (`/api/board/react`, one batched request). Priority: a direct @mention or guest address, then a material rebuttal (shown as an interruption), then members who have not spoken, then urgency. Nobody speaks a third time before everyone has spoken once, and nobody takes two consecutive turns unless called on.
- **Models.** OpenAI via the Vercel AI SDK (`ai`, `@ai-sdk/openai`): `gpt-5.6-terra` for member turns, `gpt-5.6-luna` for reactions, `gpt-5.6-sol` for the readout. Override with `BOARD_MODEL`, `BOARD_FAST_MODEL`, `BOARD_READOUT_MODEL`.
- **Persona packages** live in `agent/subagents/<slug>/` using Vercel eve's declared-subagent layout (`agent.ts` + `instructions.md`) plus `persona.json` for the catalog and a `research/` ledger. The app reads them from disk at runtime; the same tree is discoverable by `eve`. See [`docs/persona-package.md`](docs/persona-package.md).

### A note on eve

The product spec called for Vercel eve as the agent framework. eve (v0.51, beta) has no in-process runtime: agents run in a separate server with durable sessions, which is the wrong shape for many short, parallel, isolated invocations streamed into one page. The app therefore uses the AI SDK directly and keeps the persona packages eve-compatible so the board members remain discoverable as eve subagents.

## Deploying

Standard Vercel deployment. Set `OPENAI_API_KEY` in the project environment. `next.config.ts` includes `agent/**` in output file tracing so persona packages ship with the serverless functions.

## Limitations and provenance

- Advisers are simulations distilled from public interviews and writing. They are not endorsements by, or statements of, the people represented. Portraits are the show's published guest portraits.
- Eleven advisers are available at launch; the demo trio (Daniel Ek, David Heinemeier Hansson, Lulu Cheng Meservey) received the deepest research.
- One external agent per meeting, desktop layout, no persistence.

See [`docs/mvp-specs.md`](docs/mvp-specs.md) for the full product specification and [`docs/submission.md`](docs/submission.md) for the demo script.
