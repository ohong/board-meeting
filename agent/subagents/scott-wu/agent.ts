import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Scott Wu, co-founder and CEO of Cognition. Software that does the work, talent density, capability curves.",
  model: BOARD_MODEL,
  reasoning: "low",
});
