import { MeetingSession } from "../meeting/session";
import {
  ROOM_LIFETIME_MS,
  type RoomActionResponse,
  type RoomGuestAction,
  type RoomSnapshot,
} from "../meeting/room";
import type { MeetingState, QueuedInput, TranscriptEntry } from "../meeting/types";

interface DurableStorageLike {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  deleteAll(): Promise<void>;
  setAlarm(timestamp: number): Promise<void>;
}

interface DurableObjectStateLike {
  storage: DurableStorageLike;
}

interface StoredRoom extends RoomSnapshot {
  chairKey: string;
}

const ROOM_KEY = "room";

function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function publicRoom(room: StoredRoom): RoomSnapshot {
  return {
    id: room.id,
    revision: room.revision,
    state: room.state,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    expiresAt: room.expiresAt,
  };
}

function safeSharedState(state: MeetingState, roomId: string): MeetingState {
  return {
    ...state,
    room: { id: roomId, status: "synced", error: null },
    invitePanelOpen: false,
    notice: null,
    chairComposing: false,
  };
}

function remoteGuestEntry(entry: TranscriptEntry): boolean {
  return (
    (entry.kind === "message" && entry.speakerRole === "guest") ||
    (entry.kind === "event" && (entry.event === "guest-joined" || entry.event === "readout-retrieved")) ||
    entry.kind === "synthesis"
  );
}

function remoteGuestInput(input: QueuedInput): boolean {
  return input.kind === "guest-context" || input.kind === "guest-address" || input.kind === "synthesis-request";
}

/**
 * Chair snapshots are authoritative for model-driven state. Guest-authored entries
 * that arrived after the chair's last poll are merged so a streaming chair update
 * can never erase an invited agent's contribution.
 */
export function mergeChairState(
  current: MeetingState,
  incoming: MeetingState,
  roomId: string,
  acknowledgedInputIds: readonly string[] = [],
): MeetingState {
  const transcriptIds = new Set(incoming.transcript.map((entry) => entry.id));
  const remoteEntries = current.transcript.filter(
    (entry) => remoteGuestEntry(entry) && !transcriptIds.has(entry.id),
  );
  const queueIds = new Set(incoming.queue.map((input) => input.id));
  const acknowledged = new Set(acknowledgedInputIds);
  const remoteInputs = current.queue.filter(
    (input) => remoteGuestInput(input) && !queueIds.has(input.id) && !acknowledged.has(input.id),
  );

  return safeSharedState(
    {
      ...incoming,
      guest: incoming.guest ?? current.guest,
      transcript: [...incoming.transcript, ...remoteEntries].sort((a, b) => a.ts - b.ts),
      queue: [...incoming.queue, ...remoteInputs].sort((a, b) => a.ts - b.ts),
      readoutRetrievedByGuestAt:
        incoming.readoutRetrievedByGuestAt ?? current.readoutRetrievedByGuestAt,
    },
    roomId,
  );
}

function applyGuestAction(state: MeetingState, action: RoomGuestAction) {
  const session = new MeetingSession(state);
  switch (action.type) {
    case "join":
      {
        const result = session.joinGuest(action.displayName, false);
        return { result, state: session.getState() };
      }
    case "contribute":
      return { result: session.guestContribute(action.text), state: session.getState() };
    case "address":
      return { result: session.guestAddress(action.member, action.text), state: session.getState() };
    case "synthesis":
      return { result: session.requestSynthesis("guest"), state: session.getState() };
    case "readout-retrieved": {
      const readout = session.getReadout();
      if (!readout.ok) return { result: readout, state: session.getState() };
      session.markReadoutRetrievedByGuest();
      return { result: { ok: true } as const, state: session.getState() };
    }
  }
}

export class BoardMeetingRoomHandler {
  constructor(private readonly ctx: DurableObjectStateLike) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const stored = await this.ctx.storage.get<StoredRoom>(ROOM_KEY);

    if (request.method === "POST" && url.pathname === "/create") {
      if (stored) return json({ error: "Room already exists." }, 409);
      const input = (await request.json()) as { id?: string; chairKey?: string; state?: MeetingState };
      if (!input.id || !input.chairKey || !input.state) return json({ error: "Invalid room." }, 400);
      const now = Date.now();
      const room: StoredRoom = {
        id: input.id,
        chairKey: input.chairKey,
        revision: 1,
        state: safeSharedState(input.state, input.id),
        createdAt: now,
        updatedAt: now,
        expiresAt: now + ROOM_LIFETIME_MS,
      };
      await this.ctx.storage.put(ROOM_KEY, room);
      await this.ctx.storage.setAlarm(room.expiresAt);
      return json({ ...publicRoom(room), chairKey: room.chairKey }, 201);
    }

    if (!stored || stored.expiresAt <= Date.now()) return json({ error: "Meeting room not found." }, 404);

    if (request.method === "GET" && url.pathname === "/") return json(publicRoom(stored));

    if (request.method === "PUT" && url.pathname === "/state") {
      if (request.headers.get("x-board-chair-key") !== stored.chairKey) {
        return json({ error: "Chair authorization required." }, 403);
      }
      const input = (await request.json()) as {
        state?: MeetingState;
        baseRevision?: number;
        acknowledgedInputIds?: string[];
      };
      if (!input.state) return json({ error: "Meeting state is required." }, 400);
      if (!Number.isInteger(input.baseRevision) || (input.baseRevision ?? -1) < 0) {
        return json({ error: "A valid base revision is required." }, 400);
      }
      if (
        !Array.isArray(input.acknowledgedInputIds) ||
        input.acknowledgedInputIds.some((id) => typeof id !== "string") ||
        input.acknowledgedInputIds.length > 100
      ) {
        return json({ error: "Valid acknowledged input ids are required." }, 400);
      }
      const now = Date.now();
      const room: StoredRoom = {
        ...stored,
        revision: stored.revision + 1,
        state: mergeChairState(stored.state, input.state, stored.id, input.acknowledgedInputIds),
        updatedAt: now,
      };
      await this.ctx.storage.put(ROOM_KEY, room);
      return json(publicRoom(room));
    }

    if (request.method === "POST" && url.pathname === "/action") {
      const action = (await request.json()) as RoomGuestAction;
      if (!action || typeof action.type !== "string") return json({ error: "Invalid action." }, 400);
      const applied = applyGuestAction(stored.state, action);
      const now = Date.now();
      const room: StoredRoom = {
        ...stored,
        revision: stored.revision + 1,
        state: safeSharedState(applied.state, stored.id),
        updatedAt: now,
      };
      await this.ctx.storage.put(ROOM_KEY, room);
      const response: RoomActionResponse = { result: applied.result, room: publicRoom(room) };
      return json(response);
    }

    return json({ error: "Not found." }, 404);
  }

  async alarm(): Promise<void> {
    await this.ctx.storage.deleteAll();
  }
}
