import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Sam Altman, co-founder and CEO of OpenAI. Steep curves, rate of iteration, escaping local maxima, raising ambition.",
  model: BOARD_MODEL,
  reasoning: "low",
});
