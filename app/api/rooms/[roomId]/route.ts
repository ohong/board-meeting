import { applyRoomGuestAction, getRoom, publishRoomState } from "@/lib/server/room-store";
import { rejectCrossOrigin } from "@/lib/server/models";
import type { MeetingState } from "@/lib/meeting/types";
import type { RoomGuestAction } from "@/lib/meeting/room";

export const runtime = "nodejs";

function failure(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Meeting room request failed.";
  return Response.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

type RoomRouteContext = { params: Promise<{ roomId: string }> };

export async function GET(_request: Request, context: RoomRouteContext) {
  try {
    const { roomId } = await context.params;
    const room = await getRoom(roomId);
    return room
      ? Response.json(room, { headers: { "cache-control": "no-store" } })
      : Response.json({ error: "Meeting room not found." }, { status: 404 });
  } catch (error) {
    return failure(error, 500);
  }
}

export async function PUT(request: Request, context: RoomRouteContext) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  try {
    const { roomId } = await context.params;
    const body = (await request.json()) as {
      state?: MeetingState;
      baseRevision?: number;
      acknowledgedInputIds?: string[];
    };
    if (!body.state) return failure(new Error("Meeting state is required."));
    if (!Number.isInteger(body.baseRevision) || (body.baseRevision ?? -1) < 0) {
      return failure(new Error("A valid base revision is required."));
    }
    if (
      !Array.isArray(body.acknowledgedInputIds) ||
      body.acknowledgedInputIds.some((id) => typeof id !== "string") ||
      body.acknowledgedInputIds.length > 100
    ) {
      return failure(new Error("Valid acknowledged input ids are required."));
    }
    const room = await publishRoomState(
      roomId,
      request.headers.get("x-board-chair-key") ?? "",
      body.state,
      body.baseRevision ?? 0,
      body.acknowledgedInputIds,
    );
    return Response.json(room, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const status = error instanceof Error && error.message.includes("authorization") ? 403 : 400;
    return failure(error, status);
  }
}

export async function POST(request: Request, context: RoomRouteContext) {
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  try {
    const { roomId } = await context.params;
    const action = (await request.json()) as RoomGuestAction;
    const result = await applyRoomGuestAction(roomId, action);
    return Response.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return failure(error);
  }
}
