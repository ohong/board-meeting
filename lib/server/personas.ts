import type { PersonaSummary } from "@/lib/meeting/types";
import { PERSONA_PACKAGES, type PersonaPackage } from "@/lib/server/personas.generated";

export type { PersonaPackage };

// Packages are read off disk at build time (scripts/gen-personas.mjs) rather than per
// request: Cloudflare Workers has no runtime filesystem, so a node:fs read here would
// leave the board with an empty catalog in production.
const BY_SLUG: ReadonlyMap<string, PersonaPackage> = new Map(
  PERSONA_PACKAGES.map((pkg) => [pkg.summary.slug, pkg]),
);

/** Catalog for the selection screen: only fully initialized packages, newest episode first. */
export async function listPersonas(): Promise<PersonaSummary[]> {
  return [...BY_SLUG.values()]
    .map((p) => p.summary)
    .sort((a, b) => (a.episodeDate < b.episodeDate ? 1 : a.episodeDate > b.episodeDate ? -1 : a.name.localeCompare(b.name)));
}

export async function getPersona(slug: string): Promise<PersonaPackage | null> {
  return BY_SLUG.get(slug) ?? null;
}
