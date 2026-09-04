import { describe, expect, it, vi } from "vitest";

import { run } from "../scripts/fal-image-to-video.mjs";

const queueBase = "https://queue.fal.run/minimax/h3-max/image-to-video";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function memoryRuntime(fetchImpl: typeof fetch) {
  const files = new Map<string, string | Buffer>();
  return {
    files,
    runtime: {
      access: async (path: string) => {
        if (!files.has(path)) throw Object.assign(new Error("missing"), { code: "ENOENT" });
      },
      fetch: fetchImpl,
      mkdir: async () => undefined,
      now: () => Date.parse("2026-09-04T20:00:00.000Z"),
      readFile: async (path: string) => {
        const contents = files.get(path);
        return contents === undefined ? Buffer.from("image") : Buffer.from(contents);
      },
      sleep: async () => undefined,
      stat: async () => ({ isFile: () => true, size: 5 }),
      writeFile: async (path: string, contents: string | Buffer, options?: { flag?: string }) => {
        if (options?.flag === "wx" && files.has(path)) throw Object.assign(new Error("exists"), { code: "EEXIST" });
        files.set(path, contents);
      },
    },
  };
}

describe("fal image-to-video CLI", () => {
  it("validates a local dry run without a key, network request, or base64 output", async () => {
    const fetchMock = vi.fn(() => {
      throw new Error("network should not be called");
    });
    const { runtime } = memoryRuntime(fetchMock as unknown as typeof fetch);
    const logs: string[] = [];

    await run(["--image", "frame.png", "--prompt", "Slow push in", "--dry-run"], {
      cwd: "/repo",
      env: {},
      log: (message: string) => logs.push(message),
      runtime,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(logs.join("\n")).toContain('"source": "local-file"');
    expect(logs.join("\n")).not.toContain("base64");
  });

  it("fails clearly before the network when FAL_KEY is missing", async () => {
    const fetchMock = vi.fn();
    const { runtime } = memoryRuntime(fetchMock as unknown as typeof fetch);

    await expect(
      run(["--image", "https://assets.example/frame.png", "--prompt", "Slow push in"], {
        cwd: "/repo",
        env: {},
        runtime,
      }),
    ).rejects.toThrow("FAL_KEY is missing. Add it to /repo/.env.local");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits once, follows returned queue URLs, and downloads without the key", async () => {
    const requestId = "request-123";
    const statusUrl = `${queueBase}/requests/${requestId}/status`;
    const responseUrl = `${queueBase}/requests/${requestId}`;
    const videoUrl = "https://v3.fal.media/files/video.mp4";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ request_id: requestId, status_url: statusUrl, response_url: responseUrl }))
      .mockResolvedValueOnce(jsonResponse({ status: "IN_QUEUE", queue_position: 1 }))
      .mockResolvedValueOnce(jsonResponse({ status: "COMPLETED" }))
      .mockResolvedValueOnce(jsonResponse({ video: { url: videoUrl, content_type: "video/mp4" } }))
      .mockResolvedValueOnce(new Response(Buffer.from("video-bytes"), { status: 200 }));
    const { files, runtime } = memoryRuntime(fetchMock as unknown as typeof fetch);

    const result = await run(
      ["--image", "https://assets.example/frame.png", "--prompt", "Slow push in", "--output", "clip.mp4"],
      { cwd: "/repo", env: { FAL_KEY: "test-secret" }, log: () => undefined, runtime },
    );

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(fetchMock.mock.calls[0][0]).toBe(queueBase);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", redirect: "manual" });
    expect(fetchMock.mock.calls[1][0]).toBe(statusUrl);
    expect(fetchMock.mock.calls[3][0]).toBe(responseUrl);
    expect(fetchMock.mock.calls[4][0]).toBe(videoUrl);
    expect(fetchMock.mock.calls[4][1]).not.toHaveProperty("headers");
    expect(files.get("/repo/clip.mp4")).toEqual(Buffer.from("video-bytes"));
    expect(result.requestId).toBe(requestId);
  });

  it("resumes with the documented model request routes and does not submit", async () => {
    const requestId = "resume-456";
    const videoUrl = "https://v3.fal.media/files/resumed.mp4";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ status: "COMPLETED" }))
      .mockResolvedValueOnce(jsonResponse({ video: { url: videoUrl } }))
      .mockResolvedValueOnce(new Response(Buffer.from("resumed"), { status: 200 }));
    const { files, runtime } = memoryRuntime(fetchMock as unknown as typeof fetch);
    const metadataFile = `/repo/exports/fal-video/${requestId}.fal.json`;
    files.set(metadataFile, JSON.stringify({
      requestId,
      statusUrl: `${queueBase}/requests/${requestId}/status`,
      responseUrl: `${queueBase}/requests/${requestId}`,
      submittedAt: "2026-09-04T19:00:00.000Z",
      input: { prompt: "Original prompt" },
    }));

    await run(["--request-id", requestId], {
      cwd: "/repo",
      env: { FAL_KEY: "test-secret" },
      log: () => undefined,
      runtime,
    });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${queueBase}/requests/${requestId}/status`,
      `${queueBase}/requests/${requestId}`,
      videoUrl,
    ]);
    expect(fetchMock.mock.calls.every(([, init]) => init?.method !== "POST")).toBe(true);
    const savedMetadata = JSON.parse(String(files.get(metadataFile)));
    expect(savedMetadata.submittedAt).toBe("2026-09-04T19:00:00.000Z");
    expect(savedMetadata.input.prompt).toBe("Original prompt");
    expect(savedMetadata.resumedAt).toBe("2026-09-04T20:00:00.000Z");
  });

  it("prints a resume command when the bounded poll times out after submission", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ request_id: "timeout-789" }));
    const { runtime } = memoryRuntime(fetchMock as unknown as typeof fetch);
    const logs: string[] = [];

    await expect(
      run([
        "--image",
        "https://assets.example/frame.png",
        "--prompt",
        "Slow push in",
        "--output",
        "clips/$(touch should-not-run).mp4",
      ], {
        cwd: "/repo",
        env: { FAL_KEY: "test-secret" },
        log: (message: string) => logs.push(message),
        runtime,
        timeoutMs: 0,
      }),
    ).rejects.toThrow("Timed out waiting for fal");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logs.join("\n")).toContain("--request-id timeout-789");
    expect(logs.join("\n")).toContain("--output '/repo/clips/$(touch should-not-run).mp4'");
  });

  it("surfaces completed queue failures with a resume command", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ request_id: "failed-101" }))
      .mockResolvedValueOnce(jsonResponse({ status: "COMPLETED", error: "input rejected" }));
    const { runtime } = memoryRuntime(fetchMock as unknown as typeof fetch);
    const logs: string[] = [];

    await expect(
      run(["--image", "https://assets.example/frame.png", "--prompt", "Slow push in"], {
        cwd: "/repo",
        env: { FAL_KEY: "test-secret" },
        log: (message: string) => logs.push(message),
        runtime,
      }),
    ).rejects.toThrow("fal generation failed: input rejected");
    expect(logs.join("\n")).toContain("--request-id failed-101");
  });
});
