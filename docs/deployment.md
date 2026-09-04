# Deployment

The board runs on **Cloudflare Workers**, built by
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).

| | |
| --- | --- |
| Live | <https://board-meeting.shjavokhir1.workers.dev> |
| Worker | `board-meeting` |
| Account | Shjavokhir1@gmail.com's Account (`e061681135511555beedcbeafd0900d9`) |
| Config | [`wrangler.jsonc`](../wrangler.jsonc), [`open-next.config.ts`](../open-next.config.ts) |
| Shared rooms | `BOARD_MEETINGS` Durable Object; SQLite storage; 24-hour alarm expiry |

## Shipping a change

```bash
bun run typecheck && bun run lint && bun run test   # 1. gates
bun run preview                                     # 2. workerd on :8787
bun run deploy                                      # 3. ship
```

Then confirm it is actually live — the smoke checks below.

**Do not skip step 2.** `next dev` and `next build` both run on Node, where things work that
do not work on Workers. `bun run preview` runs the real Workers runtime (workerd) against the
real bundle, and it is the only local step that catches the failure modes in
[Workers constraints](#workers-constraints). It reads `.dev.vars`, so live model calls work.

`preview` and `deploy` both rebuild first, so there is no separate build step.

The Next/OpenNext build currently prints an internal-Durable-Object warning while it
runs the temporary Next development worker. The deployed entrypoint is
`custom-worker.ts`, which exports `BoardMeetingRoom`; the meaningful local check is that
the final workerd preview reports the `BOARD_MEETINGS` binding and a POST to `/api/rooms`
returns `201`.

## Smoke checks

Against `https://board-meeting.shjavokhir1.workers.dev` after each deploy:

```bash
URL=https://board-meeting.shjavokhir1.workers.dev

# Catalog renders all 16 advisers. A count of 6 means the persona loader broke
# and fell back to fixtures — see "Silent failure" below.
curl -s "$URL/" | grep -oE '/portraits/[a-z-]+\.webp' | sort -u | wc -l

# Portraits optimize through the Images binding -> 200, image/webp
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' \
  "$URL/_next/image?url=%2Fportraits%2Fdaniel-ek.webp&w=256&q=75"

# Origin guard -> 403
curl -s -X POST "$URL/api/board/turn" -H 'Origin: https://evil.example.com' \
  -H 'Content-Type: application/json' -d '{}' -w '\n%{http_code}\n'

# A normal UI-launched meeting should replace the address bar with /m/<12-char-id>.
# Open that exact URL in a second browser context: it must show the same transcript
# as a guest view, and its public GET response must not contain a chairKey field.

# CSS actually shipped: live stylesheet must be byte-identical to the build.
# Catches a stale build cache silently deploying the previous theme.
CSS=$(curl -s "$URL/" | grep -oE '/_next/static/chunks/[a-z0-9_-]+\.css' | sort -u | head -1)
curl -s "$URL$CSS" | cmp - .open-next/assets"$CSS" && echo "CSS in sync"

# Durable Object round-trip: create a room, read it back, check the guest page.
# 201 then 200/200 means the DO binding and storage work.
R=$(curl -s -X POST "$URL/api/rooms" -H 'Content-Type: application/json' -H "Origin: $URL" \
  -d '{"state":<a valid MeetingState>}')
ID=$(echo "$R" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
curl -s -o /dev/null -w '%{http_code}\n' "$URL/api/rooms/$ID"
curl -s -o /dev/null -w '%{http_code}\n' "$URL/m/$ID"
```

Then open the site and run one real meeting to the readout. The three board routes use
three different models (`turn` → `gpt-5.6-terra`, `react` → `gpt-5.6-luna`, `readout` →
`gpt-5.6-sol`); a full meeting is the only check that exercises all of them.

Live logs, while you click through:

```bash
bunx wrangler tail
```

## Secrets

`OPENAI_API_KEY` is a **Worker secret**, never an `.env` value.

```bash
bunx wrangler secret put OPENAI_API_KEY   # prompts, does not echo
bunx wrangler secret list
```

Locally it goes in `.dev.vars` (gitignored), which serves both `bun run preview` and
`next dev` — `initOpenNextCloudflareForDev()` in `next.config.ts` is what lets `next dev`
read it. `.env.local` holds no key.

```
OPENAI_API_KEY=sk-...
NEXTJS_ENV=production
```

Rotating the key needs no redeploy: `wrangler secret put` alone creates a new version.

`bun run deploy` runs `scripts/check-no-secrets.mjs` between build and upload. It scans the
built bundle for every value assigned in a local env file plus generic key shapes, and exits
non-zero if it finds one, so a poisoned bundle cannot reach Cloudflare. Run it alone with
`bun run check:secrets`.

> **Never put the key in a `.env*` file.** OpenNext inlines every `.env*` file it finds into
> `.open-next/cloudflare/next-env.mjs`, which ships inside the deployed bundle. This applies
> to `.env.development.local` too — OpenNext emits all three environments regardless of
> `NODE_ENV`. This has already happened once via a hand-created `.env`: if `next dev` cannot
> find the key, the fix is `.dev.vars`, never `.env`. After any build:
>
> ```bash
> grep -r "sk-proj" .open-next && echo "LEAK — do not deploy"
> ```

## Stale build cache

`opennextjs-cloudflare build` rebuilds incrementally. It has silently reused a cached
stylesheet and deployed the **previous theme** while reporting `No updated asset files to
upload` — the site stayed on an old palette across a deploy that otherwise looked clean.

That line in deploy output is the tell. If you changed anything under `app/globals.css` or
the components and see it, the build did not pick your change up:

```bash
rm -rf .next .open-next && bun run deploy
```

A deploy that really shipped CSS says `Found N new or modified static assets to upload`.
When in doubt, run the CSS byte-comparison in [Smoke checks](#smoke-checks) — it is the only
check that proves what the browser will actually load.

## Workers constraints

Two things that are fine on Node and break on Workers. Both caused real bugs here.

### No runtime filesystem

`process.cwd()` is `/bundle`, and project directories like `agent/` are not on it.
`fs.readdir` throws, `outputFileTracingIncludes` does not help — that is a Vercel/Node
mechanism.

Persona packages are therefore compiled at build time:
`scripts/gen-personas.mjs` → `lib/server/personas.generated.ts`, wired to `prebuild` and
`predev`. Add or edit a persona under `agent/subagents/<slug>/` and the next `bun run dev`
or `bun run build` picks it up; `bun run gen:personas` refreshes it by hand. The generated
file is committed so `tsc --noEmit` passes on a clean checkout.

**Never reintroduce a runtime file read.** To check:

```bash
grep -rnE "from ['\"]node:(fs|path)" app lib components --include="*.ts" --include="*.tsx"
```

Build-time scripts under `scripts/` may use `node:fs` freely.

### Silent failure

`app/page.tsx` falls back to the six hardcoded `FIXTURE_PERSONAS` when the catalog is empty:

```ts
const catalog = personas.length > 0 ? personas : FIXTURE_PERSONAS;
```

So a broken persona loader does not throw. The select screen renders **6 advisers instead
of 16** and looks fine, and then every board API call returns `404 Unknown persona` the
moment a meeting starts. That adviser count is the tell — it is the first smoke check above
for a reason.

## Shared rooms (Durable Objects)

`/m/<roomId>` guest links are backed by a Durable Object, `BoardMeetingRoom`, declared in
`wrangler.jsonc` and exported from `custom-worker.ts` — the Worker entrypoint (`main`) is
that custom file, which re-exports OpenNext's handler alongside the DO class.

`opennextjs-cloudflare build` prints a warning on every build:

> A DurableObjectNamespace in the config referenced the class "BoardMeetingRoom", but no such
> Durable Object class is exported from the worker.

**This is benign.** OpenNext validates its own inner `.open-next/worker.js`, which does not
export the class; the deployed entrypoint is `custom-worker.ts`, which does. Confirm with
`bunx wrangler deploy --dry-run` — the binding table must list
`env.BOARD_MEETINGS (BoardMeetingRoom)  Durable Object`. If that line is missing, the DO
really is unwired and guest links will fail at runtime.

`lib/server/room-store.ts` falls back to an in-process map when `NODE_ENV !== "production"`,
because `next dev` advertises DO bindings it cannot execute. So `next dev` never exercises the
real DO — only `bun run preview` and production do.

## Rolling back

```bash
bunx wrangler versions list          # find the last good Version ID
bunx wrangler rollback <version-id> -m "reason"
```

Rollback is instant and does not rebuild. Note that a `wrangler secret put` also creates a
version (Source: `Secret Change`), so pick a version whose Source is `Upload`.

## Adding a Cloudflare binding

Declare it in `wrangler.jsonc`, then regenerate types:

```bash
bun run cf-typegen   # writes cloudflare-env.d.ts (gitignored)
```

Read it in server code via `getCloudflareContext().env` from `@opennextjs/cloudflare`.
`bun run preview` runs bindings in local mode, which can behave differently from the real
service — verify anything new against production after deploying.

## Notes

- **Build output** (`.open-next/`, `.wrangler/`) is gitignored and excluded from eslint.
  Delete `.open-next/` if a build ever behaves strangely.
- **`maxDuration = 60`** in the route handlers is a Vercel setting; OpenNext ignores it.
  Workers limits CPU time, not wall-clock, so long streaming responses are fine.
- **Bundle size** is ~1.3 MiB gzipped against a 3 MiB limit. `bunx wrangler deploy --dry-run`
  prints the size without uploading.
- **vinext** is now Cloudflare's recommended Next.js path and would replace OpenNext
  entirely. It was in beta as of 2026-09-03, which is why this project is on OpenNext.
  `npx vinext check` reports compatibility if you revisit the choice.
