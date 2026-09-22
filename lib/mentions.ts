import { matchMemberByName } from "./catalog";

const NAME_WORD = /^[A-Za-z][A-Za-z'’.-]*$/;

/**
 * Finds the first @mention in a message that resolves to a seated adviser. A mention can be
 * one to three words ("@Lulu", "@Daniel Ek", "@Patrick O'Shaughnessy"), so each candidate is
 * tried longest-first and the rest of the sentence is left alone.
 */
export function extractMention(text: string, seatedSlugs: string[]): string | undefined {
  for (const match of text.matchAll(/@([^\s@]+(?:\s+[^\s@]+){0,2})/g)) {
    const words = match[1]
      .split(/\s+/)
      .map((word) => word.replace(/[^A-Za-z'’.-]+$/, ""))
      .filter(Boolean);

    for (let length = Math.min(3, words.length); length >= 1; length -= 1) {
      const candidate = words.slice(0, length);
      if (!candidate.every((word) => NAME_WORD.test(word))) continue;
      const member = matchMemberByName(candidate.join(" "), seatedSlugs);
      if (member) return member.slug;
    }
  }
  return undefined;
}
