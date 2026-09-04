import { getMember } from "../catalog";
import { EXAMPLE_DECISION, EXAMPLE_QUESTION } from "../example";
import type {
  BoardRuntime,
  ClosingComment,
  ExecutiveReadout,
  MemberTurn,
  OpeningPosition,
  RuntimeTurnInput,
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

const FOLLOW_UP_TURNS: Record<string, MemberTurn[]> = {
  "daniel-ek": [
    {
      text: "Separate acquisition from access. Keep a free workspace only when it is created by an invitation into active work; put every self-serve signup into the trial. That preserves the behavior that may carry enterprise demand while removing the broad support promise DHH is objecting to.",
      addressedTo: "David Heinemeier Hansson",
      reaction: "concern",
    },
    {
      text: "The 34% number is still too coarse. Cohort the last ten enterprise wins by their first meaningful action: created alone, invited into a workspace, or shared work outside the company. If the shared cohort is the source, preserve that loop and stop subsidizing the rest.",
    },
    {
      text: "My decision rule is simple: run new signups through the trial for 30 days, leave invite-created workspaces alone, and compare qualified pipeline plus support hours with the prior cohort. If referral quality holds, narrow free permanently. If it falls, you found the channel before destroying it.",
    },
  ],
  "david-heinemeier-hansson": [
    {
      text: "A special free path is how complexity sneaks back in wearing a lab coat. Grandfather existing workspaces if you must, but give every new account the same 14 days and one honest price. The team needs one product to explain, support, and improve.",
      addressedTo: "Daniel Ek",
      reaction: "disagree",
    },
    {
      text: "You already have a decision-grade signal: 6,000 free workspaces create 38% of support for an 18-person company. Do not demand perfect attribution before stopping a known drain. Announce the trial, personally call the enterprise accounts that came through free, and learn from customers who can actually leave.",
    },
    {
      text: "The kill signal cuts both ways. If trial activation collapses after the change, reverse it. But if support falls and paid conversion rises, do not reopen free because a vanity signup chart looks lonely. A reversible decision still needs a date when the experiment ends.",
    },
  ],
  "lulu-cheng-meservey": [
    {
      text: "There are two plausible stories: they took something away, or they stopped making a promise they could not keep. Grandfathering existing teams makes the second story credible. A surprise lockout makes the first one inevitable, whatever your spreadsheet says.",
      reaction: "concern",
    },
    {
      text: "Sequence the message before the migration: tell users what you learned, name what remains free during the transition, and show what paying lets the team guarantee. Give your best customers language they would be proud to repeat. That is how the announcement travels without sounding like extraction.",
    },
    {
      text: "Narrative cannot rescue a bad product decision, but it can expose one early. If you cannot explain the change in one candid sentence without hiding behind simplification, the policy is not ready. My test sentence is: we are charging so every workspace we host is one we can stand behind.",
    },
  ],
};

export const MOCK_DEMO_TIMING = {
  openingDelayMs: {
    "daniel-ek": 420,
    "david-heinemeier-hansson": 760,
    "lulu-cheng-meservey": 1100,
  },
  publicTurnDelayMs: 650,
  publicTurnChunkDelayMs: 24,
  autoTurnGapMs: 700,
} as const;

export type MockRuntimeOptions = {
  openingDelayMs?: (memberId: string) => number;
  publicTurnDelayMs?: number;
  publicTurnChunkDelayMs?: number;
  wait?: (milliseconds: number) => Promise<void>;
};

function waitFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function compactBriefing(briefing: string): string {
  const line = briefing
    .split("\n")
    .map((part) => part.replace(/^(Question|Briefing):\s*/i, "").trim())
    .find(Boolean);
  if (!line) return "the decision in front of the board";
  return line.length > 120 ? `${line.slice(0, 117)}…` : line;
}

function isExampleDecision(briefing: string): boolean {
  return briefing === EXAMPLE_DECISION;
}

function boundedExcerpt(text: string, maxCharacters = 170): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxCharacters) return normalized;
  const prefix = normalized.slice(0, maxCharacters - 1);
  const lastBoundary = prefix.lastIndexOf(" ");
  return `${prefix.slice(0, lastBoundary > maxCharacters / 2 ? lastBoundary : undefined)}…`;
}

