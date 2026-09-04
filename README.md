# The Best Board Meeting You’ve Ever Had

Convene three to six AI advisers modeled on David Senra guests, chair a live board meeting, and leave with an executive readout.

This is an ephemeral demo. Refresh starts a new session. There is no auth, database, or saved history.

## Stack

Next.js App Router, TypeScript, bun, Vercel eve, and OpenAI GPT models (`gpt-5.6-terra` for the routing root and `gpt-5.6-luna` for board members and the secretary).

## Setup

```bash
bun install
bun dev
```

Open http://localhost:3000. The app lands on **Choose your board**.

### Live board members

Set `OPENAI_API_KEY` in local `.env.local`. Without it, the app identifies itself as demo mode and runs a deterministic mock so the room, orchestration, and WebMCP tools can still be tested. With a key in local development, each capability is routed through an isolated Eve adviser or secretary subagent. The unauthenticated MVP deliberately keeps public and Vercel deployments in mock mode until a real identity and abuse-control boundary exists; the server-side Eve client is ready to use same-project Vercel OIDC when that gate is added.

Do not commit secrets.

```bash
bun test
bun run typecheck
bun run build
```

## Demo trio

Search for Daniel Ek, DHH / David Heinemeier Hansson, and Lulu Cheng Meservey. Use **Use example decision**, then **Start Board Meeting**.

## WebMCP

The top-level page registers six site tools:

- `inspect_board_meeting`
- `join_board_meeting`
- `contribute_to_board_meeting`
- `address_board_member`
- `request_board_synthesis`
- `get_board_meeting_readout`

**Invite your agent** copies a prompt. The joining agent supplies its own name. Guests cannot end the meeting.
