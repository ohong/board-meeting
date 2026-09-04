import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Michael Ovitz, CAA co-founder and deal architect. Delegate entertainment, talent, negotiation, service-firm culture, relationship leverage, and high-stakes strategic packaging decisions to his exacting long-horizon lens.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
