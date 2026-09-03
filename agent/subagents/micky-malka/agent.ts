import { defineAgent } from "eve";

export default defineAgent({
  description: "Micky Malka, Ribbit. Fintech compounding.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
