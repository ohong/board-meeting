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
    portrait: true,
    featured: true,
  },
  { slug: "doug-leone", name: "Doug Leone", aliases: ["Leone", "Sequoia"], role: "Partner, Sequoia Capital", house: "Sequoia", initials: "DL" },
  { slug: "torsten-reil", name: "Torsten Reil", aliases: ["Reil", "Helsing"], role: "Co-founder & Co-CEO, Helsing", house: "Helsing", initials: "TR" },
  { slug: "sam-altman", name: "Sam Altman", aliases: ["Altman", "OpenAI"], role: "Co-founder & CEO, OpenAI", house: "OpenAI", initials: "SA", portrait: true },
  { slug: "travis-kalanick", name: "Travis Kalanick", aliases: ["Kalanick", "Uber", "Atoms"], role: "Founder, Uber & Atoms", house: "Uber", initials: "TK" },
  { slug: "michael-ovitz", name: "Michael Ovitz", aliases: ["Ovitz", "CAA"], role: "Co-founder, CAA", house: "CAA", initials: "MO", portrait: true },
  { slug: "micky-malka", name: "Micky Malka", aliases: ["Malka", "Ribbit"], role: "Founder, Ribbit Capital", house: "Ribbit", initials: "MM", portrait: true },
  { slug: "jeff-zalaznick", name: "Jeff Zalaznick", aliases: ["Zalaznick", "Carbone"], role: "Co-founder, Major Food Group", house: "Major Food", initials: "JZ" },
  { slug: "eric-glyman", name: "Eric Glyman", aliases: ["Glyman", "Ramp"], role: "Co-founder & Co-CEO, Ramp", house: "Ramp", initials: "EG" },
  { slug: "jonathan-ross", name: "Jonathan Ross", aliases: ["Ross", "Groq"], role: "Founder, Groq", house: "Groq", initials: "JR", portrait: true },
  { slug: "scott-wu", name: "Scott Wu", aliases: ["Wu", "Cognition"], role: "Co-founder & CEO, Cognition", house: "Cognition", initials: "SW", portrait: true },
  { slug: "steve-stoute", name: "Steve Stoute", aliases: ["Stoute", "Translation"], role: "Founder & CEO, Translation", house: "Translation", initials: "SS", portrait: true },
  { slug: "ed-catmull", name: "Ed Catmull", aliases: ["Catmull", "Pixar"], role: "Co-founder, Pixar", house: "Pixar", initials: "EC", portrait: true },
  { slug: "gustav-soderstrom", name: "Gustav Söderström", aliases: ["Soderstrom", "Söderström", "Gustav"], role: "Co-CEO, Spotify", house: "Spotify", initials: "GS" },
  { slug: "ivanka-trump", name: "Ivanka Trump", aliases: ["Ivanka"], role: "Businesswoman", house: "Investor", initials: "IT" },
  { slug: "rick-rubin", name: "Rick Rubin", aliases: ["Rubin"], role: "Producer, Def Jam / American Recordings", house: "Def Jam", initials: "RR", portrait: true },
  { slug: "strauss-zelnick", name: "Strauss Zelnick", aliases: ["Zelnick", "Take-Two"], role: "Chairman & CEO, Take-Two Interactive", house: "Take-Two", initials: "SZ" },
  { slug: "dana-white", name: "Dana White", aliases: ["White", "UFC"], role: "President & CEO, UFC", house: "UFC", initials: "DW" },
  { slug: "adam-foroughi", name: "Adam Foroughi", aliases: ["Foroughi", "AppLovin"], role: "Co-founder & CEO, AppLovin", house: "AppLovin", initials: "AF" },
  { slug: "david-baszucki", name: "David Baszucki", aliases: ["Baszucki", "Roblox"], role: "Co-founder & CEO, Roblox", house: "Roblox", initials: "DB" },
  { slug: "evan-spiegel", name: "Evan Spiegel", aliases: ["Spiegel", "Snap"], role: "Co-founder & CEO, Snap Inc.", house: "Snap", initials: "ES" },
  { slug: "tony-xu", name: "Tony Xu", aliases: ["Xu", "DoorDash"], role: "Co-founder & CEO, DoorDash", house: "DoorDash", initials: "TX" },
  { slug: "eric-jorgenson", name: "Eric Jorgenson", aliases: ["Jorgenson", "Almanack"], role: "Author & CEO, Scribe Media", house: "Almanack", initials: "EJ" },
  { slug: "marc-andreessen", name: "Marc Andreessen", aliases: ["Andreessen", "a16z", "pmarca"], role: "Co-founder, a16z", house: "a16z", initials: "MA", portrait: true },
  { slug: "brian-armstrong", name: "Brian Armstrong", aliases: ["Armstrong", "Coinbase"], role: "Co-founder & CEO, Coinbase", house: "Coinbase", initials: "BA" },
  { slug: "jason-fried", name: "Jason Fried", aliases: ["Fried", "Basecamp"], role: "Co-founder & CEO, 37signals", house: "37signals", initials: "JF" },
  { slug: "jimmy-iovine", name: "Jimmy Iovine", aliases: ["Iovine", "Interscope", "Beats"], role: "Co-founder, Interscope Records and Beats", house: "Interscope", initials: "JI" },
  { slug: "tobi-lutke", name: "Tobi Lütke", aliases: ["Lutke", "Tobi", "Shopify"], role: "Co-founder & CEO, Shopify", house: "Shopify", initials: "TL" },
  { slug: "john-mackey", name: "John Mackey", aliases: ["Mackey", "Whole Foods"], role: "Co-founder, Whole Foods Market", house: "Whole Foods", initials: "JM" },
  { slug: "patrick-oshaughnessy", name: "Patrick O'Shaughnessy", aliases: ["O'Shaughnessy", "Colossus"], role: "Founder, Colossus / Positive Sum", house: "Colossus", initials: "PO" },
  { slug: "james-dyson", name: "James Dyson", aliases: ["Dyson"], role: "Founder, Dyson", house: "Dyson", initials: "JD" },
  { slug: "todd-graves", name: "Todd Graves", aliases: ["Graves", "Raising Cane"], role: "Founder & CEO, Raising Cane's", house: "Raising Cane's", initials: "TG" },
  { slug: "brad-jacobs", name: "Brad Jacobs", aliases: ["Jacobs", "XPO", "QXO"], role: "Chairman & CEO, QXO", house: "QXO", initials: "BJ" },
  { slug: "michael-dell", name: "Michael Dell", aliases: ["Dell"], role: "Founder, Chairman & CEO, Dell Technologies", house: "Dell", initials: "MD" },
];

export const DEMO_SLUGS = [
  "daniel-ek",
  "david-heinemeier-hansson",
  "lulu-cheng-meservey",
] as const;

export function searchCatalog(query: string): CatalogMember[] {
  const q = query.trim().toLowerCase();
  if (!q) return CATALOG;
  return CATALOG.filter((m) => {
    const hay = [m.name, m.role, m.slug, ...m.aliases].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

export function getMember(slug: string): CatalogMember | undefined {
  return CATALOG.find((m) => m.slug === slug);
}

export function matchMemberByName(name: string, slugs: string[]): CatalogMember | undefined {
  const q = name.trim().toLowerCase().replace(/^@/, "");
  const pool = slugs.map((s) => getMember(s)).filter(Boolean) as CatalogMember[];
  return (
    pool.find((m) => m.name.toLowerCase() === q) ||
    pool.find((m) => m.aliases.some((a) => a.toLowerCase() === q)) ||
    pool.find((m) => m.name.toLowerCase().includes(q) || q.includes(m.name.toLowerCase())) ||
    pool.find((m) => m.aliases.some((a) => a.toLowerCase().includes(q)))
  );
}
