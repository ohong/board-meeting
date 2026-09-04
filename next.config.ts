import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

/**
 * Every board member is authored as an eve subagent under `agent/subagents/`, and
 * `scripts/build-personas.mjs` compiles those packages into the registry the app invokes.
 * That is the path the meeting actually runs on, and it needs nothing at request time.
 *
 * `withEve()` additionally mounts the eve runtime at /eve/v1/* so the same agents can be
 * addressed through eve directly. It is opt-in because mounting it makes `next dev` require
 * Node >= 24 and AI Gateway credentials, and hard-fails the dev server without them — which
 * is not a dependency the board meeting should carry. Set EVE_MOUNT=1 to turn it on.
 */
export default process.env.EVE_MOUNT === "1" ? withEve(nextConfig) : nextConfig;
