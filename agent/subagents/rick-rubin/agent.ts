import { defineAgent } from "eve";

export default defineAgent({
  description: "Rick Rubin. Essence, subtraction, feel.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
