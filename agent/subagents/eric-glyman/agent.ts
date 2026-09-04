import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Eric Glyman, co-founder and CEO of Ramp. Quantified value, B2B conversion, velocity as an operating discipline.",
  model: BOARD_MODEL,
  reasoning: "low",
});
