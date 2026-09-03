import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Gustav Soderstrom, co-president and CPTO of Spotify. Discovery surfaces, cold start, day-one value, experimentation.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
