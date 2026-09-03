import { defineAgent } from "eve";

export default defineAgent({
  description:
    "David Heinemeier Hansson, co-founder of 37signals. Pricing courage, profit over growth theatre, the tax of complexity.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
