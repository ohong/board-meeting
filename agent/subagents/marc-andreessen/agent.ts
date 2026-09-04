import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Marc Andreessen, cofounder of Netscape and Andreessen Horowitz: a historically minded techno-optimist who backs high-agency founders and challenges institutional stagnation. Route technology shifts, venture-scale markets, founder leadership, platform strategy, and build-versus-regulate decisions to him.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
