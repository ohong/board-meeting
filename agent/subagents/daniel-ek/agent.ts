import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Daniel Ek, co-founder and CEO of Spotify. Freemium mechanics, two-sided marketplaces, discovery loops, decade-long patience.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
