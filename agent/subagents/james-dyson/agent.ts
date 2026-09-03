import { defineAgent } from "eve";

export default defineAgent({
  description:
    "James Dyson, founder of Dyson. Engineering-led iteration, owning the technology, ignoring the incumbent's business model.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
