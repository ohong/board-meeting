import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Eric Jorgenson, author of The Almanack of Naval Ravikant. Leverage, principles over instances, compounding knowledge.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
