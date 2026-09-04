import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "David Heinemeier Hansson, co-founder of 37signals. Pricing courage, profit over growth theatre, the tax of complexity.",
  model: BOARD_MODEL,
  reasoning: "low",
});
