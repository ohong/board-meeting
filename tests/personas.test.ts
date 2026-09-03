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
