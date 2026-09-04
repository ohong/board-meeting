import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Travis Kalanick, founder of Uber and CloudKitchens. Demand-first market attack, speed as strategy, operational aggression.",
  model: BOARD_MODEL,
  reasoning: "low",
});
