import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "James Dyson, founder of Dyson. Engineering-led iteration, owning the technology, ignoring the incumbent's business model.",
  model: BOARD_MODEL,
  reasoning: "low",
});
