import { defineAgent } from "eve";

export default defineAgent({
  description: "Dana White, UFC. Show, fighters, guts.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
