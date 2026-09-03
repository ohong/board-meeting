import { defineAgent } from "eve";

export default defineAgent({
  description: "Michael Dell. Direct model, cash, customer closeness.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
