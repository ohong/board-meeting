import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderRegistry } from "../scripts/build-personas.mjs";
import { CATALOG } from "../lib/catalog";
import { PERSONA_PACKAGES } from "../lib/personas.generated";
import { memberSystemPrompt, secretarySystemPrompt } from "../lib/personas";
import { extractMention } from "../lib/mentions";

describe("eve agent packages", () => {
  it("keeps the committed registry in sync with the authored packages", () => {
    const onDisk = readFileSync(join(process.cwd(), "lib/personas.generated.ts"), "utf8");
    expect(onDisk, "run `bun run personas` after editing an agent package").toBe(renderRegistry());
  });

  it("gives every adviser a substantial, unique package with a declared model", () => {
    const instructions = new Set<string>();
    for (const member of CATALOG) {
      const persona = PERSONA_PACKAGES[member.slug];
      expect(persona, member.slug).toBeTruthy();
      expect(persona.instructions.length, member.slug).toBeGreaterThan(900);
      expect(persona.model, member.slug).toMatch(/^openai\//);
      expect(persona.description.length, member.slug).toBeGreaterThan(40);
      expect(instructions.has(persona.instructions), `${member.slug} is a duplicate`).toBe(false);
      instructions.add(persona.instructions);
    }
  });

  it("runs the board on one model and the secretary on another", () => {
    const boardModels = new Set(CATALOG.map((member) => PERSONA_PACKAGES[member.slug].model));
    expect(boardModels.size, "the whole board should move together").toBe(1);
    expect(PERSONA_PACKAGES.secretary.model).not.toBe([...boardModels][0]);
  });

  it("hands a member their own package and nobody else's", () => {
    const ek = memberSystemPrompt("daniel-ek");
    expect(ek).toContain("Spotify");
    expect(ek).toContain("Boardroom conduct");
    expect(ek).not.toContain("37signals");
    expect(memberSystemPrompt("david-heinemeier-hansson")).toContain("37signals");
  });

  it("keeps the secretary off the table", () => {
    const prompt = secretarySystemPrompt();
    expect(prompt).toMatch(/do not hold a seat/i);
    expect(prompt).toMatch(/never manufacture consensus|Never manufacture consensus/);
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
    // Section headings and boilerplate every package carries by construction.
    "worldview", "decision", "heuristics", "voice", "boundaries", "boardroom", "conduct",
    "defer", "caution", "generated", "prompt", "version", "never", "invent", "private",
    "facts", "quotations", "memories", "member", "members", "position", "discussion",
    "transcript", "chair", "agent", "turns", "speak", "update", "explicitly",
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
    const scores: { score: number; pair: string }[] = [];
    for (let i = 0; i < advisers.length; i += 1) {
      for (let j = i + 1; j < advisers.length; j += 1) {
        scores.push({
          score: overlap(advisers[i].vocabulary, advisers[j].vocabulary),
          pair: `${advisers[i].slug} / ${advisers[j].slug}`,
        });
      }
    }
    scores.sort((a, b) => a.score - b.score);
    const median = scores[scores.length >> 1].score;
    const worst = scores[scores.length - 1];

    // Measured against the roster's own distribution rather than a fixed number, because
    // absolute overlap moves with how uniform the package template is and how much
    // vocabulary each package carries. What "collapsed into each other" means is that a
    // pair is a clear outlier: two genuinely duplicated packages score near 1.
    expect(worst.score, `most similar pair: ${worst.pair}`).toBeLessThan(median * 2);
    expect(worst.score, `most similar pair: ${worst.pair}`).toBeLessThan(0.5);
  });
});
