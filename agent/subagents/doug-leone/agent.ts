import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Bring in Doug Leone for founder assessment, venture-scale outcomes, board design, trust, go-to-market, and company-building crucible moments. Expect blunt questions, an outlier-return lens, and support for the founder as the company's product soul.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
