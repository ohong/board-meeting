import { getMember } from "../catalog";
import { EXAMPLE_QUESTION } from "../example";
import { decisionLine, fallbackReadout, localOpeningPosition } from "./fallbacks";
import type {
  BoardRuntime,
  ExecutiveReadout,
  MemberTurn,
  OpeningPosition,
  ReadoutInput,
  RuntimeTurnInput,
  SynthesisInput,
} from "../types";

/**
 * A deterministic stand-in for the live board. It exists for two reasons: the whole
 * product flow, orchestration and WebMCP surface can be exercised in tests without an API
 * key, and a presenter without `OPENAI_API_KEY` still gets a working room.
 *
 * Scripted content covers the demo trio on the demo decision. Everything else falls back
 * to text derived from the briefing, so an arbitrary decision never gets answers about a
 * free tier nobody asked about.
 */

const DEMO_OPENINGS: Record<string, Omit<OpeningPosition, "memberId">> = {
  "daniel-ek": {
    recommendation: "Do not kill free until you know whether it is an engine or a leak.",
    reasoning:
      "2.3% conversion and 38% of tickets look ugly, but 34% of paying customers arriving through free is a distribution fact, not a vibe.",
    concern: "A 14-day trial can erase the shared-workspace discovery path that actually creates enterprise accounts.",
    question: "What share of the last ten enterprise wins started as a free workspace passed between users?",
  },
  "david-heinemeier-hansson": {
    recommendation: "Kill the free tier. Charge. Ship the 14-day trial and get your life back.",
    reasoning:
      "Six thousand free workspaces feeding 38% of support is not a go-to-market. It is a hobby subsidised by 420 customers.",
    concern: "You are teaching the market that your product is optional to pay for.",
    question: "If you turned free off on Monday, which paid workflow would actually get worse?",
  },
  "lulu-cheng-meservey": {
    recommendation: "The economics may justify a trial. The story will decide whether you keep trust.",
    reasoning:
      "Taking away a free workspace is a narrative event. If the headline is that you padlocked the clubhouse, you lose more than you saved.",
    concern: "Paying customers who arrived through free will feel bait-and-switched even if the numbers are honest.",
    question: "Who is the story for, and what do you want them to tell a colleague tomorrow?",
  },
};

const DEMO_FIRST_TURNS: Record<string, MemberTurn> = {
  "daniel-ek": {
    text: "I would not run this as a binary kill. 2.3% conversion is a problem. Thirty-four percent of your customers arriving through free is a channel. Measure whether shared workspaces convert differently from solo ones, then narrow free rather than close the front door. A trial is cleaner operationally and it can amputate discovery.",
    reaction: "concern",
    wantsToRespond: "David Heinemeier Hansson",
  },
  "david-heinemeier-hansson": {
    text: "Daniel, a leaky funnel is not a strategy. You are eighteen people hosting six thousand tourists who file 38% of the tickets. Charge. Fourteen days is generous. If the product is good, people talk about it. If they only talk when it is free, you do not have a product, you have a snack.",
    addressedTo: "Daniel Ek",
    reaction: "disagree",
    wantsToRespond: "Lulu Cheng Meservey",
  },
  "lulu-cheng-meservey": {
    text: "You can kill free and still lose. The move is not the price, it is the sentence people repeat on Monday. Say you are done hosting work you cannot stand behind and that reads as adult. Say you are simplifying plans and they hear extraction. Trust is the word of mouth you are trying to protect.",
    reaction: "agree",
    addressedTo: "You",
  },
};

const DEMO_DIRECT_ANSWERS: Record<string, MemberTurn> = {
  "lulu-cheng-meservey": {
    text: "You explain it as a promise, not a punishment. Tell them plainly you are done pretending a workspace you cannot support is generosity. Give a clean trial, grandfather the people who already built a home there, and ask your best customers to invite others into something you will actually stand behind.",
    addressedTo: "You",
  },
  "daniel-ek": {
    text: "If seven of your last ten enterprise wins entered through a shared free workspace, that is not folklore, that is the funnel. I would not kill free. I would instrument sharing, keep a narrow invite-only free path, and put the trial on unshared tyre-kickers. Evidence beats ideology, and that is evidence.",
  },
};

const DEMO_CLOSINGS: Record<string, string> = {
  "daniel-ek":
    "Measure the shared-workspace path before you burn it. If enterprise still enters through free, keep a narrow invite-free and put the trial on everyone else. You can always close the door later; you cannot reopen word of mouth.",
  "david-heinemeier-hansson":
    "Kill free. Charge. Fourteen days. Stop hosting six thousand people who are not the business, and spend the week you get back on the four hundred and twenty who are.",
  "lulu-cheng-meservey":
    "Whatever you decide, write the sentence first and send it to your best customer before you send it to everyone. If you cannot say it to her face, you are not ready to ship it.",
};

function isDemoDecision(briefing: string): boolean {
  return briefing.toLowerCase().includes("free tier");
}

function genericTurn(input: RuntimeTurnInput): MemberTurn {
  const decision = decisionLine(input.briefing);
  if (input.prompt) {
    return {
      text: `Directly, then: on "${decision}", I would not answer from principle. Name the one fact that would flip your decision, get it this week, and let it decide. Everything else in this room is preference wearing a suit.`,
      addressedTo: input.addressedTo ?? "You",
    };
  }
  return {
    text: `Taking "${decision}" at face value, I would test the load-bearing assumption before committing. Make the smallest reversible version of this, run it for thirty days, and be explicit about what result would make you stop. Deciding on conviction alone is how a small team spends a year it does not have.`,
    reaction: "concern",
  };
}

