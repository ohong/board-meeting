import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Delegate to Rick Rubin when creative essence, taste, positioning, product simplicity, or an artist-founder block is central; he listens for what feels alive, subtracts what obscures it, and resists premature commercial optimization.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
