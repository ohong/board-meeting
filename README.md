# The Best Board Meeting You've Ever Had

Convene a personal board of three to six AI advisers modeled on David Senra's podcast guests, brief them on one consequential decision, chair a live meeting around a virtual table, and leave with an executive readout. Through **WebMCP**, an agent can launch the entire meeting itself or take a seat in a meeting launched by a person: inspect it, join under its own name, contribute context, question a board member, request a synthesis, and retrieve the final readout.

Built for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com/). MIT licensed.

## How it works

1. **Choose your board.** A searchable catalog of advisers. Each is a separate agent package distilled from the guest's Senra interview transcript and primary sources (see `agent/subagents/`).
2. **Brief your board.** One free-form briefing. "Use example decision" loads the demo: should a B2B collaboration app kill its free tier?
3. **Board meeting.** Every member forms a private opening position in parallel, then the room opens. Members rebut one another, react on their seats, ask the chair questions, and change position when persuaded. After a bounded opening discussion the board waits for the chair; a chair or guest contribution wakes another short burst. The chair calls on anyone with `@Name`.
4. **Invite your agent.** Starting a meeting creates a unique `/m/<room-id>` link. Copy the generated invitation into your agent; it opens that link, discovers the page's eight site tools, and joins the guest seat from its own browser. Everything it does is visible in the chair's room.
5. **End meeting.** Closing comments are collected and a secretary agent writes the readout: recommendation (with dissent preserved), options, tradeoffs, assumptions, open questions, next actions, closing comments. Your agent can retrieve the same readout.

Shared rooms are stored in a Cloudflare Durable Object for 24 hours. The unguessable room URL is the guest capability; a separate chair key remains in the launching tab's `sessionStorage` and is never included in invitations or public room responses.

## WebMCP site tools

Registered from the top-level page in [`components/webmcp/webmcp-tools.tsx`](components/webmcp/webmcp-tools.tsx) with `document.modelContext.registerTool(...)` (with a `navigator.modelContext` fallback), unregistered via `AbortSignal`, and routed to the same `MeetingSession` actions the human UI uses:

| Tool | Effect |
|---|---|
| `list_board_advisers` | Read-only: list the available advisers and stable ids for meeting creation. |
| `launch_board_meeting` | Select 3–6 advisers, submit the decision briefing, start the board, and return its unique room URL. |
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
cp .env.example .dev.vars    # add OPENAI_API_KEY=sk-...
bun run dev                  # http://localhost:3000
```

- `?runtime=mock` on the URL runs a deterministic scripted board with no model calls.
- `/dev/fixtures?fixture=discussion` renders UI fixtures for each phase; `/dev/webmcp` is a harness that invokes the tool handlers directly.
- `bun run typecheck`, `bun run test` (vitest: session, engine with mock runtime, WebMCP tools), `bun run lint`.

### Testing the WebMCP tools

- **Chrome 149+**: enable `chrome://flags/#enable-webmcp-testing`, open the app, then DevTools → Application → WebMCP lists the eight tools and lets you invoke them manually.
- **ChatGPT desktop app**: Settings → Browser → Permissions → Enable site tools (GPT-5.6 Sol or Terra). Open the app with `@Browser <url>`, click "Invite your agent", and paste the invitation into the chat.

## Architecture

- **Next.js 16 App Router, TypeScript, Tailwind v4.** `lib/meeting/session.ts` is the deterministic client projection (phases, selection limits, transcript ordering, queueing, chair-only authorization), while `lib/meeting/engine.ts` runs the meeting loop in the chair's tab.
- **Shared rooms.** `lib/server/board-meeting-room.ts` stores each meeting in its own SQLite-backed Cloudflare Durable Object. The chair publishes revisioned snapshots; agent actions are applied atomically and concurrent guest input is merged until the chair acknowledges it. Invited views poll the same canonical room and cannot invoke chair UI actions. Rooms expire after 24 hours.
- **Separate agents per seat.** Each turn is an isolated invocation with that member's `instructions.md` as the system prompt, its private opening position, its own prior statements, and the public transcript. Members never see one another's private positions.
- **Speaker selection** is deterministic over model-reported signals: after each turn, the other members each report a reaction and an urgency to speak (`/api/board/react`, one batched request). Priority: a direct @mention or guest address, then a material rebuttal (shown as an interruption), then members who have not spoken, then urgency. Nobody speaks a third time before everyone has spoken once, and nobody takes two consecutive turns unless called on.
- **Models.** OpenAI via the Vercel AI SDK (`ai`, `@ai-sdk/openai`): `gpt-5.6-terra` for member turns, `gpt-5.6-luna` for reactions, `gpt-5.6-sol` for the readout. Override with `BOARD_MODEL`, `BOARD_FAST_MODEL`, `BOARD_READOUT_MODEL`.
- **Persona packages** live in `agent/subagents/<slug>/` using Vercel eve's declared-subagent layout (`agent.ts` + `instructions.md`) plus `persona.json` for the catalog and a `research/` ledger. They are compiled into the app at build time by `scripts/gen-personas.mjs`; the same tree is discoverable by `eve`. See [`docs/persona-package.md`](docs/persona-package.md).

### A note on eve

The product spec called for Vercel eve as the agent framework. eve (v0.51, beta) has no in-process runtime: agents run in a separate server with durable sessions, which is the wrong shape for many short, parallel, isolated invocations streamed into one page. The app therefore uses the AI SDK directly and keeps the persona packages eve-compatible so the board members remain discoverable as eve subagents.

## Deploying

Deployed to Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare):
<https://board-meeting.shjavokhir1.workers.dev>

```bash
bun run preview   # build + serve in the local Workers runtime (workerd)
bun run deploy    # build + deploy
```

The API key is a Worker secret, never an `.env` value: OpenNext inlines every `.env*` file
into the deployed bundle, so the key would otherwise ship inside the artifact.

```bash
bunx wrangler secret put OPENAI_API_KEY   # production
```

Locally, put it in `.dev.vars` (gitignored). `initOpenNextCloudflareForDev()` in
`next.config.ts` makes `next dev` read it from there too, so `.env.local` needs no key.

Persona packages are compiled into `lib/server/personas.generated.ts` at build time by
`scripts/gen-personas.mjs` (wired to `prebuild`/`predev`). Workers has no runtime
filesystem — `process.cwd()` is `/bundle` — so reading `agent/subagents/**` per request
would leave the board with an empty catalog in production. Add or edit a persona and the
next `dev`/`build` picks it up; run `bun run gen:personas` to refresh by hand.

See [`docs/deployment.md`](docs/deployment.md) for the full deploy runbook: smoke checks,
secret handling, rollback, and the Workers constraints to keep in mind when changing
server code.

## Limitations and provenance

- Advisers are simulations distilled from public interviews and writing. They are not endorsements by, or statements of, the people represented. Portraits are the show's published guest portraits.
- Sixteen advisers are available at launch; the demo trio (Daniel Ek, David Heinemeier Hansson, Lulu Cheng Meservey) received the deepest research.
- One external agent per meeting; shared rooms expire after 24 hours; the chair tab must remain open while the model-driven discussion is running; desktop layout.

See [`docs/mvp-specs.md`](docs/mvp-specs.md) for the full product specification, [`docs/deployment.md`](docs/deployment.md) for the deploy runbook, and [`docs/submission.md`](docs/submission.md) for the demo script.
