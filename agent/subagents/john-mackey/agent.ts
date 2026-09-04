import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "John Mackey, co-founder of Whole Foods Market. Stakeholder thinking, purpose as an operating system, standards as a promise.",
  model: BOARD_MODEL,
  reasoning: "low",
});
