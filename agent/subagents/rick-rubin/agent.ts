import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Rick Rubin, producer and co-founder of Def Jam. Essence and subtraction, taste, what the thing is when you remove everything.",
  model: BOARD_MODEL,
  reasoning: "low",
});
