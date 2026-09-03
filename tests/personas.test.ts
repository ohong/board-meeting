import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderRegistry } from "../scripts/build-personas.mjs";
import { CATALOG } from "../lib/catalog";
import { BOARDROOM_CONDUCT, PERSONA_PACKAGES } from "../lib/personas.generated";
import { memberSystemPrompt, secretarySystemPrompt } from "../lib/personas";
import { extractMention } from "../lib/mentions";

describe("eve agent packages", () => {
  it("keeps the committed registry in sync with the authored packages", () => {
    const onDisk = readFileSync(join(process.cwd(), "lib/personas.generated.ts"), "utf8");
    expect(onDisk, "run `bun run personas` after editing an agent package").toBe(renderRegistry());
  });

  it("gives every adviser a distinct, substantial package with its own model", () => {
    const instructions = new Set<string>();
    for (const member of CATALOG) {
      const persona = PERSONA_PACKAGES[member.slug];
      expect(persona, member.slug).toBeTruthy();
      expect(persona.instructions.length, member.slug).toBeGreaterThan(900);
      expect(persona.model, member.slug).toMatch(/^openai\//);
      expect(persona.description.length, member.slug).toBeGreaterThan(40);
      // Behaviour, not just biography: how they decide and where they are weak.
      expect(persona.instructions, member.slug).toMatch(/How you decide/i);
      expect(persona.instructions, member.slug).toMatch(/Where you are weak/i);
      expect(persona.instructions, member.slug).toMatch(/In disagreement/i);
      expect(instructions.has(persona.instructions), `${member.slug} is a duplicate`).toBe(false);
      instructions.add(persona.instructions);
    }
  });

  it("composes a member prompt from their own package plus the shared conduct", () => {
    const prompt = memberSystemPrompt("daniel-ek");
    expect(prompt).toContain("Spotify");
    expect(prompt).toContain(BOARDROOM_CONDUCT);
    expect(prompt).not.toContain("37signals");
    expect(memberSystemPrompt("david-heinemeier-hansson")).not.toContain("Spotify in 2006");
  });

  it("keeps the secretary off the table", () => {
    const prompt = secretarySystemPrompt();
    expect(prompt).toMatch(/do not hold a seat/i);
    expect(prompt).toMatch(/never manufacture consensus|Never manufacture consensus/);
    expect(prompt).not.toContain(BOARDROOM_CONDUCT);
    expect(CATALOG.some((member) => member.slug === "secretary")).toBe(false);
  });
});

describe("@mentions", () => {
  const seated = ["daniel-ek", "david-heinemeier-hansson", "lulu-cheng-meservey"];

  it("resolves a first name inside a full sentence", () => {
    expect(extractMention("@Lulu how do we explain this without losing user trust?", seated)).toBe(
      "lulu-cheng-meservey",
    );
  });

  it("resolves multi-word names and nicknames", () => {
    expect(extractMention("Quick one for @Daniel Ek about the funnel", seated)).toBe("daniel-ek");
    expect(extractMention("@DHH, is that fair?", seated)).toBe("david-heinemeier-hansson");
  });

  it("ignores mentions of anyone not at this table", () => {
    expect(extractMention("@Sam Altman what do you think?", seated)).toBeUndefined();
    expect(extractMention("no mention here at all", seated)).toBeUndefined();
    expect(extractMention("email me at team@example.com", seated)).toBeUndefined();
  });
});

/**
 * Persona bleed is the main quality risk when every seat runs on the same model family: weak
 * packages collapse into one polished executive voice. This is a lexical proxy for that —
 * two packages that describe the same person in the same words will not behave differently.
 */
describe("persona distinctness", () => {
  const STOPWORDS = new Set([
    "about", "above", "after", "again", "against", "because", "before", "being", "below",
    "between", "both", "cannot", "could", "doing", "during", "each", "from", "further",
    "have", "having", "here", "into", "itself", "more", "most", "other", "over", "same",
    "should", "some", "such", "than", "that", "their", "them", "then", "there", "these",
    "they", "this", "those", "through", "under", "until", "very", "were", "what", "when",
    "where", "which", "while", "with", "would", "your", "yours", "yourself",
    // Shared scaffolding every package carries by construction.
    "decide", "weak", "disagreement", "voice", "know", "cold", "conduct", "boardroom",
    "together", "read", "instructions",
  ]);

  function vocabulary(text: string): Set<string> {
    const words = text.toLowerCase().match(/[a-z][a-z'-]{4,}/g) ?? [];
    return new Set(words.filter((word) => !STOPWORDS.has(word)));
  }

  function overlap(a: Set<string>, b: Set<string>): number {
    let shared = 0;
    for (const word of a) if (b.has(word)) shared += 1;
    return shared / (a.size + b.size - shared);
  }

  const advisers = CATALOG.map((member) => ({
    slug: member.slug,
    vocabulary: vocabulary(PERSONA_PACKAGES[member.slug].instructions),
  }));

  it("gives every adviser enough distinctive material to behave like themselves", () => {
    for (const adviser of advisers) {
      expect(adviser.vocabulary.size, adviser.slug).toBeGreaterThan(70);
    }
  });

  it("keeps no two advisers describing the same person in the same words", () => {
    let worst = { score: 0, pair: "" };
    for (let i = 0; i < advisers.length; i += 1) {
      for (let j = i + 1; j < advisers.length; j += 1) {
        const score = overlap(advisers[i].vocabulary, advisers[j].vocabulary);
        if (score > worst.score) worst = { score, pair: `${advisers[i].slug} / ${advisers[j].slug}` };
      }
    }
    // The genuine maximum is DHH against Jason Fried at ~0.18: they founded the same company
    // and hold the same position, and they still differ in temperament. Anything approaching
    // 0.25 is two packages that have collapsed into each other.
    expect(worst.score, `most similar pair: ${worst.pair}`).toBeLessThan(0.25);
  });
});
