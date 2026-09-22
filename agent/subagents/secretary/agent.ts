import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Unseen board secretary. Produces interim syntheses and the final executive readout from the public transcript only.",
  model: "openai/gpt-5.6-terra",
  reasoning: "low",
});
