# The Best Board Meeting You've Ever Had

Convene three to six AI advisers modelled on David Senra's podcast guests, chair a live
board meeting about a decision you actually have to make, and leave with an executive
readout. Your own agent can take a seat at the table through WebMCP.

Every seat is a genuinely separate agent with its own source-grounded persona package, its
own private opening position, and its own model call. It is not one model performing a
whole table.

The session is ephemeral by design: no accounts, no database, no browser storage. A refresh
starts a new meeting.

## Run it

```bash
bun install
bun dev          # http://localhost:3000 — opens on "Choose your board"
```

### Live advisers

Set `OPENAI_API_KEY` in `.env.local` (or the Vercel project environment). Without one the
app runs a deterministic stand-in so the room, the orchestration and the WebMCP tools all
still work — a banner says so. Never commit the key.

Board turns run on `openai/gpt-5.6-luna` for latency; the secretary runs on
`openai/gpt-5.6-terra`. Each model is declared in that agent's own `agent.ts`.

### Checks

```bash
bun run test        # 133 deterministic tests, no API calls
bun run typecheck
bun run lint
bun run build
bun run personas    # regenerate lib/personas.generated.ts after editing an agent package
```

```bash
bunx playwright install chromium   # once
bun run rehearse                   # five fresh-session runs of the full demo script
```

## The agents

Every adviser is authored as an eve subagent:

```
agent/
├── instructions.md               # what this agent root is for
└── subagents/
    ├── daniel-ek/
    │   ├── agent.ts              # model + the description used to pick a seat
    │   ├── instructions.md       # the always-on prompt: worldview, heuristics, voice, conduct
    │   ├── research.md           # maintainer-facing evidence ledger, never in the prompt
    │   └── evaluation.md         # comparative cases and verification boundaries
    ├── … 35 more advisers …
    └── secretary/                # synthesis and the readout; never holds a seat
```

Packages are produced by `.claude/skills/init-board-member/` and grounded in each guest's
David Senra interview transcript plus primary sources. Each is self-contained — nothing is
appended at runtime.

`scripts/build-personas.mjs` compiles those packages into `lib/personas.generated.ts`, which
is committed so the persona text ships with the deployment instead of being read off disk at
request time. The packages are the source of truth; `bun run test` fails if the two drift.

Each board member's system prompt is their own `instructions.md`, verbatim. No member ever
receives another member's private opening position — they learn each other's positions only
from the public transcript.

`withEve()` can additionally mount the eve runtime at `/eve/v1/*` so the same agents can be
addressed through eve directly. It is off by default (`EVE_MOUNT=1` turns it on) because
mounting it makes `next dev` require Node >= 24 and AI Gateway credentials, and hard-fails
without them.

## How a meeting runs

1. **Choose your board** — search the frozen roster and seat three to six advisers; the
   miniature table fills as you go.
2. **Brief your board** — one free-form decision. Links stay plain text; nothing is fetched.
3. **Board meeting** — every adviser forms a private opening position in parallel, then the
   room opens. Turns stream one at a time. Advisers react, rebut, ask each other for the
   floor, change their minds, and pass when they have nothing to add. You can call on anyone
   with `@Name` or by clicking their seat.
4. **Executive readout** — closing comments from every adviser, then a chief-of-staff memo
   that preserves dissent rather than manufacturing consensus.

Speaker selection is deterministic: a direct mention wins, then an adviser another adviser
asked to hear from, then anyone who has not spoken, then the quietest voice — with a
fairness guard so no one can be handed the room.

## WebMCP

The top-level page registers six site tools on `document.modelContext`:

| Tool | What it does |
|---|---|
| `inspect_board_meeting` | Read the briefing, phase, seats, transcript, readout status |
| `join_board_meeting` | Take the guest seat under a name the agent chooses itself |
| `contribute_to_board_meeting` | Add context to the public record |
| `address_board_member` | Put a question to one adviser, who answers next |
| `request_board_synthesis` | Ask the secretary where the board currently stands |
| `get_board_meeting_readout` | Retrieve the final memo once the chair has ended the meeting |

Every tool calls the same session action the human interface calls, so there is one
transcript. The guest cannot change the roster, edit prior messages, impersonate anyone, or
end the meeting. **Invite your agent** generates a copyable prompt that names a seated
adviser and never dictates the guest's display name.

## Portraits

Twelve advisers, including the demo trio, have a bundled portrait in `public/guests/`,
carried over from the `site/` prototype. They are normalised to one low-saturation
treatment so mismatched source photography does not fragment the room, and the speaking
seat gains luminance rather than colour. The other twenty-four fall back to a typographic
monogram in the same frame.

Those images have no explicit reuse licence — `site/DECISIONS.md` records the same caveat.
They are fine for evaluating the concept; get permission or replace them before any public
launch.

## Design

The visual system follows `design/design-engineer-instructions.md`: paper mode for
selection, briefing and the readout; room mode for the live meeting, with the paper minutes
rail inside the dark room as the bridge between them. Advisers are told apart by name, role
and behaviour rather than by colour, and the two semantic accents mean one thing each —
human action and guest agent.

## Demo

Search for **Daniel Ek**, **DHH**, and **Lulu Cheng Meservey**, click **Use example
decision**, then **Start Board Meeting**. `docs/demo-script.md` has the full presenter
checklist.
