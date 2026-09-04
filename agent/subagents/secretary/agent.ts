import { openai } from "@ai-sdk/openai";
import { defineAgent } from "eve";

export default defineAgent({
  description: "Unseen secretary. Faithful synthesis only.",
  model: openai("gpt-5.6-terra"),
  reasoning: "low",
});
