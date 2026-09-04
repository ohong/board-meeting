# The Best Board Meeting You’ve Ever Had

Convene three to six AI advisers modeled on David Senra guests, chair a live board meeting, and leave with an executive readout.

This is an ephemeral demo. Refresh starts a new session. There is no auth, database, or saved history.

## Stack

Next.js App Router, TypeScript, bun, Vercel eve, OpenAI GPT models (`gpt-5.6-luna` for board turns, `gpt-5.6-terra` for the secretary).

## Setup

```bash
bun install
bun dev
```

Open http://localhost:3000. The app lands on **Choose your board**.

### Live board members

Set `OPENAI_API_KEY` in the environment (local `.env.local` or Vercel project env). Without it, the app shows a setup banner and runs a deterministic mock so the room, orchestration, and WebMCP tools can still be tested.

Do not commit secrets.

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
