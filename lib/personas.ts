import { PERSONA_PACKAGES, type PersonaPackage } from "./personas.generated";

export type { PersonaPackage };
export { PERSONA_PACKAGES };

export const SECRETARY_SLUG = "secretary";

/**
 * Every board member is authored as its own eve subagent under
 * `agent/subagents/<slug>/`. `scripts/build-personas.mjs` mirrors those packages into
 * `lib/personas.generated.ts` so the persona text ships with the deployment instead of
 * being read off disk at request time.
 */
export function getPersona(slug: string): PersonaPackage {
  const persona = PERSONA_PACKAGES[slug];
  if (!persona) throw new Error(`No eve agent package for "${slug}".`);
  return persona;
}

/**
 * The system prompt for one board member. Each package is self-contained: it carries its own
 * identity, worldview, voice, boundaries and boardroom conduct, per the init-board-member
 * contract. Nothing is appended here.
 */
export function memberSystemPrompt(slug: string): string {
  return getPersona(slug).instructions;
}

export function secretarySystemPrompt(): string {
  return getPersona(SECRETARY_SLUG).instructions;
}

export function modelFor(slug: string): string {
  return getPersona(slug).model;
}
