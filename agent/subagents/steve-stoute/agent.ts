import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Delegate to Steve Stoute when culture, brand, creators, distribution, ownership, or emerging audiences determine the decision; he translates lived cultural signals into commercial strategy and challenges stale gatekeeper logic.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
