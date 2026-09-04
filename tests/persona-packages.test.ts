import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CATALOG } from "../lib/catalog";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const subagentsRoot = path.join(repositoryRoot, "agent", "subagents");
const selectableSlugs = CATALOG.map((member) => member.slug);
const oldPersonaStub = "Persona package lives in lib/personas.ts";

function packagePath(slug: string, filename: string): string {
  return path.join(subagentsRoot, slug, filename);
}

function readPackageFile(slug: string, filename: string): string {
  const filePath = packagePath(slug, filename);
  expect(existsSync(filePath), `${slug} must include ${filename}`).toBe(true);
  const contents = readFileSync(filePath, "utf8");
  expect(contents.trim(), `${slug}/${filename} must not be empty`).not.toBe("");
  return contents;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function expectEveryRequirement(
  contents: string,
  requirements: ReadonlyArray<readonly [string, RegExp]>,
  context: string,
): void {
  for (const [label, pattern] of requirements) {
    expect(
      pattern.test(contents),
      `${context} must contain ${label}`,
    ).toBe(true);
  }
}

function evaluationContents(slug: string): string {
  const files = ["evaluation.md", "evals.md"].filter((filename) =>
    existsSync(packagePath(slug, filename)),
  );
  expect(files.length, `${slug} must include evaluation.md or evals.md`).toBeGreaterThan(0);
  return files.map((filename) => readPackageFile(slug, filename)).join("\n");
}

function subagentDirectories(): string[] {
  return readdirSync(subagentsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "secretary")
    .map((entry) => entry.name)
    .sort();
}

describe("board-member persona packages", () => {
  it("keeps selectable catalog members and Eve subagents in parity", () => {
    expect(selectableSlugs).toHaveLength(36);
    expect(new Set(selectableSlugs).size).toBe(selectableSlugs.length);
    expect(subagentDirectories()).toEqual([...selectableSlugs].sort());
  });

  it.each(selectableSlugs)("provides an Eve agent and instructions for %s", (slug) => {
    const agentSource = readPackageFile(slug, "agent.ts");
    readPackageFile(slug, "instructions.md");

    expect(agentSource, `${slug}/agent.ts must import Eve`).toMatch(/from\s+["']eve["']/);
    expect(agentSource, `${slug}/agent.ts must declare an Eve agent`).toMatch(
      /\bdefineAgent\s*\(/,
    );
  });

  it.each(selectableSlugs)(
    "keeps the researched persona contract complete for %s",
    (slug) => {
      const member = CATALOG.find((candidate) => candidate.slug === slug);
      expect(member, `catalog entry for ${slug}`).toBeDefined();

      const instructions = readPackageFile(slug, "instructions.md");
      const research = readPackageFile(slug, "research.md");
      const evaluation = evaluationContents(slug);
      const memberName = member?.name ?? slug;
      const identityPattern = new RegExp(
        `\\b(?:you are|i am)\\s+${escapeRegExp(memberName)}`,
        "i",
      );
      const episodePattern = new RegExp(
        `https://www\\.davidsenra\\.com/episode/${escapeRegExp(slug)}(?:-[a-z0-9]+)*(?=$|[^a-z0-9-])`,
        "i",
      );

      expect(instructions, `${slug}/instructions.md must identify the member`).toMatch(
        identityPattern,
      );
      expect(instructions, `${slug}/instructions.md must include generated metadata`).toMatch(
        /\bgenerated\b/i,
      );
      expect(
        instructions,
        `${slug}/instructions.md must include prompt-version metadata`,
      ).toMatch(/\bprompt[_ -]?version\b/i);
      expect(instructions, `${slug}/instructions.md must not retain the old stub`).not.toContain(
        oldPersonaStub,
      );

      expectEveryRequirement(
        instructions,
        [
          ["a worldview section", /^#{1,6}\s+[^\n]*worldview\b/im],
          ["decision heuristics", /^#{1,6}\s+[^\n]*(?:decision heuristics|diagnostic questions)\b/im],
          ["a voice or tone section", /^#{1,6}\s+[^\n]*(?:voice|tone)\b/im],
          ["lead guidance", /\blead\b/i],
          ["caution guidance", /\bcaution\w*\b|\bcautious\w*\b/i],
          ["defer guidance", /\bdefer\b/i],
          ["a boundaries section", /^#{1,6}\s+[^\n]*boundar(?:y|ies)\b/im],
          ["the independent-position phase", /\bindependent position\b/i],
          ["the open-discussion phase", /\bopen discussion\b/i],
          [
            "the position-updates phase",
            /\bposition updates?\b|\bupdate (?:the )?position\b|\bwhen persuaded\b/i,
          ],
          ["the closing-comment phase", /\bclosing comment\b|\bclose with\b|\bclosing\b/i],
        ],
        `${slug}/instructions.md`,
      );

      expect(research, `${slug}/research.md must cite the official Senra episode`).toMatch(
        episodePattern,
      );
      expect(research, `${slug}/research.md must mention the canonical transcript`).toMatch(
        /\btranscript\b/i,
      );
      if (slug === "travis-kalanick") {
        expect(
          research,
          "Travis's research must preserve the official Senra-linked video provenance",
        ).toMatch(/https:\/\/www\.youtube\.com\/watch\?v=QVnU5lGlKE8/i);
        expect(
          research,
          "Travis's research must identify the YouTube captions as transcript evidence",
        ).toMatch(/(?:auto[- ]generated captions|transcript fallback|caption[^\n]{0,80}transcript)/i);
      }
      expectEveryRequirement(
        research,
        [
          [
            "documented evidence",
            /(?:^#{1,6}\s+[^\n]*evidence\b|\[\s*evidence\b|\bevidence\s*:\s*)/im,
          ],
          [
            "responsible inference",
            /(?:^#{1,6}\s+[^\n]*inference\b|\[\s*inference\b|\binference[- ]heavy\b|\binference\b)/im,
          ],
          ["a source section", /^#{1,6}\s+[^\n]*sources?\b/im],
          ["a coverage section", /^#{1,6}\s+[^\n]*(?:coverage|gaps)\b/im],
        ],
        `${slug}/research.md`,
      );

      expectEveryRequirement(
        evaluation,
        [
          ["a startup case", /\bstartup\b/i],
          ["a career case", /\bcareer\b/i],
          ["a personal case", /\bpersonal\b/i],
          [
            "an out-of-domain case",
            /\bout[- ]of[- ]domain\b|\boutside(?: the)?(?: core)? expertise\b|\boutside expertise\b|\boutside core\b/i,
          ],
          ["comparative analysis", /\bcomparative\b/i],
          ["a direct @mention case", /@mention|direct(?:ly)?\s+(?:address|mention)/i],
          ["an interruption case", /\binterrupt(?:ion|ed|ing)?\b/i],
          ["a persuasion or position-update case", /\bpersua(?:de|sion|sive|ded|ding)\b/i],
          ["a closing case", /\bclosing\b/i],
          ["a pass case or criterion", /\bpass(?:es|ed|ing)?\b/i],
          [
            "quote verification or audit",
            /\b(?:quote|quotation)\w*\b[\s\S]{0,120}\b(?:verif\w*|audit\w*|attribut\w*|check\w*|match\w*|manual\w*)\b|\b(?:verif\w*|audit\w*|attribut\w*|check\w*|match\w*|manual\w*)\b[\s\S]{0,120}\b(?:quote|quotation)\w*\b/i,
          ],
          [
            "live-run status",
            /(?:live[ -]?run|live model|runtime verification|no live|not yet run|not run|unverified)/i,
          ],
        ],
        `${slug}/evaluation.md or evals.md`,
      );
    },
  );

});
