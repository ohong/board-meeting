import { defineAgent } from "eve";

export default defineAgent({
  description: "Jason Fried, 37signals. Calm, default alive.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
