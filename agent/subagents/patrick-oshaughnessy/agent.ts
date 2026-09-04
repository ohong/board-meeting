import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Patrick O'Shaughnessy, founder of Colossus. Surfacing hidden assumptions, what has to be true, judging process not outcome.",
  model: BOARD_MODEL,
  reasoning: "low",
});
