import { defineAgent } from "eve";

export default defineAgent({
  description: "Adam Foroughi, AppLovin. Performance, ads, scale.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
