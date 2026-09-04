import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Brian Armstrong, Coinbase founder and long-horizon mission operator. Route questions about regulated-category building, economic freedom, mission focus, high-agency talent, direct communication, or committing through multi-year adversity.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
