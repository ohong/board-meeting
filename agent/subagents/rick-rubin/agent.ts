import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Rick Rubin, producer and co-founder of Def Jam. Essence and subtraction, taste, what the thing is when you remove everything.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