export function demoOpeningDelayMs(memberId: string): number {
  const preset = MOCK_DEMO_TIMING.openingDelayMs[
    memberId as keyof typeof MOCK_DEMO_TIMING.openingDelayMs
  ];
  if (preset !== undefined) return preset;
  const checksum = Array.from(memberId).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return 460 + (checksum % 4) * 180;
}

function genericOpening(input: RuntimeTurnInput): OpeningPosition {
  const m = getMember(input.memberId);
  const decision = compactBriefing(input.briefing);
  return {
    memberId: input.memberId,
    recommendation: `Make the next step on “${decision}” reversible until its central assumption is tested.`,
    reasoning: `${m?.name ?? input.memberId} brings a ${m?.role ?? "board"} lens: preserve the option that compounds while putting a date and owner on the evidence needed to decide.`,
    concern: "The board may be treating urgency as evidence and hiding the cost of reversal.",
    question: "Which observable result in 30 days would make you reverse this choice?",
  };
}

function latestQuestioner(input: RuntimeTurnInput): string {
  return (
    [...input.transcript]
      .reverse()
      .find((event) => event.kind === "message" && event.speakerId !== input.memberId)
      ?.speakerName ?? "You"
  );
}

function latestGuestEvidence(transcript: RuntimeTurnInput["transcript"]) {
  const contribution = [...transcript]
    .reverse()
    .find(
      (event) =>
        event.kind === "message" && event.speakerId === "guest" && !event.addressedTo,
    );
  if (!contribution) return null;
  const excerpt = boundedExcerpt(contribution.text);
  return {
    excerpt,
    label: `Guest-supplied evidence (${contribution.speakerName}): ${excerpt}`,
  };
}

function genericTurn(input: RuntimeTurnInput, turnIndex: number): MemberTurn {
  const m = getMember(input.memberId);
  const name = m?.name ?? input.memberId;
  const decision = compactBriefing(input.briefing);
  const priorBoardPoint = [...input.transcript]
    .reverse()
    .find(
      (event) =>
        event.kind === "message" &&
        event.speakerId !== input.memberId &&
        event.speakerId !== "chair" &&
        event.speakerId !== "guest",
    )?.text;
  const variants = [
    `${name}'s starting point on “${decision}”: name the assumption that has to be true, assign an owner to measure it, and avoid making the irreversible part of the decision first.`,
    `${name} would split “${decision}” into reversible and irreversible moves. Run the smallest version that can disprove the plan, publish the decision date now, and keep the current path available until the evidence arrives.`,
    priorBoardPoint
      ? `${name} sees useful tension in the claim “${boundedExcerpt(priorBoardPoint, 96)}” Test that claim directly before averaging the board into a vague compromise.`
      : `${name} sees a missing falsifiable threshold for “${decision}.” Decide what result would make the board say no, not only what result would let the team declare victory.`,
    `${name} would close the experiment on “${decision}” with a written rule: the owner, measure, review date, and condition that reverses course. Without those four things, “reversible” is only a comforting adjective.`,
  ];
  return { text: variants[turnIndex % variants.length] };
}

function directTurn(input: RuntimeTurnInput, exampleDecision: boolean): MemberTurn {
  const addressedTo = latestQuestioner(input);
  const decision = compactBriefing(input.briefing);
  if (input.memberId === "daniel-ek") {
    const guestEvidence = latestGuestEvidence(input.transcript);
    if (guestEvidence) {
      return {
        text: exampleDecision
          ? `The guest adds: “${guestEvidence.excerpt}” That is evidence about the discovery path, not permission to preserve every free account. Instrument the path this evidence names, keep only the narrow behavior that produces qualified demand, and put everything else through the trial.`
          : `The guest adds: “${guestEvidence.excerpt}” Treat that as an input, not a verdict on “${decision}.” Instrument the behavior it describes, compare it with a clean cohort, and decide against a threshold written before the result arrives.`,
        addressedTo,
      };
    }
    return {
      text: exampleDecision
        ? "I do not see new guest evidence in the public record yet. Before treating free as either a channel or a leak, instrument how paying teams first enter and define the result that would justify narrowing access or moving everyone to the trial."
        : `I do not see new guest evidence in the public record yet. For “${decision},” identify the behavior that would change the recommendation, instrument it, and choose the decision threshold before collecting the result.`,
      addressedTo,
    };
  }
  if (exampleDecision && input.memberId === "lulu-cheng-meservey") {
    return {
      text: "You explain a free-tier change as a promise, not a punishment. Tell them you are done pretending a workspace you cannot support is generosity. Offer a clean trial, grandfather the ones who already built a home, and ask your best customers to invite people into something you will actually stand behind.",
      addressedTo,
    };
  }
  const prompt = boundedExcerpt(input.prompt ?? "the question in the public record", 120);
  return {
    text: `${getMember(input.memberId)?.name ?? "The seat"} answers “${prompt}” directly: for “${decision},” make the next test reversible, state what evidence would change the recommendation, and keep the final choice tied to that result rather than the room's personalities.`,
    addressedTo,
  };
}

