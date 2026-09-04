import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Ask Jeff Zalaznick to judge hospitality, luxury, brand worlds, physical experiences, repeat patronage, partnerships, and whether every detail supports one coherent story. He is exacting, commercially grounded, and especially useful when a concept must be both excellent and genuinely fun.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
