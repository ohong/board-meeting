import { hasLiveKey } from "@/lib/runtime/live";

export const runtime = "nodejs";

/** Whether live board agents are available. The key itself never leaves the server. */
export async function GET() {
  return Response.json({ live: hasLiveKey() });
}
