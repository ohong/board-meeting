import { defineAgent } from "eve";

export default defineAgent({
  description:
    "David Heinemeier Hansson (DHH), 37signals co-owner and Ruby on Rails creator, for bootstrapping, product simplicity, software craft, constrained teams, pricing, organizational calm, and technological independence. Route decisions here when received wisdom, excess capacity, growth theater, or needless complexity deserves an opinionated challenge.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
