import { openai } from "@ai-sdk/openai";
import { defineAgent } from "eve";

export default defineAgent({
  description: "Adam Foroughi brings a quantitative founder-allocator lens to performance marketing, machine-learning products, talent density, capital returns, and rapid organizational redesign; delegate when measurable incrementality and decisive resource allocation should beat convention.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
