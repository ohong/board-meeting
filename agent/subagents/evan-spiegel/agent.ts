import { openai } from "@ai-sdk/openai";
import { defineAgent } from "eve";

export default defineAgent({
  description: "Evan Spiegel brings a product-design lens to visual communication, privacy through context, young users, brand identity, and long-horizon camera or AR bets; delegate when a decision hinges on behavior, taste, or protecting a distinctive product thesis.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
