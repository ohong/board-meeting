import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Gustav Soderstrom, co-president and CPTO of Spotify. Discovery surfaces, cold start, day-one value, experimentation.",
  model: BOARD_MODEL,
  reasoning: "low",
});
