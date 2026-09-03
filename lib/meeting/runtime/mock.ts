import type { BoardRuntime, OpeningPosition, ReactInput, ReactResult, Readout, TurnInput, TurnResult } from "../types";

export interface MockRuntimeOptions { delayScale?: number; failOnce?: { method: keyof BoardRuntime; slug?: string } }

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => { if (signal.aborted) return reject(signal.reason); const timer = setTimeout(resolve, ms); signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason ?? new DOMException("Aborted", "AbortError")); }, { once: true }); });
}

export function createMockRuntime(options: MockRuntimeOptions = {}): BoardRuntime & { pacingScale: number; reactMany(inputs: ReactInput[], signal: AbortSignal): Promise<ReactResult[]> } {
  const scale = options.delayScale ?? 1; let failed = false;
  const maybeFail = (method: keyof BoardRuntime, slug?: string) => { if (!failed && options.failOnce?.method === method && (!options.failOnce.slug || options.failOnce.slug === slug)) { failed = true; throw new Error("Injected mock failure"); } };
  const turnCounts = new Map<string, number>();
  const runtime = {
    pacingScale: scale,
    async openingPosition(input, signal): Promise<OpeningPosition> { await wait(1500 * scale, signal); maybeFail("openingPosition", input.slug); return position(input.slug); },
    async turn(input: TurnInput, signal: AbortSignal, onDelta: (delta: string) => void): Promise<TurnResult> {
      maybeFail("turn", input.slug); const count = (turnCounts.get(input.slug) ?? 0) + 1; turnCounts.set(input.slug, count);
      const line = scriptedTurn(input, count); const words = line.split(/(\s+)/); const perWord = Math.max(1, (2000 * scale) / words.length);
      for (const word of words) { await wait(perWord, signal); onDelta(word); }
      return { text: line, meta: { positionUpdate: input.slug === "daniel-ek" && input.directive.type === "answer" && input.directive.fromId === "guest" ? "Preserve free as a measured referral channel." : null, addressedId: input.directive.type === "answer" ? input.directive.fromId : null, askedChair: input.slug === "lulu-cheng-meservey" && count === 1 } };
    },
    async react(input: ReactInput, signal: AbortSignal): Promise<ReactResult> { return (await runtime.reactMany([input], signal))[0]; },
    async reactMany(inputs: ReactInput[], signal: AbortSignal): Promise<ReactResult[]> { await wait(180 * scale, signal); maybeFail("react"); return inputs.map((i) => i.slug === "lulu-cheng-meservey" && i.lastSpeakerId === "daniel-ek" && !i.ownStatements.length ? { reaction: "disagree", urgency: 10, wantsToRebut: true } : { reaction: i.slug === "david-heinemeier-hansson" ? "concern" : i.slug === "daniel-ek" && i.lastSpeakerId === "lulu-cheng-meservey" ? "curious" : null, urgency: i.ownStatements.length ? 3 : 7, wantsToRebut: false }); },
    async closingComment(input, signal) { await wait(250 * scale, signal); maybeFail("closingComment", input.slug); if (input.slug === "daniel-ek") return "Measure the door before you brick it up."; if (input.slug === "david-heinemeier-hansson") return "Keep the door open; stop paying to run other people's indefinite workspaces."; if (input.slug === "lulu-cheng-meservey") return "Whatever you decide, say it first and say it plainly."; return "Test the key assumption before you commit; decide what result would reverse you."; },
    async synthesis(input, signal, onDelta) { maybeFail("synthesis"); const value = "Agreement: Daniel Ek, David Heinemeier Hansson, and Lulu Cheng Meservey agree the current free tier is under-managed and its support cost must come down.\nDisagreement: Daniel and David would keep free as distribution; Lulu would replace permanent free with a time-boxed path and candid communication.\nUnresolved: What is a free workspace worth once invited teams are counted?"; for (const part of value.split(/(\s+)/)) { await wait(8 * scale, signal); onDelta(part); } return value; },
    async readout(input, signal): Promise<Readout> { await wait(300 * scale, signal); maybeFail("readout"); return { decision: input.briefing.split("\n")[0], recommendation: { summary: "Keep an invitation-capable free workspace with its support cost stripped out, and test a 14-day trial for self-started workspaces.", divided: true, detail: "The board remains divided on the free tier's future: Daniel Ek and David Heinemeier Hansson would preserve it as distribution, while Lulu Cheng Meservey would replace permanent free with a time-boxed path plus candid communication." }, options: ["Trial only", "A capped, support-free tier", "A referral-oriented free workspace"], tradeoffs: ["Support burden versus word-of-mouth discovery"], assumptions: ["Referral attribution can be measured"], openQuestions: ["What is the full payback of a free workspace?"], nextActions: ["Instrument referral attribution", "Run a 90-day pricing test", "Draft a plain-language customer announcement"], closingComments: input.closingComments, generatedAt: Date.now(), fallback: false }; },
  } satisfies BoardRuntime & { pacingScale: number; reactMany(inputs: ReactInput[], signal: AbortSignal): Promise<ReactResult[]> };
  return runtime;
}

