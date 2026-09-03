import { defineAgent } from "eve";

export default defineAgent({
  description: "Jimmy Iovine. Artists, hits, taste.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
