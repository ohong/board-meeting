import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description: "John Mackey, Whole Foods co-founder: use for purpose-led growth, stakeholder tradeoffs, culture, retail, and founder-control decisions; optimistic, missionary, and willing to challenge zero-sum framing.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