export type MockOptions = {
  /** Pause between streamed chunks. Zero in tests; a human pace in the browser. */
  chunkDelayMs?: number;
};

/** Streams pre-written text in word-sized chunks so the UI path is identical to live. */
async function emit(
  text: string,
  onDelta: ((delta: string) => void) | undefined,
  chunkDelayMs: number,
): Promise<void> {
  if (!onDelta) return;
  const chunks = text.match(/\S+\s*/g) ?? [text];
  for (const chunk of chunks) {
    onDelta(chunk);
    if (chunkDelayMs) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, chunkDelayMs);
      });
    }
  }
}

export function createMockRuntime(options: MockOptions = {}): BoardRuntime {
  const chunkDelayMs = options.chunkDelayMs ?? 0;
  const spoken = new Map<string, number>();

  return {
    id: "mock",

    async formOpeningPosition(input) {
      const preset = isDemoDecision(input.briefing) ? DEMO_OPENINGS[input.memberId] : undefined;
      if (preset) return { memberId: input.memberId, ...preset };
      return localOpeningPosition(input.memberId, input.briefing);
    },

    async publicTurn(input, onDelta) {
      const count = spoken.get(input.memberId) ?? 0;
      spoken.set(input.memberId, count + 1);

      const demo = isDemoDecision(input.briefing);
      let turn: MemberTurn;
      if (input.prompt && demo && DEMO_DIRECT_ANSWERS[input.memberId]) {
        turn = DEMO_DIRECT_ANSWERS[input.memberId];
      } else if (!input.prompt && count === 0 && demo && DEMO_FIRST_TURNS[input.memberId]) {
        turn = DEMO_FIRST_TURNS[input.memberId];
      } else {
        turn = genericTurn(input);
      }
      await emit(turn.text, onDelta, chunkDelayMs);
      return turn;
    },

    async closingComment(input) {
      if (isDemoDecision(input.briefing) && DEMO_CLOSINGS[input.memberId]) {
        return DEMO_CLOSINGS[input.memberId];
      }
      const name = getMember(input.memberId)?.name ?? input.memberId;
      return `${name}: run the smallest reversible version of this, decide what result would stop you, and do not confuse exhaustion with strategy.`;
    },

    async synthesis(input: SynthesisInput) {
      const speakers = Array.from(
        new Set(input.transcript.filter((e) => e.kind === "message").map((e) => e.speakerName)),
      );
      if (isDemoDecision(input.briefing)) {
        return `Agreement: the free tier as it stands is operationally expensive and the 2.3% conversion is not defensible. Disagreement: Ek treats free as a discovery engine worth instrumenting before touching, DHH treats it as a crowd you should stop hosting. Unresolved: what the change would cost in trust, which Lulu argues is the real exposure. Heard so far: ${speakers.join(", ") || "the table"}.`;
      }
      return `Agreement: the decision is real and the current position is not stable. Disagreement: whether to act now on conviction or instrument first and decide in thirty days. Unresolved: which single piece of evidence would settle it. Heard so far: ${speakers.join(", ") || "the table"}.`;
    },

    async readout(input: ReadoutInput): Promise<ExecutiveReadout> {
      if (!isDemoDecision(input.briefing)) {
        return fallbackReadout(input.briefing, input.transcript, input.closingComments);
      }
      return {
        decision: decisionLine(input.briefing) || EXAMPLE_QUESTION,
        recommendation:
          "The board is divided. David Heinemeier Hansson would eliminate the free tier now and replace it with a 14-day trial. Daniel Ek would not touch it until shared-workspace discovery has been measured, and shifted further that way once the enterprise-referral evidence entered the room. Lulu Cheng Meservey treats the announcement itself, not the pricing, as the binding constraint on either path.",
        divided: true,
        options: [
          "Eliminate the free tier now and replace it with a 14-day trial",
          "Keep a narrowed, invite-only free workspace for sharing and discovery",
          "Grandfather existing free workspaces and put every new workspace on a trial",
        ],
        tradeoffs: [
          "Support load and product simplicity against top-of-funnel discovery",
          "Faster paid conversion against the word of mouth that produced 34% of current customers",
          "A clean operational story against the risk of reading as a bait-and-switch",
        ],
        assumptions: [
          "Free is a material source of paying-customer discovery (34%, and enterprise referrals raised in the room)",
          "Free is a material source of support cost (38% of tickets)",
          "An eighteen-person team cannot run two products indefinitely",
        ],
        openQuestions: [
          "Do shared free workspaces convert differently from solo ones?",
          "Can an invite-only free path preserve the referral loop without the support load?",
          "What sentence will customers repeat the morning the change ships?",
        ],
        nextActions: [
          "Tag the last ten enterprise wins by how the first workspace was created",
          "Split conversion and support cost by shared versus solo workspaces before deciding",
          "Draft and pressure-test the announcement before touching billing",
          "If moving, grandfather existing free workspaces and trial only new ones",
        ],
        closingComments: input.closingComments,
      };
    },
  };
}
