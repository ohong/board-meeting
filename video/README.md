# Launch video

A 52-second launch film for **The Best Board Meeting You've Ever Had**, built with
[Remotion](https://remotion.dev). 1920×1080, 30 fps, voiceover + sound design,
normalised to −14 LUFS.

```bash
cd video
npm i
npx remotion studio           # preview and edit
npm run render                # -> out/board-meeting-launch.mp4
npm run vo                    # regenerate the voiceover (needs ELEVENLABS_API_KEY)
```

## How it is put together

Ten beats, cut on the product's own story: an empty table → fill it → brief it →
watch it argue → hand your agent a seat → walk out with the memo.

| # | Scene | What it shows |
|---|---|---|
| 1 | `Open` | An empty table. You, and five chairs nobody is sitting in |
| 2 | `Board` | Real catalog cards dealt in; each one seats a member on the ring |
| 3 | `Brief` | The real briefing, with its three decisive numbers standing off the page |
| 4 | `Positions` | Three lanes behind two rules — positions formed in parallel, in private |
| 5 | `Argue` | Close on the table: reaction pills, the live turn, a rebuttal drawn seat to seat |
| 6 | `Seat` | The camera pulls back and a guest agent wires itself into the room |
| 7 | `Tools` | The eight WebMCP site tools snapping onto `document.modelContext` |
| 8 | `Agent` | The app's own minutes, with the agent's real contributions in them |
| 9 | `Memo` | The recommendation, and the dissent that survived into it |
| 10 | `EndCard` | Title, URL, credits, provenance |

Each beat is also a composition of its own under **Scenes** in Studio, at exactly
the length the voiceover gives it, so one beat can be retimed without scrubbing
the whole film.

## The edit is cut to the read

`scripts/gen-vo.mjs` reads `audio/script.json` in **one** ElevenLabs take — ten
separate requests would restart every line at "first sentence" intonation, which
is most of what makes a synthetic read sound synthetic. The take comes back with
character-level timings, which the script uses to cut it apart at the line
boundaries into `public/audio/vo/*.mp3` and to write `src/vo.ts`.

`src/timeline.ts` then derives every scene's start, duration and voiceover frame
from those clip lengths plus one table of `lead` / `tail` air. **That table is
the only place the film's pacing lives** — to give a beat more room, change its
`lead`, not a scene. Picture and sound are placed independently in
`LaunchVideo.tsx`, so adjusting a cross-dissolve can never drag the read out of
sync.

To try a different voice without touching the film:

```bash
node scripts/gen-vo.mjs --voice <id> --tag <name>   # -> audio/auditions/<name>.mp3
```

Three alternates are already in `audio/auditions/`. To adopt one, put its id in
`audio/script.json` and run `npm run vo`; every scene retimes itself.

## Sound

`public/audio/sfx/` holds seven cues, trimmed and levelled. They land on real
events only — a seat taken, a position formed, the room opening, the memo
closing — and every one sits well under the voice. `npm run render` finishes with
a two-pass `loudnorm` to −14 LUFS / −1.5 dBTP, which is what X expects; the video
stream is copied, not re-encoded.

## Theme

`src/theme.ts` copies the product's design tokens verbatim from `app/globals.css`
— the three greys, the reserved colours (green for the guest agent, blue for
"wants the floor", red for dissent), the card and float shadows, and the two
entrance curves. Type is Inter, the same face the app loads as its cross-platform
stand-in for SF Pro.

`src/seat-layout.ts` is a copy of `components/boardroom/seat-layout.ts`, so the
boardroom scenes are not screenshots: they are the product's own ellipse, seat
arc and spotlight geometry, rebuilt at film scale with the real portraits. **If
the app's seat geometry changes, re-copy that file.**

## Screenshots

`public/shots/*.png` were captured from `/dev/fixtures` at a 1600×1000 viewport
and 2× DPR, with the fixture picker hidden. To refresh them, run the app
(`bun run dev` in the repo root) and re-shoot each fixture: `selecting`,
`briefing`, `forming`, `discussion`, `guest`, `readout`, `invite`.

The film never shows a whole page. A 13px UI label lands at about three pixels
once X has scaled a 1920 frame into a column, so `src/shots.ts` holds rectangles
around single **elements** — one adviser card, one minutes row, one
recommendation block — and `<Ui>` floats them at two to three times size, sharp.
Big enough to read, and unmistakably the real product rather than a rebuild.
Rectangles are in the screenshots' own 1600×1000 CSS space; to add one, measure
at half the pixel coordinates of the 2× file.

## Copy that must stay accurate

The end card carries the same provenance line the product does: the advisers are
simulations distilled from public interviews and writing, not endorsements by the
people represented. Every word attributed to a board member anywhere in the film
comes from the app's own demo fixtures — the greeked lines in `Positions` are
grey bars precisely so that a beat about "forming a position" does not have to
invent one. Don't put new words in a real person's mouth to make a shot land.
