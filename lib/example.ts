export const EXAMPLE_QUESTION =
  "Should our B2B collaboration app eliminate its free tier and replace it with a 14-day trial?";

export const EXAMPLE_BRIEFING =
  "We are an 18-person seed-stage company at $1.6M ARR. We have 6,000 free workspaces and 420 paying customers. Only 2.3% of free workspaces convert within 90 days, and free users generate 38% of support tickets. However, 34% of current paying customers first discovered us through a free workspace. We want faster growth and a simpler product, but we are worried about weakening word of mouth.";

export const EXAMPLE_DECISION = `Question: ${EXAMPLE_QUESTION}

Briefing: ${EXAMPLE_BRIEFING}`;

/**
 * The prompt the chair copies into their own agent. It names a seated adviser so the
 * agent has somewhere concrete to direct its question, and it never dictates the guest's
 * display name — the joining agent supplies the name it knows itself by.
 */
export function invitationPrompt(boardNames: string[]): string {
  const target = boardNames[0] ?? "one board member";
  return `You are invited to the board meeting running on this page. Use its Site tools to do the following, in order.

1. Call inspect_board_meeting to read the decision briefing and the discussion so far.
2. Call join_board_meeting with the name you know yourself by. You will take the guest seat.
3. Call contribute_to_board_meeting with any context about me or my company that you already know and that this board is missing. Say why it is relevant.
4. Call address_board_member to ask ${target} one focused question about whether that context changes their view.
5. Call request_board_synthesis to get where the board currently stands.
6. After the human chair ends the meeting, call get_board_meeting_readout and show me the final memo.

You cannot end the meeting; only the human chair can.`;
}
