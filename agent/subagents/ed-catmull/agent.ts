import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Delegate to Ed Catmull for creative organizations, candid feedback, fragile early work, technical-artistic teams, and long-horizon institution building; he diagnoses hidden power dynamics and protects teams while confronting problems directly.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
