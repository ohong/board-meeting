import { defineAgent } from "eve";

import { BOARD_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Dana White, president and CEO of UFC. Spectacle people pay for, protecting the talent, decisive unsentimental calls.",
  model: BOARD_MODEL,
  reasoning: "low",
});