function genericClosing(input: RuntimeTurnInput): string {
  const ownStatement = [...input.transcript]
    .reverse()
    .find((event) => event.kind === "message" && event.speakerId === input.memberId)?.text;
  const name = getMember(input.memberId)?.name ?? input.memberName;
  if (ownStatement) {
    return `${name}'s closing position remains: “${boundedExcerpt(ownStatement)}” Carry its decision rule into the written follow-up.`;
  }
  return `${name}: keep “${compactBriefing(input.briefing)}” reversible until its central assumption has an owner, a measure, and a review date.`;
}

function genericSynthesis(
  briefing: string,
  transcript: RuntimeTurnInput["transcript"],
): string {
  const statements = transcript
    .filter(
      (event) =>
        event.kind === "message" && event.speakerId !== "chair" && event.speakerId !== "guest",
    )
    .slice(-3)
    .map((event) => `${event.speakerName}: “${boundedExcerpt(event.text, 130)}”`);
  const record = statements.length
    ? `The latest positions are ${statements.join("; ")}.`
    : "No adviser has made a public claim yet.";
  const guestEvidence = latestGuestEvidence(transcript);
  return `Decision under review: “${compactBriefing(briefing)}.” ${record}${guestEvidence ? ` ${guestEvidence.label}.` : ""} The unresolved work is to identify the assumption separating these positions and the evidence that would change it.`;
}

