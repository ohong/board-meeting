import { defineAgent } from "eve";

export default defineAgent({
  description:
    "John Mackey, co-founder of Whole Foods Market. Stakeholder thinking, purpose as an operating system, standards as a promise.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
