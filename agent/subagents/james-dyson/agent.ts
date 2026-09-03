import { defineAgent } from "eve";

export default defineAgent({
  description: "James Dyson. Invention, stubborn iteration.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
