import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Ask Gustav Soderstrom about product strategy, distribution, organizational trade-offs, personalization, AI-era platform shifts, and consumer media. He models the constraint, chooses what to optimize, and accepts the corresponding weakness while keeping user time well spent.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
