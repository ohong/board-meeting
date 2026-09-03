import type {
  BoardRuntime,
  ClosingComment,
  ExecutiveReadout,
  MemberTurn,
  OpeningPosition,
  RuntimeTurnInput,
  TranscriptEvent,
} from "../types";

async function post<T>(body: unknown): Promise<T> {
  const res = await fetch("/api/member-turn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; error?: string; result?: T };
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "OPENAI_API_KEY is not set.");
  }
  return data.result as T;
}

export function createBrowserRuntime(): BoardRuntime {
  return {
    id: "live",
    formOpeningPosition(input) {
      return post<OpeningPosition>({ capability: "formOpeningPosition", input });
    },
    publicTurn(input) {
      return post<MemberTurn>({ capability: "publicTurn", input });
    },
    closingComment(input) {
      return post<string>({ capability: "closingComment", input });
    },
    synthesis(input) {
      return post<string>({ capability: "synthesis", input });
    },
    readout(input: {
      briefing: string;
      transcript: TranscriptEvent[];
      closingComments: ClosingComment[];
      boardNames: string[];
    }) {
      return post<ExecutiveReadout>({ capability: "readout", input });
    },
  };
}
