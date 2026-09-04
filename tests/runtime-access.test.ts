import { describe, expect, it } from "vitest";

import { createRuntimeStatus } from "../app/api/runtime-status/route";
import { allowsDevelopmentLiveRuntime } from "../lib/runtime/access";

describe("live runtime access", () => {
  it("allows development and tests but rejects production and Vercel", () => {
    expect(
      allowsDevelopmentLiveRuntime("http://localhost:3000", { nodeEnv: "development" }),
    ).toBe(true);
    expect(allowsDevelopmentLiveRuntime("http://127.0.0.1:3000", { nodeEnv: "test" })).toBe(
      true,
    );
    expect(
      allowsDevelopmentLiveRuntime("http://[::1]:3000", { nodeEnv: "development" }),
    ).toBe(true);
    expect(
      allowsDevelopmentLiveRuntime("https://board.example", { nodeEnv: "development" }),
    ).toBe(false);
    expect(
      allowsDevelopmentLiveRuntime("http://localhost:3000", { nodeEnv: "production" }),
    ).toBe(false);
    expect(
      allowsDevelopmentLiveRuntime("http://localhost:3000", {
        nodeEnv: "development",
        vercel: "1",
      }),
    ).toBe(false);
  });

  it("never advertises a configured key as live on a public page", () => {
    expect(
      createRuntimeStatus(
        new Request("https://board.example/api/runtime-status"),
        {
          configured: true,
          environment: {
            nodeEnv: "production",
            vercel: "1",
            vercelEnv: "production",
          },
        },
      ),
    ).toMatchObject({
      live: false,
      configured: true,
      runtime: "mock",
      availability: "public-live-disabled",
    });
  });
});
