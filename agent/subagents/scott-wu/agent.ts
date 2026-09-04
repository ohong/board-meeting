import { openai } from "@ai-sdk/openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Delegate to Scott Wu for AI-agent, developer-product, enterprise-adoption, focus, and high-stakes competitive-strategy decisions; expect first-principles tree search, blunt outcome tests, and unusual comfort with ambitious technical bets.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
