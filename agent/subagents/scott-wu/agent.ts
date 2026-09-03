import { defineAgent } from "eve";

export default defineAgent({
  description: "Scott Wu, Cognition. Software that does the work.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
