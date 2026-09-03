import { defineAgent } from "eve";

export default defineAgent({
  description: "Steve Stoute, Translation. Culture as strategy.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
