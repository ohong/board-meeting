/**
 * Deterministic fixtures for UI development and tests. No model calls.
 * The demo trio here mirrors the shape of agent/subagents/<slug>/persona.json.
 */

import { createInitialState } from "./session";
import {
  DEMO_BRIEFING,
  type MeetingState,
  type MemberParticipant,
  type PersonaSummary,
  type Readout,
  type TranscriptEntry,
} from "./types";

export const FIXTURE_PERSONAS: PersonaSummary[] = [
  {
    slug: "daniel-ek",
    name: "Daniel Ek",
    shortName: "Daniel",
    mention: "Daniel",
    role: "Spotify founder · consumer freemium at scale",
    company: "Spotify",
    portrait: "/portraits/daniel-ek.webp",
    episodeUrl: "https://www.davidsenra.com/episode/daniel-ek-spotify",
    episodeDate: "2025-09-28",
    lenses: ["freemium economics", "negotiating with gatekeepers", "long-horizon consumer scale"],
    searchTerms: ["spotify", "freemium", "music", "sweden"],
    voiceSample: "Free is not a price. It is a distribution strategy, and you pay for it somewhere.",
  },
  {
    slug: "david-heinemeier-hansson",
    name: "David Heinemeier Hansson",
    shortName: "DHH",
    mention: "DHH",
    role: "Rails creator · small teams, staying independent",
    company: "37signals",
    portrait: "/portraits/david-heinemeier-hansson.webp",
    episodeUrl: "https://www.davidsenra.com/episode/david-heinemeier-hansson",
    episodeDate: "2026-07-26",
    lenses: ["profitable small teams", "saying no", "pricing simplicity"],
    searchTerms: ["rails", "basecamp", "37signals", "bootstrapping"],
    voiceSample: "Growth at any cost is just cost with better marketing.",
  },
  {
    slug: "lulu-cheng-meservey",
    name: "Lulu Cheng Meservey",
    shortName: "Lulu",
    mention: "Lulu",
    role: "Comms strategist · going direct, narrative offense",
    company: "Rostra",
    portrait: "/portraits/lulu-cheng-meservey.webp",
    episodeUrl: "https://www.davidsenra.com/episode/lulu-cheng-meservey",
    episodeDate: "2026-08-12",
    lenses: ["founder communication", "narrative under pressure", "trust and audience"],
    searchTerms: ["communications", "pr", "substack", "go direct"],
    voiceSample: "If you do not tell the story, someone with worse intentions will.",
  },
  {
    slug: "sam-altman",
    name: "Sam Altman",
    shortName: "Sam",
    mention: "Sam",
    role: "OpenAI CEO · frontier AI, compute at scale",
    company: "OpenAI",
    portrait: "/portraits/sam-altman.webp",
    episodeUrl: "https://www.davidsenra.com/episode/sam-altman",
    episodeDate: "2026-08-23",
    lenses: ["ambition and focus", "non-consensus bets", "compounding advantage"],
    searchTerms: ["openai", "yc", "ai"],
    voiceSample: "Most companies fail from not being ambitious enough, not from being too ambitious.",
  },
  {
    slug: "tobi-lutke",
    name: "Tobi Lütke",
    shortName: "Tobi",
    mention: "Tobi",
    role: "Shopify CEO · systems thinking, developer-founder",
    company: "Shopify",
    portrait: "/portraits/tobi-lutke.webp",
    episodeUrl: "https://www.davidsenra.com/episode/tobi-lutke",
    episodeDate: "2026-01-18",
    lenses: ["systems and tooling", "merchant obsession", "second-order effects"],
    searchTerms: ["shopify", "ecommerce", "systems"],
    voiceSample: "Ask what the system will do, not what you hope people will do.",
  },
  {
    slug: "rick-rubin",
    name: "Rick Rubin",
    shortName: "Rick",
    mention: "Rick",
    role: "Record producer · taste, reduction, creative process",
    company: "Def Jam / American Recordings",
    portrait: "/portraits/rick-rubin.webp",
    episodeUrl: "https://www.davidsenra.com/episode/rick-rubin",
    episodeDate: "2026-05-24",
    lenses: ["reduction", "taste over data", "attention"],
    searchTerms: ["music", "producer", "creativity"],
    voiceSample: "What would you take away?",
  },
];

export const DEMO_TRIO = FIXTURE_PERSONAS.slice(0, 3);

