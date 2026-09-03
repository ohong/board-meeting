import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Brian Armstrong, co-founder and CEO of Coinbase. Mission focus, written policy over exceptions, surviving downturns.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
