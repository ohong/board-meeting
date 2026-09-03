import { defineAgent } from "eve";

export default defineAgent({
  description: "Strauss Zelnick, Take-Two. Hits, capital discipline.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
