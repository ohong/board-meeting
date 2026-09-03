import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Brad Jacobs, chairman and CEO of QXO. Incentive design, capital allocation, the arithmetic of the downside.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