function member(persona: PersonaSummary, seat: number, patch: Partial<MemberParticipant> = {}): MemberParticipant {
  return {
    role: "member",
    id: persona.slug,
    persona,
    seat,
    status: "ready",
    turns: 0,
    position: {
      recommendation: "Provisional view.",
      reasoning: "Because of the numbers in the briefing.",
      concern: "Word of mouth.",
      question: "What is the payback on a free workspace?",
    },
    positionUpdate: null,
    reaction: null,
    urgency: 3,
    lastError: null,
    retries: 0,
    ...patch,
  };
}

export function fixtureSelecting(): MeetingState {
  return createInitialState();
}

export function fixtureBriefing(): MeetingState {
  return { ...createInitialState(), phase: "briefing", board: DEMO_TRIO, briefing: DEMO_BRIEFING };
}

export function fixtureForming(): MeetingState {
  const base = createInitialState();
  const t = Date.now();
  return {
    ...base,
    phase: "forming",
    board: DEMO_TRIO,
    briefing: DEMO_BRIEFING,
    startedAt: t,
    members: {
      "daniel-ek": member(DEMO_TRIO[0], 0, { status: "forming", position: null }),
      "david-heinemeier-hansson": member(DEMO_TRIO[1], 1, { status: "ready" }),
      "lulu-cheng-meservey": member(DEMO_TRIO[2], 2, { status: "retrying", position: null, retries: 1 }),
    },
    transcript: [
      {
        kind: "event",
        id: "ev1",
        event: "meeting-started",
        text: "Meeting called to order. Daniel Ek, David Heinemeier Hansson, Lulu Cheng Meservey are forming independent positions.",
        ts: t,
      },
    ],
  };
}

export function fixtureDiscussion(): MeetingState {
  const base = fixtureForming();
  const t = base.startedAt ?? Date.now();
  const transcript: TranscriptEntry[] = [
    ...base.transcript,
    { kind: "event", id: "ev2", event: "positions-ready", text: "All positions formed. Open discussion.", ts: t + 6000 },
    {
      kind: "message",
      id: "m1",
      speakerId: "david-heinemeier-hansson",
      speakerRole: "member",
      speakerName: "David Heinemeier Hansson",
      text: "Don't kill free. We killed Basecamp's free plan on a clean six-month test and spent ten years learning it was wrong. Cut the support subsidy, absolutely, but keep the door people walk through.",
      addressedTo: "board",
      addressedName: null,
      intent: "statement",
      streaming: false,
      interruption: false,
      failed: false,
      ts: t + 8000,
    },
    {
      kind: "message",
      id: "m2",
      speakerId: "daniel-ek",
      speakerRole: "member",
      speakerName: "Daniel Ek",
      text: "David, agreed on the door, but the 90-day number is the wrong window. A third of paying customers came in through free; the question is what a free workspace does by month twelve, and whether you can afford to find out.",
      addressedTo: "david-heinemeier-hansson",
      addressedName: "David Heinemeier Hansson",
      intent: "rebuttal",
      streaming: false,
      interruption: true,
      failed: false,
      ts: t + 16000,
    },
    {
      kind: "message",
      id: "m3",
      speakerId: "chair",
      speakerRole: "chair",
      speakerName: "You",
      text: "@Lulu how do we explain a free-tier change without losing user trust?",
      addressedTo: "lulu-cheng-meservey",
      addressedName: "Lulu Cheng Meservey",
      intent: "question",
      streaming: false,
      interruption: false,
      failed: false,
      ts: t + 24000,
    },
    {
      kind: "message",
      id: "m4",
      speakerId: "lulu-cheng-meservey",
      speakerRole: "member",
      speakerName: "Lulu Cheng Meservey",
      text: "You say it yourself, in your own words, before anyone else frames it for you. Name the tradeoff plainly, grandfather the people who trusted you early, and",
      addressedTo: "chair",
      addressedName: "You",
      intent: "answer",
      streaming: true,
      interruption: false,
      failed: false,
      ts: t + 26000,
    },
  ];
  return {
    ...base,
    phase: "discussion",
    transcript,
    streamingEntryId: "m4",
    members: {
      "daniel-ek": member(DEMO_TRIO[0], 0, {
        status: "reacting",
        turns: 1,
        reaction: { kind: "concern", toId: "david-heinemeier-hansson", at: t + 9000 },
        urgency: 8,
      }),
      "david-heinemeier-hansson": member(DEMO_TRIO[1], 1, { status: "wants-to-respond", turns: 1, urgency: 9 }),
      "lulu-cheng-meservey": member(DEMO_TRIO[2], 2, { status: "speaking", turns: 0 }),
    },
  };
}

