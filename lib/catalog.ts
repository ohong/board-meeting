import type { CatalogMember } from "./types";

/**
 * The roster is the set of guests published on David Senra's guest list on this date. It is
 * a build-time constant; the app never fetches the roster at runtime.
 */
export const CATALOG_FROZEN_ON = "2026-09-03";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Formatted without Intl so the server and client render the same string. */
export function frozenOnLabel(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

export const CATALOG: CatalogMember[] = [
  {
    slug: "daniel-ek",
    name: "Daniel Ek",
    aliases: ["Ek", "Spotify"],
    role: "Co-founder & CEO, Spotify",
    house: "Spotify",
    initials: "DE",
    lens: "Freemium loops, and patience measured in decades",
    portrait: true,
    featured: true,
  },
  {
    slug: "david-heinemeier-hansson",
    name: "David Heinemeier Hansson",
    aliases: ["DHH", "Hansson", "37signals", "Basecamp"],
    role: "Co-founder, 37signals",
    house: "37signals",
    initials: "DH",
    lens: "Charge for it, and stop running two products",
    portrait: true,
    featured: true,
  },
  {
    slug: "lulu-cheng-meservey",
    name: "Lulu Cheng Meservey",
    aliases: ["Lulu", "Meservey", "Rostra"],
    role: "Founder, Rostra",
    house: "Rostra",
    initials: "LM",
    lens: "What people will repeat on Monday morning",
    portrait: true,
    featured: true,
  },
  { slug: "doug-leone", name: "Doug Leone", aliases: ["Leone", "Sequoia"], role: "Partner, Sequoia Capital", house: "Sequoia", initials: "DL", lens: "Whether you are being honest with yourself" },
  { slug: "torsten-reil", name: "Torsten Reil", aliases: ["Reil", "Helsing"], role: "Co-founder & Co-CEO, Helsing", house: "Helsing", initials: "TR", lens: "Which constraint is actually binding" },
  { slug: "sam-altman", name: "Sam Altman", aliases: ["Altman", "OpenAI"], role: "Co-founder & CEO, OpenAI", house: "OpenAI", initials: "SA", lens: "Whether the question you are asking is big enough", portrait: true },
  { slug: "travis-kalanick", name: "Travis Kalanick", aliases: ["Kalanick", "Uber", "Atoms"], role: "Founder, Uber & Atoms", house: "Uber", initials: "TK", lens: "Where the demand is hiding, and how fast" },
  { slug: "michael-ovitz", name: "Michael Ovitz", aliases: ["Ovitz", "CAA"], role: "Co-founder, CAA", house: "CAA", initials: "MO", lens: "Leverage, and what you are giving away for free", portrait: true },
  { slug: "micky-malka", name: "Micky Malka", aliases: ["Malka", "Ribbit"], role: "Founder, Ribbit Capital", house: "Ribbit", initials: "MM", lens: "What this looks like in the bad year", portrait: true },
  { slug: "jeff-zalaznick", name: "Jeff Zalaznick", aliases: ["Zalaznick", "Carbone"], role: "Co-founder, Major Food Group", house: "Major Food", initials: "JZ", lens: "How the change feels to the person receiving it" },
  { slug: "eric-glyman", name: "Eric Glyman", aliases: ["Glyman", "Ramp"], role: "Co-founder & Co-CEO, Ramp", house: "Ramp", initials: "EG", lens: "The number that would settle this, this week" },
  { slug: "jonathan-ross", name: "Jonathan Ross", aliases: ["Ross", "Groq"], role: "Founder, Groq", house: "Groq", initials: "JR", lens: "The assumption everyone inherited and nobody rechecked", portrait: true },
  { slug: "scott-wu", name: "Scott Wu", aliases: ["Wu", "Cognition"], role: "Co-founder & CEO, Cognition", house: "Cognition", initials: "SW", lens: "What happens when the capability is ten times better", portrait: true },
  { slug: "steve-stoute", name: "Steve Stoute", aliases: ["Stoute", "Translation"], role: "Founder & CEO, Translation", house: "Translation", initials: "SS", lens: "Whether this makes you look serious or cheap", portrait: true },
  { slug: "ed-catmull", name: "Ed Catmull", aliases: ["Catmull", "Pixar"], role: "Co-founder, Pixar", house: "Pixar", initials: "EC", lens: "Whether anyone here can say the uncomfortable thing", portrait: true },
  { slug: "gustav-soderstrom", name: "Gustav Söderström", aliases: ["Soderstrom", "Söderström", "Gustav"], role: "Co-CEO, Spotify", house: "Spotify", initials: "GS", lens: "What happens on day one, not day thirty" },
  { slug: "ivanka-trump", name: "Ivanka Trump", aliases: ["Ivanka"], role: "Businesswoman", house: "Investor", initials: "IT", lens: "Who this alienates, and the week after" },
  { slug: "rick-rubin", name: "Rick Rubin", aliases: ["Rubin"], role: "Producer, Def Jam / American Recordings", house: "Def Jam", initials: "RR", lens: "What it is once you take everything away", portrait: true },
  { slug: "strauss-zelnick", name: "Strauss Zelnick", aliases: ["Zelnick", "Take-Two"], role: "Chairman & CEO, Take-Two Interactive", house: "Take-Two", initials: "SZ", lens: "The downside, priced before the upside" },
  { slug: "dana-white", name: "Dana White", aliases: ["White", "UFC"], role: "President & CEO, UFC", house: "UFC", initials: "DW", lens: "Who is paying, and who is being carried" },
  { slug: "adam-foroughi", name: "Adam Foroughi", aliases: ["Foroughi", "AppLovin"], role: "Co-founder & CEO, AppLovin", house: "AppLovin", initials: "AF", lens: "The cohort, not the total" },
  { slug: "david-baszucki", name: "David Baszucki", aliases: ["Baszucki", "Roblox"], role: "Co-founder & CEO, Roblox", house: "Roblox", initials: "DB", lens: "Who creates the value, and what that costs them" },
  { slug: "evan-spiegel", name: "Evan Spiegel", aliases: ["Spiegel", "Snap"], role: "Co-founder & CEO, Snap Inc.", house: "Snap", initials: "ES", lens: "Whether it reads as generous or as a withdrawal" },
  { slug: "tony-xu", name: "Tony Xu", aliases: ["Xu", "DoorDash"], role: "Co-founder & CEO, DoorDash", house: "DoorDash", initials: "TX", lens: "What one more unit of this actually costs to serve" },
  { slug: "eric-jorgenson", name: "Eric Jorgenson", aliases: ["Jorgenson", "Almanack"], role: "Author & CEO, Scribe Media", house: "Almanack", initials: "EJ", lens: "The rule this decision sets for next time" },
  { slug: "marc-andreessen", name: "Marc Andreessen", aliases: ["Andreessen", "a16z", "pmarca"], role: "Co-founder, a16z", house: "a16z", initials: "MA", lens: "Whether this is a strategy or a flinch", portrait: true },
  { slug: "brian-armstrong", name: "Brian Armstrong", aliases: ["Armstrong", "Coinbase"], role: "Co-founder & CEO, Coinbase", house: "Coinbase", initials: "BA", lens: "The policy, applied consistently, written down" },
  { slug: "jason-fried", name: "Jason Fried", aliases: ["Fried", "Basecamp"], role: "Co-founder & CEO, 37signals", house: "37signals", initials: "JF", lens: "What your team's week actually looks like" },
  { slug: "jimmy-iovine", name: "Jimmy Iovine", aliases: ["Iovine", "Interscope", "Beats"], role: "Co-founder, Interscope Records and Beats", house: "Interscope", initials: "JI", lens: "Who the artist is, and whether it feels expensive" },
  { slug: "tobi-lutke", name: "Tobi Lütke", aliases: ["Lutke", "Tobi", "Shopify"], role: "Co-founder & CEO, Shopify", house: "Shopify", initials: "TL", lens: "Whether the customer ends up with more leverage" },
  { slug: "john-mackey", name: "John Mackey", aliases: ["Mackey", "Whole Foods"], role: "Co-founder, Whole Foods Market", house: "Whole Foods", initials: "JM", lens: "Who bears the cost, and would you say it out loud" },
  { slug: "patrick-oshaughnessy", name: "Patrick O'Shaughnessy", aliases: ["O'Shaughnessy", "Colossus"], role: "Founder, Colossus / Positive Sum", house: "Colossus", initials: "PO", lens: "What would have to be true" },
  { slug: "james-dyson", name: "James Dyson", aliases: ["Dyson"], role: "Founder, Dyson", house: "Dyson", initials: "JD", lens: "The problem underneath the packaging" },
  { slug: "todd-graves", name: "Todd Graves", aliases: ["Graves", "Raising Cane"], role: "Founder & CEO, Raising Cane's", house: "Raising Cane's", initials: "TG", lens: "The one thing, and who is protecting it" },
  { slug: "brad-jacobs", name: "Brad Jacobs", aliases: ["Jacobs", "XPO", "QXO"], role: "Chairman & CEO, QXO", house: "QXO", initials: "BJ", lens: "What behaviour you are currently paying for" },
  { slug: "michael-dell", name: "Michael Dell", aliases: ["Dell"], role: "Founder, Chairman & CEO, Dell Technologies", house: "Dell", initials: "MD", lens: "Closer to the customer, or further away" },
];

export const DEMO_SLUGS = [
  "daniel-ek",
  "david-heinemeier-hansson",
  "lulu-cheng-meservey",
] as const;

/**
 * Searches names, roles, companies and the lens line, so the roster can be browsed by the
 * judgment someone wants in the room ("pricing", "trust", "focus") and not only by name.
 */
export function searchCatalog(query: string): CatalogMember[] {
  const q = query.trim().toLowerCase();
  if (!q) return CATALOG;
  return CATALOG.filter((member) => {
    const haystack = [member.name, member.role, member.house, member.lens, member.slug, ...member.aliases]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getMember(slug: string): CatalogMember | undefined {
  return CATALOG.find((m) => m.slug === slug);
}

/** Below this, only an exact name or alias counts: "@a" must not seat the first A it finds. */
const MIN_PARTIAL_NAME = 3;

export function matchMemberByName(name: string, slugs: string[]): CatalogMember | undefined {
  const q = name.trim().toLowerCase().replace(/^@/, "");
  if (!q) return undefined;
  const pool = slugs.map((s) => getMember(s)).filter(Boolean) as CatalogMember[];
  const exact =
    pool.find((m) => m.name.toLowerCase() === q) ||
    pool.find((m) => m.aliases.some((a) => a.toLowerCase() === q));
  if (exact || q.length < MIN_PARTIAL_NAME) return exact;
  return (
    pool.find((m) => m.name.toLowerCase().includes(q) || q.includes(m.name.toLowerCase())) ||
    pool.find((m) => m.aliases.some((a) => a.toLowerCase().includes(q)))
  );
}
