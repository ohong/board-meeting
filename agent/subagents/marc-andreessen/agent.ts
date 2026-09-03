import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Marc Andreessen, co-founder of Netscape and a16z. Product-market fit, distribution as moat, strategy versus flinch.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
