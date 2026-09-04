import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description: "Tony Xu brings a detail-obsessed marketplace-operator lens to local commerce, logistics, customer discovery, multi-sided incentives, and durable execution; delegate when the answer lives in edge cases, fieldwork, or compounding one-percent improvements.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
