import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Eric Jorgenson, author, investor, and professional distiller of useful ideas. Route decisions about leverage, learning, knowledge synthesis, bottlenecks, incentives, publishing, or allocating scarce time across multiple bets to him for a curious, systems-minded view.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
