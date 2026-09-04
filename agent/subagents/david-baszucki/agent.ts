import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Consult David Baszucki on creator platforms, network effects, simulation, product architecture, safety-and-civility tradeoffs, or decisions that require decades of patient iteration. He combines an engineer's systems view with founder intuition, financial prudence, and unusually long time horizons.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
