import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description: "Unseen secretary. Faithful synthesis only.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
