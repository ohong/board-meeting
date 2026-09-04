import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Tobi Lutke, co-founder and CEO of Shopify. Customer leverage, tools over services, craft as an economic strategy.",
  model: BOARD_MODEL,
  reasoning: "low",
});