export function fixtureDiscussionWithGuest(): MeetingState {
  const base = fixtureDiscussion();
  const t = Date.now();
  return {
    ...base,
    streamingEntryId: null,
    guest: { role: "guest", id: "guest", name: "Codex", status: "joined", joinedAt: t },
    transcript: [
      ...base.transcript.map((e) => (e.id === "m4" ? { ...e, streaming: false, text: e.text + " make the new path better than the old one." } : e)),
      { kind: "event", id: "ev3", event: "guest-joined", text: "Codex joined the meeting through WebMCP and took the guest seat.", ts: t },
      {
        kind: "message",
        id: "m5",
        speakerId: "guest",
        speakerRole: "guest",
        speakerName: "Codex",
        text: "Context the board does not have: our five largest customers by ARR each expanded only after a second team was invited into their workspace, and the median time from first invite to paid was 41 days.",
        addressedTo: "board",
        addressedName: null,
        intent: "context",
        streaming: false,
        interruption: false,
        failed: false,
        ts: t + 2000,
      },
      {
        kind: "message",
        id: "m6",
        speakerId: "guest",
        speakerRole: "guest",
        speakerName: "Codex",
        text: "Does the invite-to-paid evidence change your view of the free tier?",
        addressedTo: "daniel-ek",
        addressedName: "Daniel Ek",
        intent: "question",
        streaming: false,
        interruption: false,
        failed: false,
        ts: t + 3000,
      },
      { kind: "event", id: "ev4", event: "synthesis-requested", text: "Codex asked the secretary for a synthesis of the discussion so far.", ts: t + 4000 },
      {
        kind: "synthesis",
        id: "syn1",
        requestedBy: "guest",
        requestedByName: "Codex",
        text: "Agreement: the current free tier is under-managed. Disagreement: whether to remove it (DHH) or redesign it as a referral channel (Daniel). Unresolved: the true payback of a free workspace once invited teams are counted.",
        streaming: false,
        failed: false,
        ts: t + 5000,
      },
    ],
    members: {
      ...base.members,
      "lulu-cheng-meservey": member(DEMO_TRIO[2], 2, { status: "ready", turns: 1 }),
    },
  };
}

export const FIXTURE_READOUT: Readout = {
  decision: "Eliminate the free tier and replace it with a 14-day trial?",
  recommendation: {
    summary: "Do not kill free outright. Convert it into a gated, referral-oriented workspace and run a 14-day trial alongside it for 90 days.",
    divided: true,
    detail:
      "Daniel Ek and Lulu Cheng Meservey favor redesigning free around referral; DHH holds that the free tier should be removed and the support burden ended immediately.",
  },
  options: [
    "Remove free entirely; 14-day trial only",
    "Keep free but cap seats/storage and remove support",
    "Redesign free as an invite-only workspace tied to existing customers",
  ],
  tradeoffs: [
    "Support cost (38% of tickets) versus discovery (34% of paying customers first arrived through free)",
    "Simpler product and faster cycle versus slower word of mouth",
  ],
  assumptions: [
    "Referral-sourced enterprise accounts would not have arrived through a trial",
    "Support tickets from free users are avoidable rather than product signal",
  ],
  openQuestions: ["What is the 12-month payback of a free workspace once referrals are attributed?"],
  nextActions: [
    "Instrument invite-to-paid attribution before changing pricing",
    "Ship a support-free, capped free tier for new signups; grandfather existing ones",
    "Draft the announcement in the founder's own voice and test it with ten customers",
  ],
  closingComments: [
    { memberId: "daniel-ek", memberName: "Daniel Ek", text: "Measure the door before you brick it up.", fallback: false },
    { memberId: "david-heinemeier-hansson", memberName: "David Heinemeier Hansson", text: "Keep the door open; stop paying to run other people's indefinite workspaces.", fallback: false },
    { memberId: "lulu-cheng-meservey", memberName: "Lulu Cheng Meservey", text: "Whatever you decide, say it first and say it plainly.", fallback: false },
  ],
  generatedAt: Date.now(),
  fallback: false,
};

export function fixtureReadout(): MeetingState {
  const base = fixtureDiscussionWithGuest();
  return {
    ...base,
    phase: "readout",
    endedAt: Date.now(),
    readout: FIXTURE_READOUT,
    readoutStatus: "ready",
    closingComments: FIXTURE_READOUT.closingComments,
    transcript: [
      ...base.transcript,
      { kind: "event", id: "ev5", event: "meeting-ended", text: "The chair ended the meeting.", ts: Date.now() },
    ],
  };
}

export const FIXTURES = {
  selecting: fixtureSelecting,
  briefing: fixtureBriefing,
  forming: fixtureForming,
  discussion: fixtureDiscussion,
  guest: fixtureDiscussionWithGuest,
  readout: fixtureReadout,
} as const;

export type FixtureName = keyof typeof FIXTURES;
