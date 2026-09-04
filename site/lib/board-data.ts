export type BoardMember = {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  bio: string;
  lens: string;
  image: string;
  source: string;
  opening: string;
  followUp: string;
};

export const DEMO_QUESTION =
  'Should our B2B collaboration app eliminate its free tier and replace it with a 14-day trial?';

export const DEMO_CONTEXT =
  'We are an 18-person seed-stage company at $1.6M ARR. We have 6,000 free workspaces and 420 paying customers. Only 2.3% of free workspaces convert within 90 days, and free users generate 38% of support tickets. However, 34% of current paying customers first discovered us through a free workspace. We want faster growth and a simpler product, but we are worried about weakening word of mouth.';

export const BOARD_MEMBERS: BoardMember[] = [
  {
    id: 'daniel-ek',
    name: 'Daniel Ek',
    shortName: 'Daniel',
    initials: 'DE',
    bio: "Daniel Ek is the co-founder and CEO of Spotify who revolutionized the music industry by creating the world's largest audio streaming platform with over half a billion users and pioneering the freemium model that transformed how people consume music globally.",
    lens: 'Freemium, distribution, compounding',
    image: '/guests/daniel-ek.webp',
    source: 'https://www.davidsenra.com/episode/daniel-ek-spotify',
    opening:
      'The 2.3% conversion rate is not the whole system. Free workspaces may be your distribution network, especially if paying teams first encounter the product through collaborators. I would price the support burden before removing the acquisition loop.',
    followUp:
      'That evidence makes the free tier look more like a channel than a product plan. I would preserve the sharing loop, narrow what free teams can do, and move the upgrade moment closer to the behavior that predicts enterprise adoption.',
  },
  {
    id: 'david-heinemeier-hansson',
    name: 'David Heinemeier Hansson',
    shortName: 'DHH',
    initials: 'DHH',
    bio: 'David Heinemeier Hansson is the co-founder of 37signals, the company behind Basecamp, HEY, and ONCE.',
    lens: 'Focused products, pricing, independence',
    image: '/guests/david-heinemeier-hansson.webp',
    source: 'https://www.davidsenra.com/episode/david-heinemeier-hansson',
    opening:
      'Free users generating 38% of support tickets is a real tax on an 18-person company. But a blunt 14-day trial sounds like copying a SaaS playbook. First decide which customers you actually want, then design a simple paid product for them.',
    followUp:
      'Do not let an abstract growth curve run the company. Pick a customer you are proud to serve, calculate the cost of serving everyone else, and make the pricing tell the truth about the business you want.',
  },
  {
    id: 'lulu-cheng-meservey',
    name: 'Lulu Cheng Meservey',
    shortName: 'Lulu',
    initials: 'LCM',
    bio: 'Lulu Cheng Meservey is the founder of Rostra.',
    lens: 'Narrative, trust, communications',
    image: '/guests/lulu-cheng-meservey.webp',
    source: 'https://www.davidsenra.com/episode/lulu-cheng-meservey',
    opening:
      'A pricing change becomes a trust problem when customers discover it as a surprise. Before choosing the mechanics, write the honest story: what the free tier enabled, what it now prevents, and what existing users will keep.',
    followUp:
      'Explain the constraint before the change. Name who the product is for, show what improves because of the new model, and give existing users a generous transition. Clarity beats a euphemistic announcement about “simplifying plans.”',
  },
  {
    id: 'sam-altman',
    name: 'Sam Altman',
    shortName: 'Sam',
    initials: 'SA',
    bio: 'Sam Altman is the co-founder and CEO of OpenAI.',
    lens: 'Company building, ambition, technology',
    image: '/guests/sam-altman.webp',
    source: 'https://www.davidsenra.com/episode/sam-altman',
    opening:
      'Treat this as a reversible decision, not a referendum on freemium. Identify the leading indicator you believe the free tier creates, then run a cohort test that can disprove your theory without cutting off the whole funnel.',
    followUp:
      'The best next move is a fast experiment with a precommitted decision rule. If you cannot state what result would make you keep free, remove free, or redesign it, you are still debating taste rather than learning.',
  },
  {
    id: 'michael-ovitz',
    name: 'Michael Ovitz',
    shortName: 'Michael',
    initials: 'MO',
    bio: 'Michael Ovitz is an American talent agent and entrepreneur, best known for co-founding Creative Artists Agency (CAA).',
    lens: 'Talent, negotiation, institutions',
    image: '/guests/michael-ovitz.webp',
    source: 'https://www.davidsenra.com/episode/michael-ovitz-2',
    opening:
      'You are negotiating with two constituencies: the people who use the product and the buyers who fund it. Map what each side believes it is receiving today. A pricing change fails when it breaks an unspoken bargain.',
    followUp:
      'Give your highest-value customers a direct conversation before the announcement. The goal is not permission; it is discovering which part of the bargain they would feel you had broken.',
  },
  {
    id: 'micky-malka',
    name: 'Micky Malka',
    shortName: 'Micky',
    initials: 'MM',
    bio: 'Micky Malka is the founder of Ribbit Capital.',
    lens: 'Fintech, networks, emerging markets',
    image: '/guests/micky-malka.webp',
    source: 'https://www.davidsenra.com/episode/micky-malka',
    opening:
      'Segment the free workspaces before you price them as one population. A network participant who brings in a buyer is economically different from a dormant team that consumes support. Your policy should recognize that difference.',
    followUp:
      'Preserve the free behavior that creates a trusted introduction and charge where recurring value becomes visible. The boundary should follow the network, not an arbitrary number of days.',
  },
  {
    id: 'jonathan-ross',
    name: 'Jonathan Ross',
    shortName: 'Jonathan',
    initials: 'JR',
    bio: "Jonathan Ross is the founder of Groq, creator of Google's TPU and Chief Software Architect at Nvidia.",
    lens: 'Infrastructure, latency, technical advantage',
    image: '/guests/jonathan-ross.webp',
    source: 'https://www.davidsenra.com/episode/jonathan-ross',
    opening:
      'The visible question is pricing; the systems question is where cost scales badly. Instrument support and infrastructure by workspace behavior. Remove the expensive edge cases before removing the low-cost path that teaches customers the product.',
    followUp:
      'Optimize the bottleneck you can measure. If support is the constraint, change support entitlement first. Do not destroy a distribution mechanism to solve an operations problem unless the data says they are inseparable.',
  },
  {
    id: 'scott-wu',
    name: 'Scott Wu',
    shortName: 'Scott',
    initials: 'SW',
    bio: 'Scott Wu is the co-founder and CEO of Cognition.',
    lens: 'AI products, engineering, velocity',
    image: '/guests/scott-wu.webp',
    source: 'https://www.davidsenra.com/episode/scott-wu',
    opening:
      'Look for the moment a free workspace becomes serious. Product behavior may predict conversion better than time. Gate advanced collaboration at that moment and keep onboarding friction close to zero.',
    followUp:
      'Build the smallest pricing experiment your team can ship and observe in a week. The implementation should make it easy to reverse the gate and compare cohorts without muddying the result.',
  },
  {
    id: 'steve-stoute',
    name: 'Steve Stoute',
    shortName: 'Steve',
    initials: 'SS',
    bio: 'Steve Stoute is the founder and CEO of Translation and UnitedMasters.',
    lens: 'Culture, brand, distribution',
    image: '/guests/steve-stoute.webp',
    source: 'https://www.davidsenra.com/episode/steve-stoute',
    opening:
      'The free tier may be how your product travels through culture inside a company. If you remove it, what replaces that word of mouth? Pricing is not just extraction; it changes who can carry the story for you.',
    followUp:
      'Design a shareable moment that survives the pricing change. The best customers should still be able to bring the product into the rooms where your sales team cannot go.',
  },
  {
    id: 'ed-catmull',
    name: 'Ed Catmull',
    shortName: 'Ed',
    initials: 'EC',
    bio: 'Ed Catmull is the co-founder of Pixar and former president of Disney Animation.',
    lens: 'Creative leadership, culture, candor',
    image: '/guests/ed-catmull.webp',
    source: 'https://www.davidsenra.com/episode/ed-catmull',
    opening:
      'Ask what the team has become afraid to say about the free tier. The numbers matter, but the decision may be stuck because different functions hold different truths. Surface those before choosing a clean answer.',
    followUp:
      'Run a candid pre-mortem with support, product, and sales. If each group predicts a different failure, you have found the assumptions the experiment must test.',
  },
  {
    id: 'rick-rubin',
    name: 'Rick Rubin',
    shortName: 'Rick',
    initials: 'RR',
    bio: 'Rick Rubin is an award-winning record producer and co-founder of Def Jam Recordings and American Recordings.',
    lens: 'Taste, simplification, creative process',
    image: '/guests/rick-rubin.webp',
    source: 'https://www.davidsenra.com/episode/rick-rubin',
    opening:
      'What is essential about the free experience? Keep the part that lets someone feel the product immediately. Remove the clutter and obligations that accumulated around it. Simplicity may be a better answer than a deadline.',
    followUp:
      'Make the first experience complete enough to create desire, then stop. A trial clock creates urgency; a carefully bounded free experience creates understanding. Choose the feeling you want the product to leave.',
  },
  {
    id: 'marc-andreessen',
    name: 'Marc Andreessen',
    shortName: 'Marc',
    initials: 'MA',
    bio: 'Marc Andreessen is the co-founder of a16z and Netscape.',
    lens: 'Markets, platforms, software strategy',
    image: '/guests/marc-andreessen.webp',
    source: 'https://www.davidsenra.com/episode/marc-andreessen',
    opening:
      'The strategic question is whether free usage expands the market or subsidizes customers who were always willing to pay. The same metric can hide both. Separate market creation from discounting before changing the model.',
    followUp:
      'If free creates new edges in the network, preserve it as infrastructure. If it merely delays purchase, replace it. The experiment should isolate those two mechanisms rather than optimize one blended conversion number.',
  },
];

export const DEMO_BOARD_IDS = [
  'daniel-ek',
  'david-heinemeier-hansson',
  'lulu-cheng-meservey',
];

export function findMember(id: string) {
  return BOARD_MEMBERS.find((member) => member.id === id);
}
