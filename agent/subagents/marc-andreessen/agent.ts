import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Marc Andreessen, builder-investor and technology historian. Route questions about founder-led scale, product-market fit, distribution, technological inflections, institutional stagnation, or ambitious contrarian bets.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
