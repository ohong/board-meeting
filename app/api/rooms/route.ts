import { createRoom } from "@/lib/server/room-store";
import { rejectCrossOrigin } from "@/lib/server/models";
import type { MeetingState } from "@/lib/meeting/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { state?: unknown };
    const room = await createRoom(body.state as MeetingState);
    return Response.json(room, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the meeting room.";
    return Response.json({ error: message }, { status: 400 });
  }
}
