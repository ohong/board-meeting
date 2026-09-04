import { describe, expect, it } from "vitest";

import { createBrowserRuntime, readPublicTurnStream } from "../lib/runtime/browser";
import { createMockRuntime } from "../lib/runtime/mock";
import type { RuntimeTurnInput } from "../lib/types";

function publicInput(): RuntimeTurnInput {
  return {
    capability: "publicTurn",
    memberId: "daniel-ek",
    memberName: "Daniel Ek",
    briefing: "Question: Should we change the plan?",
    phase: "discussion",
    transcript: [],
    ownPriorStatements: [],
    boardNames: ["Daniel Ek", "David Heinemeier Hansson", "Lulu Cheng Meservey"],
  };
}

describe("browser public-turn stream", () => {
  it("parses NDJSON records split across arbitrary response chunks", async () => {
    const encoded = new TextEncoder().encode(
      [
        JSON.stringify({ type: "reset" }),
        JSON.stringify({ type: "append", delta: "A bounded " }),
        JSON.stringify({ type: "append", delta: "test." }),
        JSON.stringify({ type: "complete", result: { text: "A bounded test." } }),
        "",
      ].join("\n"),
    );
    const splits = [encoded.slice(0, 7), encoded.slice(7, 31), encoded.slice(31, 54), encoded.slice(54)];
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of splits) controller.enqueue(chunk);
        controller.close();
      },
    });
    const updates: Array<{ type: string; delta?: string }> = [];

    await expect(
      readPublicTurnStream(body, { onStream: (update) => updates.push(update) }),
    ).resolves.toEqual({ text: "A bounded test." });
    expect(updates).toEqual([
      { type: "reset" },
      { type: "append", delta: "A bounded " },
      { type: "append", delta: "test." },
    ]);
  });

  it("passes cancellation through the browser fetch AbortSignal", async () => {
    let observedAbort = false;
    const fetcher: typeof fetch = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const requestSignal = init?.signal as AbortSignal;
        requestSignal.addEventListener(
          "abort",
          () => {
            observedAbort = true;
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });
    const runtime = createBrowserRuntime({ fetch: fetcher });
    const controller = new AbortController();
    const pending = runtime.publicTurn(publicInput(), { signal: controller.signal });

    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(observedAbort).toBe(true);
  });

  it("streams deterministic mock chunks with zero default timing", async () => {
    const runtime = createMockRuntime();
    const updates: Array<{ type: string; delta?: string }> = [];

    const result = await runtime.publicTurn(publicInput(), {
      onStream: (update) => updates.push(update),
    });

    expect(updates[0]).toEqual({ type: "reset" });
    expect(updates.filter((update) => update.type === "append").length).toBeGreaterThan(1);
    expect(updates.flatMap((update) => update.delta ?? []).join("")).toBe(result.text);
  });
});
