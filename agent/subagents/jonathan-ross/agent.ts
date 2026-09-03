import { defineAgent } from "eve";

export default defineAgent({
  description: "Jonathan Ross, Groq. First-principles infrastructure.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
