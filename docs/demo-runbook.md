# Board Meeting MVP demo runbook

This checklist rehearses the exact two-minute path in `mvp-specs.md`. It distinguishes deterministic local evidence from the live OpenAI/Eve gate so a mock pass is never reported as a live pass.

## Preflight

- Work from a fresh browser context at 1440 × 900 when presenting.
- Put `OPENAI_API_KEY=...` in the local `.env.local`; never paste the key into a prompt or browser field. Live calls are intentionally loopback-only in this no-auth MVP, so run the live demo locally.
- Run `bun run lint`, `bun run typecheck`, `bun test`, `bun run build`, `bunx eve info --json`, and `bunx eve build --skip-sandbox-prewarm`.
- Start the app with `bun run dev` (the project script binds Next explicitly to `localhost`) and confirm the entry footer says `Live mode · responses enabled`. `Demo mode` is useful for rehearsal but is not a live acceptance pass. Do not substitute a LAN-bound or tunnelled dev command: the live route is intentionally limited to server-controlled development/test runtime plus loopback requests.
- In Codex's in-app browser, confirm exactly these six Site tools are discoverable: `inspect_board_meeting`, `join_board_meeting`, `contribute_to_board_meeting`, `address_board_member`, `request_board_synthesis`, and `get_board_meeting_readout`.

## Two-minute presenter path

1. Select Daniel Ek, David Heinemeier Hansson, and Lulu Cheng Meservey. Confirm the board shows `3 of 6`, then choose **Brief your board**.
2. Choose **Use example decision**. Briefly show the populated question, metrics, and constraints, then choose **Start board meeting**.
3. Confirm all three seats move through private thinking to ready, the board locks, and public minutes begin. Let the advisers disagree and rebut one another.
4. Ask Lulu one short question with the `@Lulu Cheng Meservey` mention and confirm the chair's message appears before her answer.
5. Open **Invite your agent** and give Codex the displayed invitation. The Codex conversation should already know this private context:

   > Seven of our last ten enterprise wins first entered through a free workspace shared by an existing user. Those accounts now represent 22% of ARR.

6. In Codex, inspect the meeting, join as `Codex`, contribute the private context, ask Daniel Ek whether it changes his view, and request an interim synthesis. Confirm each action appears in the same public meeting and that Codex cannot end it.
7. As the human chair, choose **End meeting**. Confirm the final memo has exactly eight sections and preserves divided closing views.
8. In Codex, call `get_board_meeting_readout` and compare `readoutText` with **Copy readout**. They must be byte-identical.
9. Reload once after the demo and confirm selection, briefing, transcript, guest, and readout are empty.

## Rehearsal record

On 2026-09-03, the final deterministic mock completed five consecutive fresh browser sessions:

| Run | Viewport | First public speech | End to readout | Result |
| --- | --- | ---: | ---: | --- |
| 1 | 1024 × 800 | 2.403 s | 2.389 s | Pass |
| 2 | 1280 × 800 | 2.434 s | 2.359 s | Pass |
| 3 | 1440 × 900 | 2.561 s | 2.338 s | Pass |
| 4 | 1280 × 800 | 2.437 s | 2.391 s | Pass |
| 5 | 1024 × 800 | 2.408 s | 2.299 s | Pass |

All five began empty, exposed no pre-end readout, produced the required eight sections, avoided horizontal overflow, and logged no browser errors. The six-seat 1024 × 800 stress pass also kept the expanded brief and guest seat fully inside the room.

The final page registered exactly the six expected tools in Codex's in-app browser. Stateful native invocation must be repeated with the live runtime after the key is installed; tool discovery alone is not recorded as a WebMCP acceptance pass.

Live model timing, persona distinctness, and the five consecutive live rehearsals remain pending until the local API key is available. Record those separately; do not replace the mock measurements above.
