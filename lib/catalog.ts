import type { CatalogMember } from "./types";

export const CATALOG_FROZEN_ON = "2026-09-03";

export const CATALOG: CatalogMember[] = [
  {
    slug: "daniel-ek",
    name: "Daniel Ek",
    aliases: ["Ek", "Spotify"],
    role: "Co-founder & CEO, Spotify",
    initials: "DE",
    featured: true,
  },
  {
    slug: "david-heinemeier-hansson",
    name: "David Heinemeier Hansson",
    aliases: ["DHH", "Hansson", "37signals", "Basecamp"],
    role: "Co-founder, 37signals",
    initials: "DH",
    featured: true,
  },
  {
    slug: "lulu-cheng-meservey",
    name: "Lulu Cheng Meservey",
    aliases: ["Lulu", "Meservey", "Rostra"],
    role: "Founder, Rostra",
    initials: "LM",
    featured: true,
  },
  { slug: "doug-leone", name: "Doug Leone", aliases: ["Leone", "Sequoia"], role: "Partner, Sequoia Capital", initials: "DL" },
  { slug: "torsten-reil", name: "Torsten Reil", aliases: ["Reil", "Helsing"], role: "Co-founder & Co-CEO, Helsing", initials: "TR" },
  { slug: "sam-altman", name: "Sam Altman", aliases: ["Altman", "OpenAI"], role: "Co-founder & CEO, OpenAI", initials: "SA" },
  { slug: "travis-kalanick", name: "Travis Kalanick", aliases: ["Kalanick", "Uber", "Atoms"], role: "Founder, Uber & Atoms", initials: "TK" },
  { slug: "michael-ovitz", name: "Michael Ovitz", aliases: ["Ovitz", "CAA", "Creative Artists Agency"], role: "Co-founder, CAA", initials: "MO" },
  { slug: "micky-malka", name: "Micky Malka", aliases: ["Malka", "Ribbit"], role: "Founder, Ribbit Capital", initials: "MM" },
  { slug: "jeff-zalaznick", name: "Jeff Zalaznick", aliases: ["Zalaznick", "Carbone"], role: "Co-founder, Major Food Group", initials: "JZ" },
  { slug: "eric-glyman", name: "Eric Glyman", aliases: ["Glyman", "Ramp"], role: "Co-founder & Co-CEO, Ramp", initials: "EG" },
  { slug: "jonathan-ross", name: "Jonathan Ross", aliases: ["Ross", "Groq"], role: "Founder, Groq", initials: "JR" },
  { slug: "scott-wu", name: "Scott Wu", aliases: ["Wu", "Cognition"], role: "Co-founder & CEO, Cognition", initials: "SW" },
  { slug: "steve-stoute", name: "Steve Stoute", aliases: ["Stoute", "Translation"], role: "Founder & CEO, Translation", initials: "SS" },
  { slug: "ed-catmull", name: "Ed Catmull", aliases: ["Catmull", "Pixar"], role: "Co-founder, Pixar", initials: "EC" },
  { slug: "gustav-soderstrom", name: "Gustav Söderström", aliases: ["Soderstrom", "Söderström", "Gustav"], role: "Co-CEO, Spotify", initials: "GS" },
  { slug: "ivanka-trump", name: "Ivanka Trump", aliases: ["Ivanka"], role: "Businesswoman", initials: "IT" },
  { slug: "rick-rubin", name: "Rick Rubin", aliases: ["Rubin"], role: "Producer, Def Jam / American Recordings", initials: "RR" },
  { slug: "strauss-zelnick", name: "Strauss Zelnick", aliases: ["Zelnick", "Take-Two"], role: "Chairman & CEO, Take-Two Interactive", initials: "SZ" },
  { slug: "dana-white", name: "Dana White", aliases: ["White", "UFC"], role: "President & CEO, UFC", initials: "DW" },
  { slug: "adam-foroughi", name: "Adam Foroughi", aliases: ["Foroughi", "AppLovin"], role: "Co-founder & CEO, AppLovin", initials: "AF" },
  { slug: "david-baszucki", name: "David Baszucki", aliases: ["Baszucki", "Roblox"], role: "Co-founder & CEO, Roblox", initials: "DB" },
  { slug: "evan-spiegel", name: "Evan Spiegel", aliases: ["Spiegel", "Snap"], role: "Co-founder & CEO, Snap Inc.", initials: "ES" },
  { slug: "tony-xu", name: "Tony Xu", aliases: ["Xu", "DoorDash"], role: "Co-founder & CEO, DoorDash", initials: "TX" },
  { slug: "eric-jorgenson", name: "Eric Jorgenson", aliases: ["Jorgenson", "Almanack"], role: "Author & CEO, Scribe Media", initials: "EJ" },
  { slug: "marc-andreessen", name: "Marc Andreessen", aliases: ["Andreessen", "a16z", "pmarca"], role: "Co-founder, a16z", initials: "MA" },
  { slug: "brian-armstrong", name: "Brian Armstrong", aliases: ["Armstrong", "Coinbase"], role: "Co-founder & CEO, Coinbase", initials: "BA" },
  { slug: "jason-fried", name: "Jason Fried", aliases: ["Fried", "Basecamp"], role: "Co-founder & CEO, 37signals", initials: "JF" },
  { slug: "jimmy-iovine", name: "Jimmy Iovine", aliases: ["Iovine", "Interscope", "Beats"], role: "Co-founder, Interscope Records and Beats", initials: "JI" },
  { slug: "tobi-lutke", name: "Tobi Lütke", aliases: ["Lutke", "Tobi", "Shopify"], role: "Co-founder & CEO, Shopify", initials: "TL" },
  { slug: "john-mackey", name: "John Mackey", aliases: ["Mackey", "Whole Foods"], role: "Co-founder, Whole Foods Market", initials: "JM" },
  { slug: "patrick-oshaughnessy", name: "Patrick O'Shaughnessy", aliases: ["O'Shaughnessy", "Colossus"], role: "Founder, Colossus / Positive Sum", initials: "PO" },
  { slug: "james-dyson", name: "James Dyson", aliases: ["Dyson"], role: "Founder, Dyson", initials: "JD" },
  { slug: "todd-graves", name: "Todd Graves", aliases: ["Graves", "Raising Cane"], role: "Founder & CEO, Raising Cane's", initials: "TG" },
  { slug: "brad-jacobs", name: "Brad Jacobs", aliases: ["Jacobs", "XPO", "QXO"], role: "Chairman & CEO, QXO", initials: "BJ" },
  { slug: "michael-dell", name: "Michael Dell", aliases: ["Dell"], role: "Founder, Chairman & CEO, Dell Technologies", initials: "MD" },
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
