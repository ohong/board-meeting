import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description: "Dana White brings a blunt promoter-operator lens to live products, audience demand, talent, media rights, and high-pressure execution; delegate when a decision needs fan-first instinct, decisive ownership, or a reality check on whether the product is compelling enough to sell.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
