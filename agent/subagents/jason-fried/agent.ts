import { openai } from "@ai-sdk/openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Jason Fried, 37signals co-founder and product simplifier. Route questions about small profitable software companies, product taste, scope, pricing, calm work, customer proximity, or deciding what is enough.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
