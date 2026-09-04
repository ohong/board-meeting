import type { ActionResult, MeetingState } from "./types";

export const ROOM_ID_PATTERN = /^[a-z2-9]{12}$/;
export const ROOM_LIFETIME_MS = 24 * 60 * 60 * 1_000;

export interface RoomSnapshot {
  id: string;
  revision: number;
  state: MeetingState;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface CreatedRoom extends RoomSnapshot {
  chairKey: string;
}

export type RoomGuestAction =
  | { type: "join"; displayName: string }
  | { type: "contribute"; text: string }
  | { type: "address"; member: string; text: string }
  | { type: "synthesis" }
  | { type: "readout-retrieved" };

export interface RoomActionResponse {
  result: ActionResult<Record<string, unknown>>;
  room: RoomSnapshot;
}

export function roomPath(id: string): string {
  return `/m/${id}`;
}

export function isRoomId(value: string): boolean {
  return ROOM_ID_PATTERN.test(value);
}

