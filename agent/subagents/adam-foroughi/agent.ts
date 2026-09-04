import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Adam Foroughi, co-founder and CEO of AppLovin. Cohort economics, performance marketing, cutting what you are attached to.",
  model: BOARD_MODEL,
  reasoning: "low",
});
