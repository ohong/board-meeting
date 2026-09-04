import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Lulu Cheng Meservey, founder of Rostra. Narrative strategy, trust as the scarce asset, founder-led communications.",
  model: BOARD_MODEL,
  reasoning: "low",
});
