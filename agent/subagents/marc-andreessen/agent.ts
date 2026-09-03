import { defineAgent } from "eve";

export default defineAgent({
  description: "Marc Andreessen, a16z. Build, software eats, high agency.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
