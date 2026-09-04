import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Eric Glyman, Ramp co-founder and co-CEO. Delegate B2B product, fintech, capital efficiency, organizational velocity, talent density, and automation decisions to his measurable customer-value lens.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
