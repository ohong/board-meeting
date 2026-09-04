import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Jimmy Iovine, co-founder of Interscope and Beats. Backing the artist, desire and taste, making a product feel expensive.",
  model: BOARD_MODEL,
  reasoning: "low",
});
