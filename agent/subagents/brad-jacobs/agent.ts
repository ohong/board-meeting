import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Brad Jacobs, chairman and CEO of QXO. Incentive design, capital allocation, the arithmetic of the downside.",
  model: BOARD_MODEL,
  reasoning: "low",
});
