import { defineAgent } from "eve";

export default defineAgent({
  description: "John Mackey, Whole Foods. Conscious capitalism, quality.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
