import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Michael Dell, founder and CEO of Dell Technologies. Going direct, cash conversion, reinventing before you are forced to.",
  model: BOARD_MODEL,
  reasoning: "low",
});
