import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Ivanka Trump, businesswoman and investor. Stakeholder management, brand stewardship, operating under public scrutiny.",
  model: BOARD_MODEL,
  reasoning: "low",
});
