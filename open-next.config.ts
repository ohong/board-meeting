import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No ISR or `use cache` in this app (the board page is force-dynamic, the rest is
// prerendered at build time), so the default in-memory overrides are enough.
export default defineCloudflareConfig();
