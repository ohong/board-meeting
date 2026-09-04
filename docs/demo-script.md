# Two-minute demo: presenter checklist

The app is rehearsed against this exact script. `bun run rehearse` asserts every step of it
five times in a row against a fresh session.

## Before you present

- [ ] `OPENAI_API_KEY` set in the environment you are demoing (or accept the stand-in
      banner — the full flow works either way).
- [ ] Browser window at roughly 1440×900. The room is designed for a laptop, not a phone.
- [ ] The demo trio all have real portraits, so the table reads as people rather than
      initials. Twenty-four of the thirty-six advisers still fall back to a monogram.
- [ ] The page freshly loaded. A refresh is a new meeting; there is no state to clear.
- [ ] Your agent (Codex or another WebMCP-capable assistant) open in a second window, on
      this page, already holding this private context — **do not paste it into the app**:

  > Seven of our last ten enterprise wins first entered through a free workspace shared by
  > an existing user. Those accounts now represent 22% of ARR.

  The point of the WebMCP segment is that the board learns something only your agent knew.

## The script

**0:00–0:15 — Choose your board.** Search `Ek`, `DHH`, `Lulu` and seat all three. The miniature table on the left fills as you go. Say what
the room is: three separate agents, each with its own sources, not one model in six hats.

**0:15–0:25 — Brief your board.** Click **Use the pricing decision**, let the briefing land on
screen for a beat, then **Start board meeting**.

**0:25–0:40 — Independent positions.** All three seats go to *Considering privately*, in parallel,
and turn ready. Say why: each adviser commits to a position privately so the first speaker
does not anchor the room. Nobody sees anyone else's.

**0:40–1:15 — The discussion.** Ek questions the premise, DHH rebuts him by name, Lulu
reframes it as trust rather than pricing. The reaction lines under each seat and the *to <name>* labels in the minutes are worth
pointing at. Then type:

> `@Lulu how do we explain a free-tier change without losing user trust?`

Lulu answers next — a direct mention overrides the speaker queue.

**1:15–1:45 — Your agent joins.** Click **Invite your agent**, copy the prompt, paste it
into your agent. It will:

1. `inspect_board_meeting` — read the briefing and the room
2. `join_board_meeting` — under its own name; the guest seat lights up
3. `contribute_to_board_meeting` — the enterprise-referral context above
4. `address_board_member` — ask Daniel Ek whether that changes his view
5. `request_board_synthesis` — where the board stands now

Watch the guest seat activate, the contribution land in the minutes, and Ek answer with the
new evidence. The activity list in the invite panel tracks each call.

**1:45–2:00 — End and read out.** Click **End meeting**. Every adviser gives a closing
comment, then the readout appears: recommendation, options, tradeoffs, assumptions, open
questions, next actions, and every closing comment attributed. The board is divided and the
memo says so. Finally, your agent calls `get_board_meeting_readout` and gets the exact memo
on screen — the app confirms the retrieval in the sidebar.

## Things worth saying out loud

- The board is **divided**, and the memo preserves that. Manufactured consensus would be
  worth less than the disagreement.
- Advisers **pass** when they have nothing to add. Nobody fills airtime.
- Your agent participates through the product's real meeting actions — one transcript, one
  source of truth — not by driving the UI with simulated clicks.
- The guest **cannot** end the meeting. Only the human chair can.

## If something goes wrong

- A failed turn leaves no half-written message; the room moves on and the seat stays usable.
- If the secretary fails twice, the readout falls back to the transcript and closing
  comments rather than a blank screen.
- If the browser exposes no site tools, the invite panel says so and the meeting is
  unaffected.
- Worst case: refresh. A new meeting is fifteen seconds away.
