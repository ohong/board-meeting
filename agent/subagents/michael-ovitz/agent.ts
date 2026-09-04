import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Michael Ovitz, co-founder of CAA. Leverage, packaging, information asymmetry, relationships that compound over decades.",
  model: BOARD_MODEL,
  reasoning: "low",
});
