import { getCloudflareContext } from "@opennextjs/cloudflare";
import { BoardMeetingRoomHandler } from "./board-meeting-room";
import { isRoomId, type CreatedRoom, type RoomActionResponse, type RoomGuestAction, type RoomSnapshot } from "../meeting/room";
import type { MeetingState } from "../meeting/types";

interface RoomStub {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface RoomNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): RoomStub;
}

interface MemoryStorage {
  data: Map<string, unknown>;
  alarm: number | null;
}

const memoryGlobal = globalThis as typeof globalThis & {
  __boardMeetingRooms?: Map<string, BoardMeetingRoomHandler>;
};
const memoryRooms = memoryGlobal.__boardMeetingRooms ?? new Map<string, BoardMeetingRoomHandler>();
memoryGlobal.__boardMeetingRooms = memoryRooms;
const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";

function randomToken(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function memoryRoom(id: string): BoardMeetingRoomHandler {
  const existing = memoryRooms.get(id);
  if (existing) return existing;
  const memory: MemoryStorage = { data: new Map(), alarm: null };
  const room = new BoardMeetingRoomHandler({
    storage: {
      get: async <T,>(key: string) => memory.data.get(key) as T | undefined,
      put: async <T,>(key: string, value: T) => {
        memory.data.set(key, value);
      },
      deleteAll: async () => {
        memory.data.clear();
        memoryRooms.delete(id);
      },
      setAlarm: async (timestamp: number) => {
        memory.alarm = timestamp;
      },
    },
  });
  memoryRooms.set(id, room);
  return room;
}

function roomNamespace(): RoomNamespace | null {
  // `next dev` advertises internal DO bindings but cannot execute them. The
  // in-process store below gives the same route contract during local development.
  if (process.env.NODE_ENV !== "production") return null;
  try {
    const env = getCloudflareContext().env as CloudflareEnv & { BOARD_MEETINGS?: RoomNamespace };
    return env.BOARD_MEETINGS ?? null;
  } catch {
    return null;
  }
}

async function roomRequest(id: string, path: string, init?: RequestInit): Promise<Response> {
  const namespace = roomNamespace();
  if (namespace) {
    const stub = namespace.get(namespace.idFromName(id));
    return stub.fetch(`https://board-room.internal${path}`, init);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("The BOARD_MEETINGS Durable Object binding is not configured.");
  }
  return memoryRoom(id).fetch(new Request(`https://board-room.internal${path}`, init));
}

async function responseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Room request failed (${response.status}).`);
  return body;
}

export function validSharedState(value: unknown): value is MeetingState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<MeetingState>;
  return (
    typeof state.phase === "string" &&
    Array.isArray(state.board) &&
    state.board.length >= 3 &&
    state.board.length <= 6 &&
    typeof state.briefing === "string" &&
    state.briefing.trim().length > 0 &&
    state.briefing.length <= 6_000 &&
    Array.isArray(state.transcript) &&
    Array.isArray(state.queue) &&
    !!state.members &&
    typeof state.members === "object"
  );
}

export async function createRoom(state: MeetingState): Promise<CreatedRoom> {
  if (!validSharedState(state)) throw new Error("The meeting is not ready to share.");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const id = randomToken(12);
    const chairKey = `${randomToken(24)}${randomToken(24)}`;
    const response = await roomRequest(id, "/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, chairKey, state }),
    });
    if (response.status === 409) continue;
    return responseJson<CreatedRoom>(response);
  }
  throw new Error("Could not allocate a unique meeting room.");
}

export async function getRoom(id: string): Promise<RoomSnapshot | null> {
  if (!isRoomId(id)) return null;
  const response = await roomRequest(id, "/");
  if (response.status === 404) return null;
  return responseJson<RoomSnapshot>(response);
}

export async function publishRoomState(
  id: string,
  chairKey: string,
  state: MeetingState,
  baseRevision: number,
  acknowledgedInputIds: string[],
): Promise<RoomSnapshot> {
  if (!isRoomId(id) || !chairKey || !validSharedState(state)) throw new Error("Invalid meeting update.");
  if (!Number.isInteger(baseRevision) || baseRevision < 0) throw new Error("Invalid meeting revision.");
  const response = await roomRequest(id, "/state", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      "x-board-chair-key": chairKey,
    },
    body: JSON.stringify({ state, baseRevision, acknowledgedInputIds }),
  });
  return responseJson<RoomSnapshot>(response);
}

export async function applyRoomGuestAction(id: string, action: RoomGuestAction): Promise<RoomActionResponse> {
  if (!isRoomId(id)) throw new Error("Invalid meeting room.");
  const response = await roomRequest(id, "/action", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(action),
  });
  return responseJson<RoomActionResponse>(response);
}
