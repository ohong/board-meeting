import type { BoardRuntime, MemberContext, ReactInput, ReactResult, TurnMeta, TurnResult } from "../types";

type ReactBatchRuntime = BoardRuntime & { reactMany(inputs: ReactInput[], signal: AbortSignal): Promise<ReactResult[]> };

async function checked(response: Response): Promise<Response> {
  if (response.ok) return response;
  let message = `Request failed (${response.status})`;
  try { const body = await response.json() as { error?: string }; if (body.error) message = body.error; } catch {}
  throw new Error(message);
}

async function postJson<T>(path: string, body: unknown, signal: AbortSignal): Promise<T> {
  const response = await checked(await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal }));
  return response.json() as Promise<T>;
}

async function stream(path: string, body: unknown, signal: AbortSignal, onDelta: (delta: string) => void): Promise<string> {
  const response = await checked(await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal }));
  if (!response.body) throw new Error("The model returned no stream.");
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let text = "";
  while (true) { const { done, value } = await reader.read(); if (done) break; const delta = decoder.decode(value, { stream: true }); text += delta; onDelta(delta); }
  const tail = decoder.decode(); if (tail) { text += tail; onDelta(tail); }
  return text;
}

export function createLiveRuntime(): ReactBatchRuntime {
  const runtime: ReactBatchRuntime = {
    openingPosition: (input, signal) => postJson("/api/board/position", input, signal),
    async turn(input, signal, onDelta) {
      const marker = "<<<META>>>"; let pending = ""; let metaText = ""; let found = false;
      await stream("/api/board/turn", input, signal, (chunk) => {
        if (found) { metaText += chunk; return; }
        pending += chunk; const at = pending.indexOf(marker);
        if (at >= 0) { const publicText = pending.slice(0, at).replace(/\n$/, ""); if (publicText) onDelta(publicText); metaText = pending.slice(at + marker.length); pending = ""; found = true; return; }
        const safe = Math.max(0, pending.length - marker.length);
        if (safe) { onDelta(pending.slice(0, safe)); pending = pending.slice(safe); }
      });
      if (!found && pending) onDelta(pending);
      let meta: TurnMeta = { positionUpdate: null, addressedId: null, askedChair: false };
      if (found) { try { const parsed = JSON.parse(metaText.trim()); meta = { positionUpdate: typeof parsed.positionUpdate === "string" ? parsed.positionUpdate : null, addressedId: typeof parsed.addressedId === "string" ? parsed.addressedId : null, askedChair: parsed.askedChair === true }; } catch {} }
      const text = ""; // Visible text is accumulated by MeetingSession via onDelta.
      return { text, meta } satisfies TurnResult;
    },
    async react(input, signal) { return (await runtime.reactMany([input], signal))[0]; },
    async reactMany(inputs, signal) {
      if (!inputs.length) return [];
      const first = inputs[0];
      const rows = await postJson<Array<{ slug: string } & ReactResult>>("/api/board/react", { members: inputs.map((i) => ({ slug: i.slug, context: memberContext(i) })), lastSpeakerId: first.lastSpeakerId, lastSpeakerName: first.lastSpeakerName, lastText: first.lastText }, signal);
      const bySlug = new Map(rows.map((r) => [r.slug, r]));
      return inputs.map((i) => bySlug.get(i.slug) ?? { reaction: null, urgency: 0, wantsToRebut: false });
    },
    async closingComment(input, signal) { return (await postJson<{ text: string }>("/api/board/closing", input, signal)).text; },
    synthesis: (input, signal, onDelta) => stream("/api/board/synthesis", input, signal, onDelta),
    readout: (input, signal) => postJson("/api/board/readout", input, signal),
  };
  return runtime;
}

function memberContext(input: ReactInput): MemberContext {
  return {
    slug: input.slug,
    briefing: input.briefing,
    phase: input.phase,
    transcript: input.transcript,
    position: input.position,
    ownStatements: input.ownStatements,
    participants: input.participants,
  };
}
