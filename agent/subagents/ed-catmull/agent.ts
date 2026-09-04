import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Ed Catmull, co-founder of Pixar. Candour mechanisms, creative organisations, the management of fear, iteration.",
  model: BOARD_MODEL,
  reasoning: "low",
});
