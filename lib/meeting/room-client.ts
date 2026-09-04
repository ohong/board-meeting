"use client";

import type { MeetingSession } from "./session";
import {
  isRoomId,
  roomPath,
  type CreatedRoom,
  type RoomActionResponse,
  type RoomGuestAction,
  type RoomSnapshot,
} from "./room";

const creating = new WeakMap<MeetingSession, Promise<CreatedRoom>>();

async function json<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Meeting room request failed (${response.status}).`);
  return body;
}

export function roomIdFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/^\/m\/([^/]+)\/?$/);
  const id = match?.[1]?.toLowerCase() ?? "";
  return isRoomId(id) ? id : null;
}

export function roomShareUrl(id: string): string {
  if (typeof window === "undefined") return roomPath(id);
  const url = new URL(roomPath(id), window.location.origin);
  if (new URL(window.location.href).searchParams.get("runtime") === "mock") {
    url.searchParams.set("runtime", "mock");
  }
  return url.toString();
}

function chairStorageKey(id: string): string {
  return `board-meeting-chair:${id}`;
}

export function storedChairKey(id: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(chairStorageKey(id));
  } catch {
    return null;
  }
}

function rememberChairKey(id: string, chairKey: string): void {
  try {
    window.sessionStorage.setItem(chairStorageKey(id), chairKey);
  } catch {
    // The active tab still retains the key on MeetingSession when storage is blocked.
  }
}

function moveAddressBarToRoom(id: string): void {
  const url = new URL(roomShareUrl(id));
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
}

export function startNewMeeting(session: MeetingSession): void {
  const mock = new URL(window.location.href).searchParams.get("runtime") === "mock";
  session.reset();
  window.location.assign(mock ? "/?runtime=mock" : "/");
}

export async function ensureSharedRoom(session: MeetingSession): Promise<CreatedRoom> {
  const roomId = session.getRoomId();
  const chairKey = session.getChairKey();
  if (roomId && chairKey) {
    const room = await fetchRoom(roomId);
    return { ...room, chairKey };
  }

  const pending = creating.get(session);
  if (pending) return pending;

  const promise = (async () => {
    session.markRoomCreating();
    const startedAtVersion = session.getMutationVersion();
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: session.getState() }),
      });
      const room = await json<CreatedRoom>(response);
      rememberChairKey(room.id, room.chairKey);
      const unchanged = session.getMutationVersion() === startedAtVersion;
      session.attachRoom(room.id, room.chairKey);
      session.applyRoomState(room.state, false, room.revision, !unchanged);
      moveAddressBarToRoom(room.id);
      return room;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create a shared room.";
      session.markRoomError(message);
      throw error;
    } finally {
      creating.delete(session);
    }
  })();
  creating.set(session, promise);
  return promise;
}

export async function fetchRoom(id: string): Promise<RoomSnapshot> {
  return json<RoomSnapshot>(
    await fetch(`/api/rooms/${encodeURIComponent(id)}`, { cache: "no-store" }),
  );
}

export async function refreshRoom(session: MeetingSession, id = session.getRoomId()): Promise<RoomSnapshot> {
  if (!id) throw new Error("No shared meeting is connected.");
  const room = await fetchRoom(id);
  const mergeGuestOnly = session.isChair() && session.getState().startedAt !== null;
  session.applyRoomState(room.state, session.isChair(), room.revision, mergeGuestOnly);
  return room;
}

export async function publishRoom(session: MeetingSession): Promise<RoomSnapshot> {
  const id = session.getRoomId();
  const chairKey = session.getChairKey();
  if (!id || !chairKey) throw new Error("Chair room connection is unavailable.");
  const state = session.getState();
  const baseRevision = session.getRoomRevision();
  const acknowledgedInputIds = session.getAcknowledgedRoomInputIds();
  const room = await json<RoomSnapshot>(
    await fetch(`/api/rooms/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-board-chair-key": chairKey,
      },
      body: JSON.stringify({ state, baseRevision, acknowledgedInputIds }),
    }),
  );
  session.applyRoomState(room.state, true, room.revision, true);
  return room;
}

export async function performRoomGuestAction(
  session: MeetingSession,
  action: RoomGuestAction,
): Promise<RoomActionResponse> {
  const id = session.getRoomId() ?? roomIdFromLocation();
  if (!id) throw new Error("Open a shared meeting link before joining.");
  if (!session.getRoomId()) session.attachRoom(id, storedChairKey(id));
  const response = await json<RoomActionResponse>(
    await fetch(`/api/rooms/${encodeURIComponent(id)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(action),
    }),
  );
  session.applyRoomState(
    response.room.state,
    session.isChair(),
    response.room.revision,
    session.isChair(),
  );
  return response;
}

export async function connectRoomFromLocation(session: MeetingSession): Promise<RoomSnapshot | null> {
  const id = roomIdFromLocation();
  if (!id) return null;
  if (!session.getRoomId()) session.attachRoom(id, storedChairKey(id));
  return refreshRoom(session, id);
}
