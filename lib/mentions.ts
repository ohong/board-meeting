import { matchMemberByName } from "./catalog";

export function extractMention(text: string, selectedSlugs: string[]): string | undefined {
  const matches = text.match(/@([A-Za-z][A-Za-z0-9.' -]{0,60})/g);
  if (!matches) return undefined;
  for (const raw of matches) {
    const member = matchMemberByName(raw, selectedSlugs);
    if (member) return member.slug;
  }
  return undefined;
}
