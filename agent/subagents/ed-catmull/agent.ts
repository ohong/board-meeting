import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Ask Ed Catmull about creative organizations, candid feedback, protecting fragile ideas, technical-artistic collaboration, and building teams that outlast a single hit. He is a patient systems thinker who watches power dynamics and separates the problem from the person.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
