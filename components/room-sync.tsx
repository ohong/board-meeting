"use client";

import { useEffect } from "react";
import { useMeetingState, useSession } from "@/lib/meeting/context";
import {
  connectRoomFromLocation,
  ensureSharedRoom,
  publishRoom,
  refreshRoom,
  roomIdFromLocation,
  storedChairKey,
} from "@/lib/meeting/room-client";

const POLL_MS = 900;
const PUBLISH_DEBOUNCE_MS = 90;

/** Keeps the chair and invited agent tabs projected from one canonical room. */
export function RoomSync() {
  const session = useSession();
  const state = useMeetingState();
  const roomId = state.room?.id ?? roomIdFromLocation();

  // A normal browser flow creates the room as soon as Start Board Meeting succeeds.
  useEffect(() => {
    if (state.phase !== "forming" || state.room) return;
    void ensureSharedRoom(session).catch((error) => {
      const message = error instanceof Error ? error.message : "Could not share this meeting.";
      session.notify(`The meeting is running locally, but its invite link could not be created: ${message}`);
    });
  }, [session, state.phase, state.room]);

  // Direct visits to /m/:id load the existing room. A matching key in this tab's
  // sessionStorage restores chair authority; invitation links never contain it.
  useEffect(() => {
    const id = roomIdFromLocation();
    if (!id || session.getRoomId()) return;
    session.attachRoom(id, storedChairKey(id));
    void connectRoomFromLocation(session)
      .then(() => session.resumeEngine())
      .catch((error) => {
        session.markRoomError(error instanceof Error ? error.message : "Meeting room not found.");
      });
  }, [session]);

  // Every participant polls the compact canonical snapshot. Only the chair wakes
  // the orchestration engine when a newly queued guest action arrives.
  useEffect(() => {
    if (!roomId) return;
    let stopped = false;
    const poll = () => {
      void refreshRoom(session, roomId).catch((error) => {
        if (!stopped) session.markRoomError(error instanceof Error ? error.message : "Room sync failed.");
      });
    };
    const interval = window.setInterval(poll, POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [roomId, session]);

  // The chair is the model-orchestration host. Publish its deterministic session
  // updates in short batches; the server merges concurrent guest contributions.
  useEffect(() => {
    if (!roomId || !session.getChairKey()) return;
    let timer: number | null = null;
    let publishing = false;
    let queued = false;
    let stopped = false;

    const flush = async () => {
      timer = null;
      if (publishing) {
        queued = true;
        return;
      }
      publishing = true;
      try {
        await publishRoom(session);
      } catch (error) {
        if (!stopped) session.markRoomError(error instanceof Error ? error.message : "Room sync failed.");
      } finally {
        publishing = false;
        if (queued && !stopped) {
          queued = false;
          timer = window.setTimeout(flush, PUBLISH_DEBOUNCE_MS);
        }
      }
    };

    const unsubscribe = session.subscribe(() => {
      if (stopped || session.isApplyingRoomState()) return;
      const current = session.getState();
      if (current.board.length < 3 || !current.startedAt) return;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(flush, PUBLISH_DEBOUNCE_MS);
    });

    return () => {
      stopped = true;
      unsubscribe();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [roomId, session]);

  return null;
}

