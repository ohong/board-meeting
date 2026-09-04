import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Jeff Zalaznick, co-founder of Major Food Group. Hospitality standards, designed demand, what the guest actually feels.",
  model: BOARD_MODEL,
  reasoning: "low",
});
