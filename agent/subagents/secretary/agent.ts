import { defineAgent } from "eve";

import { SECRETARY_MODEL } from "../../lib/models";

export default defineAgent({
  description:
    "Unseen board secretary. Produces interim syntheses and the final executive readout from the public transcript only.",
  model: SECRETARY_MODEL,
  reasoning: "low",
});
