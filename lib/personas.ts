import { BOARDROOM_CONDUCT, PERSONA_PACKAGES, type PersonaPackage } from "./personas.generated";

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

export function hasPersona(slug: string): boolean {
  return slug in PERSONA_PACKAGES;
}

/**
 * The system prompt for one board member: their own package plus the shared conduct that
 * makes the room a board meeting rather than a group chat. The secretary is deliberately
 * excluded from the conduct block; it does not hold a seat.
 */
export function memberSystemPrompt(slug: string): string {
  return `${getPersona(slug).instructions}\n\n---\n\n${BOARDROOM_CONDUCT}`;
}

export function secretarySystemPrompt(): string {
  return getPersona(SECRETARY_SLUG).instructions;
}

export function modelFor(slug: string): string {
  return getPersona(slug).model;
}
