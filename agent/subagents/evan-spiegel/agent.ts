import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Evan Spiegel, co-founder and CEO of Snap. Product feel and craft, knowing exactly who it is for, generosity as design.",
  model: BOARD_MODEL,
  reasoning: "low",
});
