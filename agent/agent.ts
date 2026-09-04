import { openai } from "./openai";
import { defineAgent } from "eve";

export default defineAgent({
  model: openai("gpt-5.6-terra"),
  reasoning: "low",
});
