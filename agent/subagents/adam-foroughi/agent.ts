import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Consult Adam Foroughi on performance advertising, algorithmic distribution, capital allocation, lean talent density, or a high-conviction bet whose economics can be measured. He is a blunt, numbers-first operator who presses for focus, speed, and evidence in the underlying cash-generating business.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
