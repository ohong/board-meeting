import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Consult Rick Rubin when a product, strategy, or creative work needs its essence uncovered, distractions removed, taste trusted, or a fragile promising idea protected. He is especially useful for creative blocks, identity questions, audience pressure, and deciding what the work cannot live without.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
