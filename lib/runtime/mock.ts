import { getMember } from "../catalog";
import { EXAMPLE_QUESTION } from "../example";
import type {
  BoardRuntime,
  ClosingComment,
  ExecutiveReadout,
  MemberTurn,
  OpeningPosition,
  RuntimeTurnInput,
  TranscriptEvent,
} from "../types";

const OPENINGS: Record<string, OpeningPosition> = {
  "daniel-ek": {
    memberId: "daniel-ek",
    recommendation: "Do not kill free until you know if it is an engine or a leak.",
    reasoning:
      "2.3% conversion and 38% of tickets look ugly, but 34% of paying customers arriving through free is a distribution fact, not a vibe.",
    concern: "A 14-day trial can erase the shared-workspace discovery path that actually creates enterprise accounts.",
    question: "What share of the last ten enterprise wins started as a free workspace passed between users?",
  },
  "david-heinemeier-hansson": {
    memberId: "david-heinemeier-hansson",
    recommendation: "Kill the free tier. Charge. Ship a 14-day trial and get your life back.",
    reasoning:
      "Six thousand free workspaces feeding 38% of support is not a go-to-market. It is a hobby subsidized by 420 customers.",
    concern: "You are training the market that the product is optional to pay for.",
    question: "If you turned free off Monday, which actual paid workflow would get worse?",
  },
  "lulu-cheng-meservey": {
    memberId: "lulu-cheng-meservey",
    recommendation: "The economics may justify a trial, but the story will decide whether you keep trust.",
    reasoning:
      "Taking away a free workspace is a narrative event. If the headline is they padlocked the clubhouse, you lose.",
    concern: "Paying customers who arrived through free will feel bait-and-switched even if the numbers are honest.",
    question: "Who is the story for, and what do you want them to tell someone tomorrow?",
  },
};

const FIRST_TURNS: Record<string, MemberTurn> = {
  "daniel-ek": {
    text: "I would not execute this as a binary kill. 2.3% conversion is a problem; 34% of customers arriving through free is a channel. Measure whether free workspaces that get shared convert, then shrink free rather than slam the door. A trial is cleaner ops, but it can amputate the discovery loop.",
    reaction: "concern",
    wantsToRespond: "david-heinemeier-hansson",
  },
  "david-heinemeier-hansson": {
    text: "Daniel, a leaky funnel is not a strategy. You are an 18-person company hosting 6,000 tourists who generate 38% of the tickets. Charge. Fourteen days is generous. If the product is good, people talk. If they only talk when it is free, you do not have a product. You have a snack.",
    addressedTo: "Daniel Ek",
    reaction: "disagree",
    reactionFrom: "daniel-ek",
    wantsToRespond: "lulu-cheng-meservey",
  },
  "lulu-cheng-meservey": {
    text: "You can kill free and still lose. The move is not the price; it is the sentence people repeat. If you say we are done hosting work we do not stand behind, that is adult. If you say we are simplifying, they hear extraction. Trust is the word-of-mouth. Price is just the stage direction.",
    reaction: "agree",
  },
};

function genericOpening(slug: string): OpeningPosition {
  const m = getMember(slug);
  return {
    memberId: slug,
    recommendation: "Pressure-test whether free is distribution or drag before you burn the channel.",
    reasoning: `${m?.name ?? slug} would ask whether this decision makes the company more itself, or merely less tired this quarter.`,
    concern: "Unexamined word of mouth and unexamined support load can both bankrupt an 18-person team.",
    question: "What would you need to see in 30 days to know this was right?",
  };
}

function genericTurn(slug: string, input: RuntimeTurnInput): MemberTurn {
  const m = getMember(slug);
  const mention = input.addressedTo ? "Directly: " : "";
  return {
    text: `${mention}${m?.name ?? slug} here. The briefing says free converts at 2.3% and eats 38% of support, while 34% of paid arrived that way. Run a 14-day trial on new workspaces, keep a narrow share path, and watch enterprise referrals for one month.`,
  };
}

