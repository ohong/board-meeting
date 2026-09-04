import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
// Lets `next dev` see the Cloudflare bindings declared in wrangler.jsonc.
initOpenNextCloudflareForDev();
