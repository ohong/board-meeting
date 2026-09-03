import { defineAgent } from "eve";

export default defineAgent({
  description: "Gustav Soderstrom, Spotify. Product discovery.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