function exampleReadout(
  briefing: string,
  transcript: RuntimeTurnInput["transcript"],
  closingComments: ClosingComment[],
): ExecutiveReadout {
  const guestEvidence = latestGuestEvidence(transcript);
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
      ...(guestEvidence ? [guestEvidence.label] : []),
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

function genericReadout(
  briefing: string,
  transcript: RuntimeTurnInput["transcript"],
  closingComments: ClosingComment[],
): ExecutiveReadout {
  const lines = briefing
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const decision =
    lines.find((line) => /^Question:/i.test(line))?.replace(/^Question:\s*/i, "") ??
    compactBriefing(briefing);
  const publicStatements = transcript
    .filter(
      (event) =>
        event.kind === "message" && event.speakerId !== "chair" && event.speakerId !== "guest",
    )
    .slice(-3)
    .map((event) => `${event.speakerName}: ${boundedExcerpt(event.text, 180)}`);
  const questions = transcript
    .filter((event) => event.kind === "message" && event.text.includes("?"))
    .slice(-3)
    .map((event) => boundedExcerpt(event.text, 180));
  const uniqueClosings = new Set(
    closingComments.map(({ comment }) => comment.trim().toLowerCase()).filter(Boolean),
  );
  const divided =
    uniqueClosings.size > 1 ||
    transcript.some(
      (event) => event.kind === "reaction" && event.reaction === "disagree",
    );
  const guestEvidence = latestGuestEvidence(transcript);

  return {
    decision,
    recommendation: divided
      ? "The board's closing positions remain distinct. Use the tests and thresholds preserved below rather than manufacturing consensus."
      : closingComments[0]?.comment ??
        "The board has not supplied a closing recommendation; keep the next step reversible.",
    divided,
    options:
      closingComments.length > 0
        ? closingComments.map(({ name, comment }) => `${name}: ${comment}`)
        : ["No closing option was captured."],
    tradeoffs:
      publicStatements.length > 0
        ? publicStatements
        : ["No explicit tradeoff was captured in the public transcript."],
    assumptions:
      lines.length > 1
        ? [
            ...lines.slice(1).map((line) => line.replace(/^Briefing:\s*/i, "")),
            ...(guestEvidence ? [guestEvidence.label] : []),
          ]
        : [compactBriefing(briefing), ...(guestEvidence ? [guestEvidence.label] : [])],
    openQuestions:
      questions.length > 0
        ? questions
        : ["Which observable result would reverse the current recommendation?"],
    nextActions: [
      "Name the owner, measure, review date, and reversal threshold for the next test.",
      "Record the result against the original briefing before making the irreversible move.",
    ],
    closingComments,
  };
}

export function createMockRuntime(options: MockRuntimeOptions = {}): BoardRuntime {
  const wait = options.wait ?? waitFor;
  const pause = async (milliseconds: number) => {
    if (milliseconds > 0) await wait(milliseconds);
  };
  return {
    id: "mock",
    async formOpeningPosition(input, callOptions) {
      await pause(options.openingDelayMs?.(input.memberId) ?? 0);
      callOptions?.signal?.throwIfAborted();
      const preset = isExampleDecision(input.briefing) ? OPENINGS[input.memberId] : undefined;
      return preset ? { ...preset, memberId: input.memberId } : genericOpening(input);
    },
    async publicTurn(input, turnOptions) {
      await pause(options.publicTurnDelayMs ?? 0);
      turnOptions?.signal?.throwIfAborted();
      const n = input.ownPriorStatements.length;
      const exampleDecision = isExampleDecision(input.briefing);
      let turn: MemberTurn;
      if (input.capability === "answerDirect" || input.prompt) {
        turn = directTurn(input, exampleDecision);
      } else if (exampleDecision && n === 0 && FIRST_TURNS[input.memberId]) {
        turn = FIRST_TURNS[input.memberId];
      } else if (exampleDecision) {
        const followUp = FOLLOW_UP_TURNS[input.memberId]?.[n - 1];
        turn = followUp ?? genericTurn(input, n);
      } else {
        turn = genericTurn(input, n);
      }

      if (turnOptions?.onStream) {
        turnOptions.onStream({ type: "reset" });
        const chunks = turn.text.match(/(?:\S+\s*){1,4}/gu) ?? [turn.text];
        for (const delta of chunks) {
          turnOptions.signal?.throwIfAborted();
          turnOptions.onStream({ type: "append", delta });
          await pause(options.publicTurnChunkDelayMs ?? 0);
        }
      }
      return turn;
    },
    async closingComment(input, callOptions) {
      callOptions?.signal?.throwIfAborted();
      const exampleClosings: Record<string, string> = {
        "daniel-ek":
          "Measure the shared-workspace path before you burn it. If enterprise still enters through free, keep a narrow invite-free; trial the rest.",
        "david-heinemeier-hansson":
          "Kill free. Charge. Fourteen days. Stop hosting 6,000 people who are not the business.",
        "lulu-cheng-meservey":
          "Whatever you do, write the sentence first. Trust is the word of mouth you are afraid to lose.",
      };
      return isExampleDecision(input.briefing) && exampleClosings[input.memberId]
        ? exampleClosings[input.memberId]
        : genericClosing(input);
    },
    async synthesis({ briefing, transcript }, callOptions) {
      callOptions?.signal?.throwIfAborted();
      if (!isExampleDecision(briefing)) return genericSynthesis(briefing, transcript);
      const speakers = Array.from(
        new Set(transcript.filter((e) => e.kind === "message").map((e) => e.speakerName)),
      );
      const guestEvidence = latestGuestEvidence(transcript);
      return `Agreement: the current free tier is operationally expensive. Disagreement: whether free is still a discovery engine (Ek) or a crowd you should stop hosting (DHH). Unresolved: the story customers will tell, which Lulu treats as the real risk.${guestEvidence ? ` ${guestEvidence.label}.` : ""} Voices so far: ${speakers.join(", ") || "the table"}.`;
    },
    async readout({ briefing, transcript, closingComments }, callOptions) {
      callOptions?.signal?.throwIfAborted();
      return isExampleDecision(briefing)
        ? exampleReadout(briefing, transcript, closingComments)
        : genericReadout(briefing, transcript, closingComments);
    },
  };
}
