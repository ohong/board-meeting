import { describe, expect, it } from "vitest";
import { CATALOG, DEMO_SLUGS, matchMemberByName, searchCatalog } from "../lib/catalog";
import { PERSONA_PACKAGES } from "../lib/personas.generated";
import { newSession } from "./helpers";
import { MAX_BOARD, MIN_BOARD } from "../lib/session";

describe("adviser catalog", () => {
  it("is the frozen Senra guest roster and every entry maps to an eve agent package", () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(30);
    const slugs = new Set(CATALOG.map((member) => member.slug));
    expect(slugs.size).toBe(CATALOG.length);
    for (const member of CATALOG) {
      expect(PERSONA_PACKAGES[member.slug], `${member.slug} has no agent package`).toBeTruthy();
    }
  });

  it("finds the demo trio by name, nickname and company", () => {
    expect(searchCatalog("ek").map((m) => m.slug)).toContain("daniel-ek");
    expect(searchCatalog("DHH").map((m) => m.slug)).toContain("david-heinemeier-hansson");
    expect(searchCatalog("lulu").map((m) => m.slug)).toContain("lulu-cheng-meservey");
    expect(searchCatalog("Sequoia").map((m) => m.slug)).toContain("doug-leone");
    expect(searchCatalog("").length).toBe(CATALOG.length);
    expect(searchCatalog("nobody at all")).toHaveLength(0);
  });

  it("surfaces the demo trio first without a hidden roster", () => {
    expect(CATALOG.slice(0, DEMO_SLUGS.length).map((m) => m.slug)).toEqual([...DEMO_SLUGS]);
  });

  it("resolves an @mention to a seated adviser by first name or nickname", () => {
    const seated = ["daniel-ek", "david-heinemeier-hansson", "lulu-cheng-meservey"];
    expect(matchMemberByName("@Lulu", seated)?.slug).toBe("lulu-cheng-meservey");
    expect(matchMemberByName("DHH", seated)?.slug).toBe("david-heinemeier-hansson");
    expect(matchMemberByName("Daniel Ek", seated)?.slug).toBe("daniel-ek");
    expect(matchMemberByName("Sam Altman", seated)).toBeUndefined();
  });
});

describe("board selection", () => {
  it("requires three advisers and caps the table at six", () => {
    const session = newSession();
    expect(session.getState().phase).toBe("select");

    const first = CATALOG.slice(0, MAX_BOARD + 1).map((member) => member.slug);
    const results = first.map((slug) => session.toggleMember(slug));

    expect(results.slice(0, MAX_BOARD).every((result) => result.ok)).toBe(true);
    expect(results[MAX_BOARD].ok).toBe(false);
    expect(session.getState().selected).toHaveLength(MAX_BOARD);
    expect(session.getState().selectionMessage).toMatch(/table seats 6/i);
  });

  it("blocks the briefing step below the minimum and allows deselection before the meeting", () => {
    const session = newSession();
    session.toggleMember("daniel-ek");
    session.toggleMember("rick-rubin");
    expect(session.goToBrief().ok).toBe(false);
    expect(session.getState().selectionMessage).toContain(String(MIN_BOARD));

    session.toggleMember("dana-white");
    expect(session.goToBrief().ok).toBe(true);

    session.toggleMember("rick-rubin");
    expect(session.getState().selected).not.toContain("rick-rubin");
    expect(session.canStart()).toBe(false);

    session.toggleMember("jason-fried");
    session.setBriefing("Should we move the company to Lisbon?");
    expect(session.canStart()).toBe(true);
  });

  it("locks the board once the meeting starts", async () => {
    const session = newSession();
    session.toggleMember("daniel-ek");
    session.toggleMember("david-heinemeier-hansson");
    session.toggleMember("lulu-cheng-meservey");
    session.goToBrief();
    session.useExampleDecision();
    await session.startMeeting();

    const result = session.toggleMember("sam-altman");
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/locked/i);
    expect(session.getState().members).toHaveLength(3);
  });
});
