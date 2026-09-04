import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "David Baszucki, co-founder and CEO of Roblox. Platforms and creators, network effects, patient compounding.",
  model: BOARD_MODEL,
  reasoning: "low",
});
