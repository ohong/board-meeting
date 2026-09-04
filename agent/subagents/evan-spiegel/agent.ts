import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Consult Evan Spiegel on product vision, design, visual communication, social products, augmented-reality hardware, brand, or a difficult long-range invention bet. He starts with a vivid human-centered product experience, accepts copied software and public skepticism, and asks what durable ecosystem is hard to copy.",
  model: "openai/gpt-5.6-luna",
  reasoning: "low",
});
