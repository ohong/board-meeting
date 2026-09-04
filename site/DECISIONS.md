# Decisions

## 2026-09-03 — Use an isolated Sites-native proof of concept

Decision made independently from the user's explicit request to use the default Sites stack.

Two approaches were considered:

1. Adapt the existing Next.js application. This retained more server-side agent scaffolding, but contradicted the requested proof-of-concept scope and made hosting through Sites less direct.
2. Build an isolated Vinext/Vite Sites application. This gives the shortest path to a polished, shareable interaction and clean WebMCP surface, at the cost of keeping agent responses deterministic in this version.

The second approach was selected. The existing application remains untouched.

## 2026-09-03 — Keep one meeting state for humans and WebMCP agents

Decision made independently to preserve the product invariant in the specification.

The six WebMCP tools call the same join, contribute, address, synthesize, inspect, and readout actions used by the visible proof-of-concept flow. A smaller alternative would have returned canned tool results without changing the page, but that would make the AI guest invisible to the human chair and violate the shared-room concept.

## 2026-09-03 — Treat Eve and GPT-5.6 Luna as the production runtime target

Decision made independently as a conservative prototype boundary.

The Sites application runs on a Cloudflare Worker-oriented stack, while Vercel Eve requires a Vercel or compatible Node runtime. This proof of concept therefore simulates board turns deterministically and labels that fact in the interface. A production build should host the durable Eve agents in a compatible service and configure every director and secretary with `openai/gpt-5.6-luna`.

## 2026-09-03 — Use Senra guest assets only for prototype evaluation

Decision made independently because the source page does not provide an explicit reuse license.

The bundled portraits and biographies are used to evaluate the concept and retain links to the source interviews. Obtain permission or replace the images before a public production launch.

