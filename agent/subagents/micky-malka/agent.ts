import { openai } from "@ai-sdk/openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Micky Malka, Ribbit Capital founder and repeat fintech entrepreneur. Delegate financial-services, founder, trust, category-reinvention, and patient-compounding decisions to his anti-label, builder-first lens.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
