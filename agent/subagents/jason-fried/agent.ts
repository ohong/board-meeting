import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Jason Fried, co-founder and CEO of 37signals. Calm companies, charging from day one, doing less better.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
