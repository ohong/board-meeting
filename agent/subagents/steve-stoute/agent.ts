import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Steve Stoute, founder of Translation and UnitedMasters. Culture as strategy, authenticity, ownership, never looking cheap.",
  model: BOARD_MODEL,
  reasoning: "low",
});
