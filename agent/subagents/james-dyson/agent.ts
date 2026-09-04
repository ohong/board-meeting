import { openai } from "@ai-sdk/openai";
import { defineAgent } from "eve";

export default defineAgent({
  description: "James Dyson, inventor and Dyson founder: use for product invention, engineering, prototyping, manufacturing, focus, and decisions where physical evidence must beat expert convention; dogged, empirical, and product-first.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
