import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Tony Xu, co-founder and CEO of DoorDash. Last-mile operations, cost per unit of work, doing the job yourself.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