function position(slug: string): OpeningPosition {
  if (slug === "david-heinemeier-hansson") return { recommendation: "Keep free, strip its support cost.", reasoning: "Free seeds invitations that a quarter of data cannot see.", concern: "A small team subsidizing indefinite operation.", question: "How many paying teams were invited in by a free user?" };
  if (slug === "daniel-ek") return { recommendation: "Redesign free before removing it.", reasoning: "Free can be distribution rather than a price.", concern: "Removing discovery may damage the paid funnel.", question: "What is referral-adjusted payback?" };
  if (slug === "lulu-cheng-meservey") return { recommendation: "Pair the change with a trust-preserving narrative.", reasoning: "Users judge both the decision and how it is explained.", concern: "A surprise destroys goodwill.", question: "What promise did free users believe?" };
  return { recommendation: "Run a bounded test.", reasoning: "The evidence is incomplete.", concern: "Second-order effects.", question: "What result would reverse the decision?" };
}

function scriptedTurn(input: TurnInput, count: number): string {
  if (input.directive.type === "answer") {
    if (input.slug === "lulu-cheng-meservey") return `${input.directive.fromName}, explain the tradeoff before critics do: grandfather early users, name what changes, and show how the new path improves service. Trust survives an unwelcome decision when people hear it directly and plainly.`;
    if (input.slug === "daniel-ek" && input.directive.fromId === "guest") return `${input.directive.fromName}, yes. That evidence strengthens the case that free is distribution, not a price. Keep the invitation path open, remove the costly support behaviors, and measure that channel before you replace it with a trial.`;
    return `${input.directive.fromName}, the new evidence matters. I would test the central assumption explicitly before making the change irreversible.`;
  }
  if (input.directive.type === "rebut" && input.slug === "lulu-cheng-meservey") return `Daniel, discovery is not proof that permanent free is the mechanism. Thirty-four percent found the product there, but 2.3% convert and 6,000 workspaces eat 38% of support. The asset is people inviting people, not indefinite free seats. Chair, which free workspaces actually produced paying customers?`;
  if (input.directive.type === "rebut" && input.slug === "daniel-ek") return `David, the 34% is the number I would stare at, not the 2.3%. A third of paying customers entered through the door you want to brick up. Free may be a distribution channel with bad instrumentation, not merely a failed price.`;
  if (input.directive.type === "rebut") return `${input.directive.targetName}, I see it differently. The number you are leaning on measures the wrong horizon; test the assumption before you make the change irreversible.`;
  if (input.newContext.length) return `That new evidence changes the economics we are debating. Treat the free workspace as an acquisition channel, isolate its support cost, and measure the downstream revenue before removing it.`;
  if (input.slug === "david-heinemeier-hansson" && count === 1) return "Don't kill free. We killed Basecamp's free plan on a clean six-month test and spent ten years learning it was wrong; the seeding effect never shows up in a quarter. Cut the support subsidy, absolutely: self-serve only, fewer costly capabilities. Chair, of that 34%, how many were invited in?";
  if (input.slug === "daniel-ek" && count === 1) return "I would not kill free yet. The 34% is the number to stare at: a third of paying customers walked in through that door. Free is distribution with bad instrumentation, not a failed price. Chair, what do free cohorts look like at month twelve?";
  if (input.slug === "lulu-cheng-meservey" && count === 1) return "The pricing decision and the trust decision are inseparable. Chair, what promise have you made—explicitly or implicitly—to the 6,000 free workspaces? Answer that before you announce anything, or your users will write the story for you.";
  if (input.slug === "daniel-ek") return "Treat free as distribution and measure it accordingly. Cap the expensive behavior, preserve collaboration-driven discovery, and compare cohort economics against a trial instead of making an ideological pricing choice.";
  return `Narrow the experiment, name the tradeoff plainly, and define in advance the evidence that would change this board's view.`;
}
