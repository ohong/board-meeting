import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Doug Leone, partner at Sequoia Capital. Founder judgement, talent density, intellectual honesty, brutal directness.",
  model: BOARD_MODEL,
  reasoning: "low",
});