function fallbackReadout(
  briefing: string,
  closingComments: ClosingComment[],
): ExecutiveReadout {
  return {
    decision: briefing.split("\n")[0]?.replace(/^Question:\s*/i, "") || EXAMPLE_QUESTION,
    recommendation:
      "The board is divided. DHH recommends eliminating the free tier now in favor of a 14-day trial. Daniel Ek recommends not killing free until shared-workspace discovery is measured. Lulu Cheng Meservey treats narrative and trust as the binding constraint on either path.",
    divided: true,
    options: [
      "Eliminate free immediately and replace with a 14-day trial",
      "Keep a narrowed free workspace for sharing/discovery",
      "Grandfather current free workspaces and trial all new ones",
    ],
    tradeoffs: [
      "Support load and product simplicity versus top-of-funnel discovery",
      "Faster paid growth versus word-of-mouth from free workspaces",
      "Honest positioning versus the risk of a bait-and-switch story",
    ],
    assumptions: [
      "Free is a major source of paying-customer discovery (34%)",
      "Free is a major source of support cost (38% of tickets)",
      "An 18-person team cannot operate two products indefinitely",
    ],
    openQuestions: [
      "What share of recent enterprise wins started as a shared free workspace?",
      "Can a narrow share path replace an open free tier?",
      "What sentence will customers repeat if free disappears?",
    ],
    nextActions: [
      "Pull the last ten enterprise wins and tag their first workspace",
      "Draft the public narrative before touching billing",
      "If moving, grandfather existing free workspaces and trial new ones",
    ],
    closingComments,
  };
}

export function createMockRuntime(): BoardRuntime {
  const spoken = new Map<string, number>();
  return {
    id: "mock",
    async formOpeningPosition(input) {
      const preset = OPENINGS[input.memberId];
      return preset ? { ...preset, memberId: input.memberId } : genericOpening(input.memberId);
    },
    async publicTurn(input) {
      const n = spoken.get(input.memberId) ?? 0;
      spoken.set(input.memberId, n + 1);
      if (input.capability === "answerDirect" || input.prompt) {
        if (input.memberId === "lulu-cheng-meservey") {
          return {
            text: "You explain a free-tier change as a promise, not a punishment. Tell them you are done pretending a workspace you cannot support is generosity. Offer a clean trial, grandfather the ones who already built a home, and ask your best customers to invite people into something you will actually stand behind.",
            addressedTo: "You",
          };
        }
        if (input.memberId === "daniel-ek") {
          return {
            text: "If seven of your last ten enterprise wins entered through a shared free workspace, that is not folklore, that is the funnel. I would not kill free. I would instrument sharing, keep a narrow free path for invites, and put the trial on unshared tire-kickers. Evidence beats ideology.",
            addressedTo: input.addressedTo,
          };
        }
        return {
          text: `${getMember(input.memberId)?.name ?? "The seat"} answers directly: the evidence in the room should change the next experiment, not the personality of the company. Make the reversible test, then decide.`,
        };
      }
      if (n === 0 && FIRST_TURNS[input.memberId]) return FIRST_TURNS[input.memberId];
      return genericTurn(input.memberId, input);
    },
    async closingComment(input) {
      const map: Record<string, string> = {
        "daniel-ek":
          "Measure the shared-workspace path before you burn it. If enterprise still enters through free, keep a narrow invite-free; trial the rest.",
        "david-heinemeier-hansson":
          "Kill free. Charge. Fourteen days. Stop hosting 6,000 people who are not the business.",
        "lulu-cheng-meservey":
          "Whatever you do, write the sentence first. Trust is the word of mouth you are afraid to lose.",
      };
      return (
        map[input.memberId] ??
        `${getMember(input.memberId)?.name}: run a reversible test and do not confuse exhaustion with strategy.`
      );
    },
    async synthesis({ transcript }) {
      const speakers = Array.from(
        new Set(transcript.filter((e) => e.kind === "message").map((e) => e.speakerName)),
      );
      return `Agreement: the current free tier is operationally expensive. Disagreement: whether free is still a discovery engine (Ek) or a crowd you should stop hosting (DHH). Unresolved: the story customers will tell, which Lulu treats as the real risk. Voices so far: ${speakers.join(", ") || "the table"}.`;
    },
    async readout({ briefing, closingComments }) {
      return fallbackReadout(briefing, closingComments);
    },
  };
}
