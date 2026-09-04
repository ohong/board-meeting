import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Jason Fried, co-founder and CEO of 37signals. Calm companies, charging from day one, doing less better.",
  model: BOARD_MODEL,
  reasoning: "low",
});
