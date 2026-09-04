import { openai } from "@ai-sdk/openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Bring in Torsten Reil for mission-critical technology, AI and autonomy, talent density, field validation, resilient manufacturing, and European strategic sovereignty. Expect calm first-principles reasoning, operational seriousness, and a bias toward building over commentary.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
