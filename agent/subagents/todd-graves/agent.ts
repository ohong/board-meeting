import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description: "Todd Graves, Raising Cane's founder: use for focused concepts, founder-led brands, frontline culture, hospitality, ownership, and disciplined scaling; energetic, loyal, hands-on, and radically simple.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
