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
still work — a banner says so, and the stand-in only has a script for the worked example.
Never commit the key.

`OPENAI_BASE_URL` points the provider at a compatible endpoint (a proxy, a gateway, or the
stub server the live-runtime tests run against).

Board turns run on `openai/gpt-5.6-luna` for latency; the secretary runs on
`openai/gpt-5.6-terra`. Each model is declared in that agent's own `agent.ts`.

### Checks

```bash
bun run test        # 153 deterministic tests, no live API calls
bun run typecheck
bun run lint
bun run build
bun run personas    # regenerate lib/personas.generated.ts after editing an agent package
```

```bash
bunx playwright install chromium   # once
bun run rehearse                   # five fresh-session runs of the full demo script
```

`tests/live-runtime.test.ts` drives the real live runtime — the real provider, the real
streaming transport, the real parsing — against a stub OpenAI Responses API, so the live
code path actually executes without a key.

### Rehearsing the live path

`bun run rehearse` on its own exercises the deterministic stand-in. To put the whole live
path under the same 26 checks — the API route's SSE encoding, the browser's event-stream
reader, the provider, the streaming transport and the control-line parsing — run the
rehearsal against a stub Responses API that answers in the board's voice:

```bash
bun run stub                                                   # terminal 1, port 8787
OPENAI_API_KEY=stub OPENAI_BASE_URL=http://127.0.0.1:8787 bun dev   # terminal 2
bun run rehearse                                               # terminal 3
```

`/api/runtime-status` reports `{"live":true}` when the app is on that path. The stub
scripts three advisers through two turns each, a closing comment, an interim synthesis and
a readout, so a run covers the same ground as the demo.

### Local fal.ai image-to-video

Create an **API**-scoped key at [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys), then add it to the repository-root `.env.local`:

```dotenv
FAL_KEY=your-key-here
```

Preview and validate a request locally without using the key or network:

```bash
bun run video:generate -- --image ./starting-frame.png --prompt "Slow first-person push toward a black-and-white boardroom table" --duration 10 --dry-run
```

Remove `--dry-run` to submit to `minimax/h3-max/image-to-video`. Local PNG, JPG, JPEG, WEBP, GIF, and AVIF files are encoded as data URIs; public HTTPS image URLs also work. Duration is 5–15 seconds, resolution is `480P` or `768P`, and `--end-image` supplies an optional final keyframe.

```bash
bun run video:generate -- --image ./first.png --end-image ./last.png --prompt "The camera glides between the advisers" --duration 10 --resolution 768P --output ./exports/fal-video/boardroom.mp4
```

The command prints and saves the request ID before polling. If it stops before the video downloads, use the printed command to resume without submitting or paying for a second generation:

```bash
bun run video:generate -- --request-id <request-id>
```

By default, the MP4 and its `.fal.json` request metadata are saved under `exports/fal-video/`. Existing MP4 files are never overwritten. Run `bun run video:generate -- --help` for every option.

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

1. **Choose your board** — search the roster by name, company or by the judgment you want
   in the room ("pricing", "trust", "focus"); the miniature table fills as you seat people.
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

## Screens and widths

The meeting is composed for a laptop: the room takes about two thirds of the width and the
paper minutes rail the rest. Below that the room becomes a compact roster — the same people,
states and agenda, without the table geometry — and the page scrolls normally. No viewport
overflows horizontally.

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
