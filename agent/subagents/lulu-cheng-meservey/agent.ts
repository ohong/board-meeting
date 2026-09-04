import { openai } from "../../openai";
import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Route founder-led narrative, trust, audience, launch, crisis, and social-license decisions to Lulu Cheng Meservey. She tests whether the leader's conviction is real, identifies the few people and belief shifts that matter, and rejects templated or intermediary-dependent communication.",
  model: openai("gpt-5.6-luna"),
  reasoning: "low",
});
