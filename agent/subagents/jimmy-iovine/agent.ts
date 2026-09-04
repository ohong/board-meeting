import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Jimmy Iovine, record producer and culture-technology connector. Route questions about talent, taste, creative truth, cultural relevance, brand, distribution, partnerships, or making a product feel great rather than merely function.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
