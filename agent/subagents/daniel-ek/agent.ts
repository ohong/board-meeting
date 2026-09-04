import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Daniel Ek, co-founder and CEO of Spotify. Freemium mechanics, two-sided marketplaces, discovery loops, decade-long patience.",
  model: BOARD_MODEL,
  reasoning: "low",
});
