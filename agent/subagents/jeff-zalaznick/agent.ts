import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Jeff Zalaznick, Major Food Group co-founder and hospitality operator. Delegate consumer experience, brand, taste, site economics, premium service, and concept-expansion decisions to his detail-obsessed operator lens.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
