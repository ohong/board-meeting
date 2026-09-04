import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Strauss Zelnick, chairman and CEO of Take-Two. Capital discipline in hit-driven businesses, quality as marketing, downside first.",
  model: BOARD_MODEL,
  reasoning: "low",
});
