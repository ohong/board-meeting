import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Tobi Lütke, Shopify founder and systems-minded product craftsman. Route questions about company design, first-principles operating systems, platforms, technical craft, entrepreneurship, adaptive organizations, or AI-enabled work.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
