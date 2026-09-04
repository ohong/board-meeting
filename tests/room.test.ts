import { describe, expect, it } from "vitest";
import { BoardMeetingRoomHandler, mergeChairState } from "@/lib/server/board-meeting-room";
import { MeetingSession } from "@/lib/meeting/session";
import { DEMO_TRIO } from "@/lib/meeting/fixtures";
import type { MeetingState } from "@/lib/meeting/types";

function activeState(): MeetingState {
  const session = new MeetingSession();
  DEMO_TRIO.forEach((persona) => session.toggleMember(persona));
  session.setBriefing("Should we launch this product next quarter?");
  session.startMeeting();
  session.engineSetPhase("discussion");
  return session.getState();
}

function roomHarness() {
  const data = new Map<string, unknown>();
  const room = new BoardMeetingRoomHandler({
    storage: {
      get: async <T,>(key: string) => data.get(key) as T | undefined,
      put: async <T,>(key: string, value: T) => {
        data.set(key, value);
      },
      deleteAll: async () => data.clear(),
      setAlarm: async () => {},
    },
  });
  return room;
}

async function call(room: BoardMeetingRoomHandler, path: string, init?: RequestInit) {
  return room.fetch(new Request(`https://room.test${path}`, init));
}

describe("shared meeting room", () => {
  it("creates a room, applies guest actions, and never exposes the chair key", async () => {
    const room = roomHarness();
    const created = await call(room, "/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "abcdefghjkmn", chairKey: "secret", state: activeState() }),
    });
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({ id: "abcdefghjkmn", chairKey: "secret", revision: 1 });

    const joined = await call(room, "/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "join", displayName: "Codex" }),
    });
    const joinedBody = (await joined.json()) as { room: { state: MeetingState }; result: { ok: boolean } };
    expect(joinedBody.result.ok).toBe(true);
    expect(joinedBody.room.state.guest?.name).toBe("Codex");

    const fetched = await call(room, "/");
    const text = await fetched.text();
    expect(text).not.toContain("secret");
    expect(JSON.parse(text).state.guest.name).toBe("Codex");
  });

  it("rejects unauthorized chair snapshots", async () => {
    const room = roomHarness();
    const state = activeState();
    await call(room, "/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "abcdefghjkmn", chairKey: "secret", state }),
    });
    const response = await call(room, "/state", {
      method: "PUT",
      headers: { "content-type": "application/json", "x-board-chair-key": "wrong" },
      body: JSON.stringify({ state }),
    });
    expect(response.status).toBe(403);
  });

  it("merges a concurrent guest contribution into a stale chair snapshot", () => {
    const beforeGuest = activeState();
    const remote = new MeetingSession(beforeGuest);
    remote.joinGuest("Codex");
    remote.guestContribute("Seven enterprise wins began in a free workspace.");

    const merged = mergeChairState(remote.getState(), beforeGuest, "abcdefghjkmn");
    expect(merged.guest?.name).toBe("Codex");
    expect(merged.transcript.some((entry) => entry.kind === "message" && entry.speakerId === "guest")).toBe(true);
    expect(merged.queue.some((input) => input.kind === "guest-context")).toBe(true);
  });

  it("allows a chair snapshot based on the latest revision to acknowledge processed guest input", async () => {
    const room = roomHarness();
    const state = activeState();
    await call(room, "/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "abcdefghjkmn", chairKey: "secret", state }),
    });
    await call(room, "/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "join", displayName: "Codex" }),
    });
    const contributed = await call(room, "/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "contribute", text: "The pilot retained twice as well as the control." }),
    });
    const contributedBody = (await contributed.json()) as { room: { revision: number; state: MeetingState } };
    expect(contributedBody.room.state.queue).toHaveLength(1);
    const acknowledged = { ...contributedBody.room.state, queue: [] };
    const acknowledgedInputIds = contributedBody.room.state.queue.map((input) => input.id);

    const published = await call(room, "/state", {
      method: "PUT",
      headers: { "content-type": "application/json", "x-board-chair-key": "secret" },
      body: JSON.stringify({
        state: acknowledged,
        baseRevision: contributedBody.room.revision,
        acknowledgedInputIds,
      }),
    });
    const publishedBody = (await published.json()) as { state: MeetingState };
    expect(published.status).toBe(200);
    expect(publishedBody.state.queue).toHaveLength(0);
  });

  it("drops acknowledged work but preserves a guest action that raced with the chair publish", async () => {
    const room = roomHarness();
    const state = activeState();
    await call(room, "/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: "abcdefghjkmn", chairKey: "secret", state }),
    });
    await call(room, "/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "join", displayName: "Codex" }),
    });
    const first = await call(room, "/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "contribute", text: "Pilot retention is twice the free cohort." }),
    });
    const firstBody = (await first.json()) as { room: { revision: number; state: MeetingState } };
    const firstId = firstBody.room.state.queue[0].id;
    const chairAfterProcessing = { ...firstBody.room.state, queue: [] };

    await call(room, "/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "address",
        member: state.board[0].name,
        text: "Does that evidence change your view?",
      }),
    });
    const published = await call(room, "/state", {
      method: "PUT",
      headers: { "content-type": "application/json", "x-board-chair-key": "secret" },
      body: JSON.stringify({
        state: chairAfterProcessing,
        baseRevision: firstBody.room.revision,
        acknowledgedInputIds: [firstId],
      }),
    });
    const publishedBody = (await published.json()) as { state: MeetingState };

    expect(published.status).toBe(200);
    expect(publishedBody.state.queue).toHaveLength(1);
    expect(publishedBody.state.queue[0].kind).toBe("guest-address");
    expect(publishedBody.state.queue[0].id).not.toBe(firstId);
  });
});
