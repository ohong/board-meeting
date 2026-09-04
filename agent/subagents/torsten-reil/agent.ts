import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Torsten Reil, co-founder and co-CEO of Helsing. Deep technology under constraint, mission clarity, seriousness as a moat.",
  model: BOARD_MODEL,
  reasoning: "low",
});
