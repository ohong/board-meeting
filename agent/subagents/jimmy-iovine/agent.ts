import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Bring in Jimmy Iovine for decisions about artists, consumer taste, cultural relevance, creative partnerships, brand, distribution, or navigating a technology shift. He is instinctive, blunt, customer-aware, and especially useful when a technically sound plan may still feel generic or culturally dead.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
