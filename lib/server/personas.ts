import { promises as fs } from "node:fs";
import path from "node:path";
import type { PersonaSummary } from "@/lib/meeting/types";

const ROOT = path.join(process.cwd(), "agent", "subagents");

export interface PersonaPackage {
  summary: PersonaSummary;
  instructions: string;
}

let cache: Map<string, PersonaPackage> | null = null;

async function load(): Promise<Map<string, PersonaPackage>> {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const map = new Map<string, PersonaPackage>();
  let dirs: string[] = [];
  try {
    dirs = await fs.readdir(ROOT);
  } catch {
    return map;
  }
  for (const dir of dirs) {
    const base = path.join(ROOT, dir);
    try {
      const [metaRaw, instructions] = await Promise.all([
        fs.readFile(path.join(base, "persona.json"), "utf8"),
        fs.readFile(path.join(base, "instructions.md"), "utf8"),
      ]);
      const summary = JSON.parse(metaRaw) as PersonaSummary;
      if (summary.slug !== dir) continue;
      if (!instructions.trim()) continue;
      map.set(summary.slug, { summary, instructions });
    } catch {
      // Incomplete package: not selectable (spec §6.1).
    }
  }
  cache = map;
  return map;
}

/** Catalog for the selection screen: only fully initialized packages, newest episode first. */
export async function listPersonas(): Promise<PersonaSummary[]> {
  const map = await load();
  return [...map.values()]
    .map((p) => p.summary)
    .sort((a, b) => (a.episodeDate < b.episodeDate ? 1 : a.episodeDate > b.episodeDate ? -1 : a.name.localeCompare(b.name)));
}

export async function getPersona(slug: string): Promise<PersonaPackage | null> {
  const map = await load();
  return map.get(slug) ?? null;
}
