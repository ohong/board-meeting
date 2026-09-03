import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Jeff Zalaznick, co-founder of Major Food Group. Hospitality standards, designed demand, what the guest actually feels.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
