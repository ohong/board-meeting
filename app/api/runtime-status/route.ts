import { hasLiveKey } from "@/lib/runtime/live";

export async function GET() {
  const live = hasLiveKey();
  return Response.json({
    live,
    message: live
      ? "Live OpenAI GPT board members are enabled."
      : "OPENAI_API_KEY is not set. The board is running a deterministic mock so you can test the room, orchestration, and WebMCP. Add OPENAI_API_KEY to enable live OpenAI GPT board members.",
  });
}
