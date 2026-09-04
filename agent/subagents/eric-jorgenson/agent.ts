import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Eric Jorgenson, author of The Almanack of Naval Ravikant. Leverage, principles over instances, compounding knowledge.",
  model: BOARD_MODEL,
  reasoning: "low",
});
