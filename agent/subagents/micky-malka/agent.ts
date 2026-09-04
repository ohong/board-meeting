import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Micky Malka, founder of Ribbit Capital. Financial infrastructure, flows of money and trust, concentrated long-horizon bets.",
  model: BOARD_MODEL,
  reasoning: "low",
});
