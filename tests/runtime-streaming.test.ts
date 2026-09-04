import { describe, expect, it } from "vitest";

import { createBrowserRuntime, readPublicTurnStream } from "../lib/runtime/browser";
import { createMockRuntime } from "../lib/runtime/mock";
import { PUBLIC_TURN_MAX_CHARS } from "../lib/runtime/schemas";
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

  it.each([
    {
      name: "malformed JSON",
      lines: ["not-json"],
      expectedError: "The board runtime returned malformed JSON in its stream.",
      cancellationFails: true,
    },
    {
      name: "an explicit error",
      lines: [JSON.stringify({ type: "error", code: "EVE_FAILED", error: "Upstream child failed." })],
      expectedError: "Upstream child failed.",
      cancellationFails: false,
    },
    {
      name: "an event after completion",
      lines: [
        JSON.stringify({ type: "complete", result: { text: "Finished." } }),
        JSON.stringify({ type: "append", delta: "Late text must not surface." }),
      ],
      expectedError: "The board runtime emitted a stream event after completion.",
      cancellationFails: false,
    },
    {
      name: "oversized cumulative provisional text",
      lines: [
        JSON.stringify({ type: "append", delta: "a".repeat(2_500) }),
        JSON.stringify({ type: "append", delta: "b".repeat(1_501) }),
      ],
      expectedError: `The board runtime streamed more than ${PUBLIC_TURN_MAX_CHARS} provisional characters.`,
      cancellationFails: false,
    },
  ])("cancels and clears the reader after $name", async ({
    lines,
    expectedError,
    cancellationFails,
  }) => {
    let cancellationReason: unknown;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`${lines.join("\n")}\n`));
      },
      cancel(reason) {
        cancellationReason = reason;
        if (cancellationFails) throw new Error("Reader cancellation failed.");
      },
    });
    const updates: Array<{ type: string; delta?: string }> = [];

    await expect(
      readPublicTurnStream(body, { onStream: (update) => updates.push(update) }),
    ).rejects.toThrow(expectedError);
    expect(cancellationReason).toBeInstanceOf(Error);
    expect((cancellationReason as Error).message).toBe(expectedError);
    expect(updates.at(-1)).toEqual({ type: "reset" });
    expect(updates).not.toContainEqual({
      type: "append",
      delta: "Late text must not surface.",
    });
    expect(
      updates
        .filter((update) => update.type === "append")
        .reduce((length, update) => length + (update.delta?.length ?? 0), 0),
    ).toBeLessThanOrEqual(PUBLIC_TURN_MAX_CHARS);
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

  it("passes cancellation through structured browser runtime requests", async () => {
    let observedSignal: AbortSignal | null = null;
    const fetcher: typeof fetch = (_input, init) => {
      observedSignal = init?.signal as AbortSignal;
      return new Promise<Response>((_resolve, reject) => {
        observedSignal?.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      });
    };
    const runtime = createBrowserRuntime({ fetch: fetcher });
    const controller = new AbortController();
    const pending = runtime.formOpeningPosition(
      { ...publicInput(), capability: "formOpeningPosition" },
      { signal: controller.signal },
    );

    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(observedSignal).toBe(controller.signal);
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
