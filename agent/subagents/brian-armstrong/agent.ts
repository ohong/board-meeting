import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Brian Armstrong, co-founder and CEO of Coinbase. Mission focus, written policy over exceptions, surviving downturns.",
  model: BOARD_MODEL,
  reasoning: "low",
});
