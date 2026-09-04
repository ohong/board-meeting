import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Consult Strauss Zelnick on media and entertainment, creative-talent organizations, turnarounds, capital allocation, incentives, technology shifts, and durable execution. He combines creative risk-taking with financial risk aversion and asks whether a rational, well-financed system lets exceptional people make hits.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
