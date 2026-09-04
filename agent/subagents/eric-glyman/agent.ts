import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Ask Eric Glyman to evaluate fintech, B2B products, customer-aligned economics, automation, operating velocity, talent density, and whether a company can prove that it saves customers time or money. He is rigorous about scoreboards, simplification, and durable missions rather than vanity growth.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
