"use client";

/**
 * WebMCP site tools — OWNED BY THE WEBMCP WORKSTREAM.
 *
 * Registers the tools named in `WEBMCP_TOOL_NAMES` (lib/meeting/types.ts) on
 * `document.modelContext` and routes every one of them to the SAME `MeetingSession`
 * actions the human UI calls. Launched meetings are projected through one shared
 * room so an invitation opened in another browser reaches the same transcript.
 *
 * Design rules taken from the spec + Chrome/OpenAI guidance:
 *  - `document.modelContext` first, `navigator.modelContext` as a legacy fallback,
 *    always feature-detecting the *method* (§0.1 of the research brief).
 *  - Registration happens once, in one effect with empty deps, from one component
 *    mounted in the root layout. The latest session is read through a ref.
 *  - A single AbortController unregisters the whole batch on unmount.
 *  - `execute` NEVER throws. Errors come back as data (`{ ok:false, error }`) so the
 *    calling agent can self-correct; a thrown error would reach it as an opaque
 *    `UnknownError`.
 *  - Every result is kept under 1,450 JSON characters by truncating and paginating.
 *  - No end-meeting tool exists. Only the human chair can close the meeting.
 */

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/meeting/context";
import type { MeetingSession } from "@/lib/meeting/session";
import {
  WEBMCP_TOOL_NAMES,
  type ActionResult,
  type ActionErrorCode,
  type MeetingState,
  type WebMcpToolName,
} from "@/lib/meeting/types";
import {
  connectRoomFromLocation,
  ensureSharedRoom,
  performRoomGuestAction,
  refreshRoom,
  roomIdFromLocation,
  roomShareUrl,
} from "@/lib/meeting/room-client";
import type { CreatedRoom, RoomGuestAction } from "@/lib/meeting/room";
import {
  READOUT_SECTIONS,
  readoutSectionItems,
  readoutSectionToText,
  readoutToText,
  type ReadoutSection,
} from "./readout-format";

/**
 * Compact first-call readout shapes. EVERY section is always present; overflow is
 * handled by clipping items (and, at the harshest steps, showing one per list) —
 * never by dropping a section, so "retrieve the memo" never reads back a fragment.
 */
interface ReadoutCompactShape {
  decisionCap: number;
  summaryCap: number;
  detailCap: number;
  itemCap: number;
  items: number;
  closingItems: number;
}

const READOUT_COMPACT_SHAPES: ReadoutCompactShape[] = [
  { decisionCap: 200, summaryCap: 400, detailCap: 160, itemCap: 90, items: 2, closingItems: 6 },
  { decisionCap: 180, summaryCap: 360, detailCap: 140, itemCap: 78, items: 2, closingItems: 6 },
  { decisionCap: 160, summaryCap: 320, detailCap: 120, itemCap: 66, items: 2, closingItems: 5 },
  { decisionCap: 160, summaryCap: 280, detailCap: 110, itemCap: 90, items: 1, closingItems: 4 },
  { decisionCap: 140, summaryCap: 220, detailCap: 90, itemCap: 70, items: 1, closingItems: 3 },
  { decisionCap: 120, summaryCap: 180, detailCap: 70, itemCap: 55, items: 1, closingItems: 2 },
];

const READOUT_LIST_SECTIONS = [
  "options",
  "tradeoffs",
  "assumptions",
  "open_questions",
  "next_actions",
  "closing_comments",
] as const satisfies readonly ReadoutSection[];

// ---------------------------------------------------------------------------
// Output budget (Chrome's provisional tool-output budget is 1.5K characters).
// ---------------------------------------------------------------------------

export const MAX_OUTPUT_CHARACTERS = 1_450;

const DEFAULT_TRANSCRIPT_LIMIT = 6;
const MIN_TRANSCRIPT_LIMIT = 1;
const MAX_TRANSCRIPT_LIMIT = 12;

/**
 * Progressive degradation for `inspect_board_meeting`. The first shape that fits the
 * output budget wins; if even the leanest shape is too big, transcript entries are
 * dropped from the oldest end (the agent can page back for them).
 */
interface InspectShape {
  textCap: number;
  briefingCap: number;
  roleCap: number;
  participants: "full" | "compact" | "none";
}

const INSPECT_SHAPES: InspectShape[] = [
  // `participants` is redundant with board + guest + the chair, so it goes first;
  // each member's role is what the agent needs to pick whom to address, so it stays.
  { textCap: 240, briefingCap: 400, roleCap: 44, participants: "full" },
  { textCap: 210, briefingCap: 340, roleCap: 44, participants: "compact" },
  { textCap: 180, briefingCap: 280, roleCap: 44, participants: "none" },
  { textCap: 150, briefingCap: 220, roleCap: 44, participants: "none" },
  { textCap: 115, briefingCap: 170, roleCap: 32, participants: "none" },
  { textCap: 80, briefingCap: 120, roleCap: 0, participants: "none" },
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function jsonLength(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? Number.POSITIVE_INFINITY;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

type ToolFailure = { ok: false; error: { code: ActionErrorCode; message: string } };

function toolError(code: ActionErrorCode, message: string): ToolFailure {
  return { ok: false, error: { code, message } };
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function asInt(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() !== "false" && value !== "0";
  return Boolean(value);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function syncRoomForTool(session: MeetingSession): Promise<void> {
  const locationRoom = roomIdFromLocation();
  if (!session.getRoomId() && locationRoom) {
    await connectRoomFromLocation(session);
  } else if (session.getRoomId()) {
    await refreshRoom(session);
  }
}

async function runGuestAction(
  session: MeetingSession,
  action: RoomGuestAction,
  local: () => ActionResult<Record<string, unknown>>,
): Promise<ActionResult<Record<string, unknown>>> {
  if (session.getRoomId() || roomIdFromLocation()) {
    return (await performRoomGuestAction(session, action)).result;
  }
  return local();
}

// ---------------------------------------------------------------------------
// Transcript projection for agents
// ---------------------------------------------------------------------------

interface AgentTranscriptLine {
  speaker: string;
  to: string | null;
  text: string;
}

/** System events worth showing an agent; the rest are UI noise. */
const VISIBLE_EVENTS = new Set([
  "guest-joined",
  "positions-ready",
  "meeting-ending",
  "meeting-ended",
  "notice",
]);

function agentTranscript(state: MeetingState): AgentTranscriptLine[] {
  const lines: AgentTranscriptLine[] = [];
  for (const entry of state.transcript) {
    if (entry.kind === "message") {
      if (!entry.text.trim()) continue;
      lines.push({ speaker: entry.speakerName, to: entry.addressedName, text: entry.text });
    } else if (entry.kind === "synthesis") {
      if (!entry.text.trim()) continue;
      // The hint in request_board_synthesis promises this exact speaker label.
      lines.push({ speaker: "Secretary", to: null, text: entry.text });
    } else if (VISIBLE_EVENTS.has(entry.event)) {
      lines.push({ speaker: "System", to: null, text: entry.text });
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// "What should the agent do next?" — the tool chain is the API contract.
// ---------------------------------------------------------------------------

function nextHint(state: MeetingState): string {
  const joined = !!state.guest && state.guest.status !== "empty";
  const guestMessages = state.transcript.filter(
    (e) => e.kind === "message" && e.speakerId === "guest",
  );
  const hasContributed = guestMessages.some(
    (e) => e.kind === "message" && e.addressedTo === "board",
  );
  const hasAddressed = guestMessages.some(
    (e) => e.kind === "message" && e.addressedTo !== "board",
  );
  const hasSynthesis = state.transcript.some((e) => e.kind === "synthesis");

  if (state.readoutStatus === "ready" && state.readout) {
    return "The meeting is over and the readout exists. Call get_board_meeting_readout to retrieve it.";
  }
  if (state.phase === "closing") {
    return "The chair has ended the meeting and the readout is being written. Call get_board_meeting_readout in about ten seconds.";
  }
  if (state.phase === "selecting" || state.phase === "briefing") {
    return "No meeting is live yet. To create one yourself, call list_board_advisers and then launch_board_meeting; otherwise wait for the human chair to launch it.";
  }
  if (!joined) {
    return "You have not joined; call join_board_meeting with your own name.";
  }
  if (state.phase === "forming") {
    return "You hold the guest seat. The board is still forming opening positions. Call inspect_board_meeting again in about ten seconds, then contribute_to_board_meeting.";
  }
  if (!hasContributed) {
    return "You hold the guest seat. Call contribute_to_board_meeting with context the board does not have yet.";
  }
  if (!hasAddressed) {
    return "Call address_board_member to ask one focused question of the member most likely to be moved by your context.";
  }
  if (!hasSynthesis) {
    return "Call inspect_board_meeting to read the answer, then request_board_synthesis for where the board now agrees and disagrees.";
  }
  return "Keep reading with inspect_board_meeting. After the human chair ends the meeting, call get_board_meeting_readout.";
}

// ---------------------------------------------------------------------------
// Result-size enforcement (last line of defence)
// ---------------------------------------------------------------------------

function enforceBudget(toolName: string, result: unknown): unknown {
  if (jsonLength(result) <= MAX_OUTPUT_CHARACTERS) return result;
  if (result && typeof result === "object" && !Array.isArray(result)) {
    const clone: Record<string, unknown> = { ...(result as Record<string, unknown>) };
    for (let i = 0; i < 16 && jsonLength(clone) > MAX_OUTPUT_CHARACTERS; i += 1) {
      let key: string | null = null;
      let longest = 0;
      for (const [k, v] of Object.entries(clone)) {
        if (typeof v === "string" && v.length > longest) {
          longest = v.length;
          key = k;
        }
      }
      if (!key || longest < 40) break;
      clone[key] = truncate(clone[key] as string, Math.floor(longest / 2));
      clone.truncated = true;
    }
    if (jsonLength(clone) <= MAX_OUTPUT_CHARACTERS) return clone;
  }
  return toolError(
    "NOT_AVAILABLE",
    `The ${toolName} result was too large to return. Ask for a smaller transcript_limit, or one readout section at a time.`,
  );
}

// ---------------------------------------------------------------------------
// Tool descriptors
// ---------------------------------------------------------------------------

export interface BoardTool {
  name: WebMcpToolName;
  title: string;
  description: string;
  inputSchema: object;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute: (
    input?: Record<string, unknown>,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown>;
}

export type BoardToolMap = Record<WebMcpToolName, BoardTool>;

/** Wraps a handler so it can never throw and can never exceed the output budget. */
function guarded(
  name: WebMcpToolName,
  handler: (
    input: Record<string, unknown>,
    options?: { signal?: AbortSignal },
  ) => Promise<unknown> | unknown,
): BoardTool["execute"] {
  return async (input, options) => {
    try {
      const result = await handler(input ?? {}, options);
      return enforceBudget(name, result);
    } catch (error) {
      return toolError(
        "NOT_AVAILABLE",
        `${name} could not complete (${errorText(error)}). The human meeting is unaffected; call inspect_board_meeting to re-read the state.`,
      );
    }
  };
}

/** Waits for a streaming synthesis entry to finish. Never rejects. */
function waitForSynthesis(
  session: MeetingSession,
  entryId: string,
  seconds: number,
  signal?: AbortSignal,
): Promise<{ finished: boolean; text: string; failed: boolean }> {
  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe: (() => void) | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const current = () => {
      const entry = session.getState().transcript.find((e) => e.id === entryId);
      return entry && entry.kind === "synthesis" ? entry : null;
    };

    const settle = (finished: boolean) => {
      if (settled) return;
      settled = true;
      if (unsubscribe) unsubscribe();
      if (timer) clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      const entry = current();
      resolve({ finished, text: entry?.text ?? "", failed: !!entry?.failed });
    };

    function onAbort() {
      settle(false);
    }

    const check = () => {
      const entry = current();
      if (!entry || !entry.streaming) settle(true);
    };

    if (signal?.aborted) {
      settle(false);
      return;
    }
    signal?.addEventListener("abort", onAbort);
    unsubscribe = session.subscribe(check);
    timer = setTimeout(() => settle(false), Math.max(0, seconds) * 1000);
    check();
  });
}

/**
 * The handlers, sharing one `MeetingSession` accessor.
 *
 * Exported so the dev harness (app/dev/webmcp) and tests/webmcp-tools.test.ts
 * exercise exactly the same code that gets registered with the browser.
 */
export function createBoardTools(
  getSession: () => MeetingSession,
  dependencies: { createRoom?: (session: MeetingSession) => Promise<CreatedRoom> } = {},
): BoardToolMap {
  /** Per-meeting guard for the one-time "readout retrieved" system event. */
  let readoutMarkedFor: number | null = null;
  const createRoom = dependencies.createRoom ?? ensureSharedRoom;

  const listAdvisers: BoardTool = {
    name: "list_board_advisers",
    title: "List available board advisers",
    description:
      "List the advisers available for a new board meeting, including the stable ids to pass to launch_board_meeting and each person's decision-making lens. Use this first when you are creating the meeting yourself.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: guarded("list_board_advisers", () => {
      const advisers = getSession().getCatalog();
      if (!advisers.length) return toolError("NOT_AVAILABLE", "The adviser catalog is still loading. Try again shortly.");
      return {
        ok: true,
        advisers: advisers.map((persona) => ({
          id: persona.slug,
          name: persona.name,
          focus: truncate(persona.lenses.slice(0, 2).join(", ") || persona.role, 48),
        })),
        limits: { minimum: 3, maximum: 6 },
        hint: "Choose 3–6 distinct ids, write the decision briefing, then call launch_board_meeting.",
      };
    }),
  };

  const launch: BoardTool = {
    name: "launch_board_meeting",
    title: "Launch a board meeting",
    description:
      "Create and start a shareable board meeting from the empty page. Choose three to six adviser ids from list_board_advisers and provide the complete decision briefing. The result includes the unique meeting URL that a person or another agent can open.",
    inputSchema: {
      type: "object",
      properties: {
        advisers: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          uniqueItems: true,
          items: { type: "string" },
          description: "Three to six adviser ids or unambiguous names, in seating order.",
        },
        briefing: {
          type: "string",
          minLength: 1,
          maxLength: 6000,
          description: "The decision, evidence, constraints, and metrics the board should consider.",
        },
      },
      required: ["advisers", "briefing"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: guarded("launch_board_meeting", async (input) => {
      const session = getSession();
      const refs = Array.isArray(input.advisers)
        ? input.advisers.map(asString).map((value) => value.trim()).filter(Boolean)
        : [];
      const board = refs.map((ref) => session.resolveCatalogMember(ref));
      const unknown = refs.filter((_, index) => !board[index]);
      if (unknown.length) {
        return {
          ...toolError("NOT_FOUND", `Unknown adviser: ${unknown.join(", ")}.`),
          available_ids: session.getCatalog().map((persona) => persona.slug),
        };
      }
      const result = session.configureAndStart(
        board.filter((persona): persona is NonNullable<typeof persona> => !!persona),
        asString(input.briefing),
      );
      if (!result.ok) return result;
      const room = await createRoom(session);
      return {
        ok: true,
        meeting_id: room.id,
        meeting_url: roomShareUrl(room.id),
        phase: session.getState().phase,
        board: session.getState().board.map((persona) => ({ id: persona.slug, name: persona.name })),
        hint: "The meeting is live. Call inspect_board_meeting, then join_board_meeting if you want to take the guest seat. Share meeting_url to invite another participant.",
      };
    }),
  };

  const inspect: BoardTool = {
    name: "inspect_board_meeting",
    title: "Inspect the board meeting",
    description:
      "Read the live board meeting on this page: the decision briefing, the current phase, who is on the board, who has joined, whether a final readout exists, and a bounded window of the most recent transcript. Start here, and call it again after any other tool to see what changed and to read the board's replies. Use transcript_offset to page further back through the discussion. Every result carries a hint naming the tool to call next. This tool only reads; it changes nothing.",
    inputSchema: {
      type: "object",
      properties: {
        transcript_limit: {
          type: "integer",
          minimum: MIN_TRANSCRIPT_LIMIT,
          maximum: MAX_TRANSCRIPT_LIMIT,
          description: "How many recent transcript entries to return, 1 to 12. Defaults to 6.",
        },
        transcript_offset: {
          type: "integer",
          minimum: 0,
          description:
            "How many entries back from the end of the transcript to start. Use next_transcript_offset from a previous call to read older discussion.",
        },
        include_briefing: {
          type: "boolean",
          description: "Include the decision briefing text. Defaults to true; pass false once you have read it.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: guarded("inspect_board_meeting", async (input) => {
      const session = getSession();
      await syncRoomForTool(session);
      const state = session.getState();
      const snapshot = session.inspect();

      const limit = clamp(
        asInt(input.transcript_limit, DEFAULT_TRANSCRIPT_LIMIT),
        MIN_TRANSCRIPT_LIMIT,
        MAX_TRANSCRIPT_LIMIT,
      );
      const offset = Math.max(0, asInt(input.transcript_offset, 0));
      const includeBriefing = asBool(input.include_briefing, true);

      const lines = agentTranscript(state);
      const end = Math.max(0, lines.length - offset);
      const start = Math.max(0, end - limit);
      const slice = lines.slice(start, end);

      const build = (shape: InspectShape, take: number) => {
        const shown = take >= slice.length ? slice : slice.slice(slice.length - take);
        const olderAvailable = start > 0 || shown.length < slice.length;
        const payload: Record<string, unknown> = {
          ok: true,
          phase: snapshot.phase,
          board: snapshot.board.map((m) => ({
            id: m.id,
            name: m.name,
            ...(shape.roleCap > 0 ? { role: truncate(m.role, shape.roleCap) } : {}),
            status: m.status,
            turns: m.turns,
          })),
          guest: snapshot.guest,
          readout_ready: snapshot.readoutReady,
          transcript_total: lines.length,
          // The newest entries carry the answer the agent just asked for, so they
          // keep the full per-entry budget; older context is clipped harder.
          transcript: shown.map((line, i) => ({
            speaker: line.speaker,
            ...(line.to ? { to: line.to } : {}),
            text: truncate(
              line.text,
              i >= shown.length - 2 ? shape.textCap : Math.max(60, Math.round(shape.textCap * 0.55)),
            ),
          })),
          older_available: olderAvailable,
          hint: nextHint(state),
        };
        if (shape.participants === "full") {
          payload.participants = snapshot.participants;
        } else if (shape.participants === "compact") {
          payload.participants = snapshot.participants.map((p) => `${p.name} (${p.role})`);
        }
        if (includeBriefing && state.briefing.trim()) {
          payload.briefing = truncate(state.briefing, shape.briefingCap);
        }
        if (olderAvailable) {
          payload.next_transcript_offset = offset + shown.length;
        }
        return payload;
      };

      // Degrade in a fixed order until the result fits the output budget: shorter
      // transcript entries, then a shorter briefing, then a leaner roster, and only
      // then fewer transcript entries (which the agent can page back for).
      let take = slice.length;
      let payload: Record<string, unknown> = build(INSPECT_SHAPES[0], take);
      for (const shape of INSPECT_SHAPES) {
        payload = build(shape, take);
        if (jsonLength(payload) <= MAX_OUTPUT_CHARACTERS) return payload;
      }
      const leanest = INSPECT_SHAPES[INSPECT_SHAPES.length - 1];
      while (take > 0) {
        take -= 1;
        payload = build(leanest, take);
        if (jsonLength(payload) <= MAX_OUTPUT_CHARACTERS) return payload;
      }
      return payload;
    }),
  };

  const join: BoardTool = {
    name: "join_board_meeting",
    title: "Join the board meeting",
    description:
      "Take the single guest seat at the board meeting on this page, under the display name you know yourself by. Call this once, after inspect_board_meeting, while the meeting is in session; the human chair and every board member see you arrive immediately. Joining is required before you can contribute context, address a member, or request a synthesis. Follow it with contribute_to_board_meeting.",
    inputSchema: {
      type: "object",
      properties: {
        display_name: {
          type: "string",
          minLength: 1,
          maxLength: 40,
          description: "The name you want the board to see, chosen by you. Not a role description.",
        },
      },
      required: ["display_name"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: guarded("join_board_meeting", async (input) => {
      const session = getSession();
      await syncRoomForTool(session);
      const displayName = asString(input.display_name);
      const result = await runGuestAction(
        session,
        { type: "join", displayName },
        () => session.joinGuest(displayName),
      );
      if (!result.ok) return result;
      const state = session.getState();
      return {
        ok: true,
        name: result.name,
        seat: result.seat,
        phase: state.phase,
        hint:
          state.phase === "forming"
            ? "You are seated. The board is still forming opening positions; call inspect_board_meeting in about ten seconds, then contribute_to_board_meeting."
            : "You are seated and visible to everyone. Call contribute_to_board_meeting with context the board does not have yet.",
      };
    }),
  };

  const contribute: BoardTool = {
    name: "contribute_to_board_meeting",
    title: "Contribute context to the board",
    description:
      "Add context or a statement to the shared board meeting transcript, attributed to you. Use it after joining to give the board evidence it does not have yet: data, prior decisions, or constraints you already know from working with this person. The human chair and every board member see it, and it shapes the members' next turns. Follow it with address_board_member to put a question to one member.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          minLength: 1,
          maxLength: 1200,
          description: "The context or statement to put on the record, in your own words. Under 1,200 characters.",
        },
      },
      required: ["text"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: guarded("contribute_to_board_meeting", async (input) => {
      const session = getSession();
      await syncRoomForTool(session);
      const text = asString(input.text);
      const result = await runGuestAction(
        session,
        { type: "contribute", text },
        () => session.guestContribute(text),
      );
      if (!result.ok) return result;
      return {
        ok: true,
        entryId: result.entryId,
        hint: "The board will respond in the next turn. Call address_board_member to put one focused question to a specific member, or inspect_board_meeting in about ten seconds to read the reaction.",
      };
    }),
  };

  const address: BoardTool = {
    name: "address_board_member",
    title: "Address a board member",
    description:
      "Put one focused question or challenge to a named board member, who then takes the next speaking turn and answers you directly. Use it after contributing context, naming the member most likely to be moved by that evidence. A first name, a full name, or an id from inspect_board_meeting all resolve. Call inspect_board_meeting about ten seconds later to read the answer.",
    inputSchema: {
      type: "object",
      properties: {
        member: {
          type: "string",
          minLength: 1,
          description: "Which board member answers: their first name, full name, or id as shown by inspect_board_meeting.",
        },
        text: {
          type: "string",
          minLength: 1,
          maxLength: 800,
          description: "One focused question or challenge for that member. Under 800 characters.",
        },
      },
      required: ["member", "text"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: guarded("address_board_member", async (input) => {
      const session = getSession();
      await syncRoomForTool(session);
      const memberRef = asString(input.member);
      const text = asString(input.text);
      const result = await runGuestAction(
        session,
        { type: "address", member: memberRef, text },
        () => session.guestAddress(memberRef, text),
      );
      if (!result.ok) {
        if (result.error.code === "NOT_FOUND") {
          return {
            ...result,
            members: session.members().map((m) => ({ id: m.id, name: m.persona.name })),
          };
        }
        return result;
      }
      return {
        ok: true,
        memberId: result.memberId,
        memberName: result.memberName,
        hint: `${asString(result.memberName)} will answer next; call inspect_board_meeting in ~10s to read the answer.`,
      };
    }),
  };

  const synthesis: BoardTool = {
    name: "request_board_synthesis",
    title: "Request an interim synthesis",
    description:
      "Ask the meeting secretary for a concise interim synthesis of the discussion so far: where the board agrees, where it disagrees, and the most important unresolved question. Use it once the discussion has covered your question and before the human chair closes the meeting. The synthesis appears in the shared transcript for everyone. Pass wait_seconds to receive the finished text in the result; otherwise call inspect_board_meeting shortly afterwards to read it. This does not end the meeting.",
    inputSchema: {
      type: "object",
      properties: {
        wait_seconds: {
          type: "integer",
          minimum: 0,
          maximum: 20,
          description: "Optionally wait up to this many seconds for the synthesis to finish and return its text. Defaults to 0.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute: guarded("request_board_synthesis", async (input, options) => {
      const session = getSession();
      await syncRoomForTool(session);
      const result = await runGuestAction(
        session,
        { type: "synthesis" },
        () => session.requestSynthesis("guest"),
      );
      if (!result.ok) return result;
      const hint =
        "Synthesis will appear in the transcript within ~10s; inspect to read it (it is the entry with speaker 'Secretary').";
      const wait = clamp(asInt(input.wait_seconds, 0), 0, 20);
      const entryId = asString(result.entryId);
      if (wait <= 0) return { ok: true, entryId, hint };

      const waited = await waitForSynthesis(session, entryId, wait, options?.signal);
      if (!waited.finished) {
        return {
          ok: true,
          entryId,
          pending: true,
          ...(waited.text ? { partial: truncate(waited.text, 600) } : {}),
          hint,
        };
      }
      return {
        ok: true,
        entryId,
        ...(waited.failed ? { degraded: true } : {}),
        synthesis: truncate(waited.text, 1100),
        hint: "The synthesis is now in the shared transcript, visible to the chair and the board. Keep inspecting, and retrieve the readout after the chair ends the meeting.",
      };
    }),
  };

  const readout: BoardTool = {
    name: "get_board_meeting_readout",
    title: "Get the final board readout",
    description:
      "Read the final executive readout of this board meeting: the decision, the recommendation with any dissent preserved, options, tradeoffs, assumptions, open questions, next actions, and each member's closing comment. It exists only after the human chair ends the meeting, so call it then; before that it reports clearly that it is not ready yet. The first call returns every section, compacted if the memo is long; call again with section=<name> for that section's full text.",
    inputSchema: {
      type: "object",
      properties: {
        section: {
          type: "string",
          enum: ["all", ...READOUT_SECTIONS],
          description: "Which section to return. Defaults to 'all'; ask for one section when the full readout is truncated.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: guarded("get_board_meeting_readout", async (input) => {
      const session = getSession();
      await syncRoomForTool(session);
      const result = session.getReadout();
      if (!result.ok) return result;

      // One "readout retrieved" system event per meeting (spec §11.6).
      const state = session.getState();
      if (
        readoutMarkedFor !== result.readout.generatedAt &&
        state.readoutRetrievedByGuestAt === null
      ) {
        readoutMarkedFor = result.readout.generatedAt;
        if (session.getRoomId()) {
          await performRoomGuestAction(session, { type: "readout-retrieved" });
        } else {
          session.markReadoutRetrievedByGuest();
        }
      }

      const requested = asString(input.section).trim().toLowerCase() || "all";
      if (requested !== "all") {
        if (!(READOUT_SECTIONS as readonly string[]).includes(requested)) {
          return toolError(
            "INVALID_INPUT",
            `Unknown section "${requested}". Use one of: all, ${READOUT_SECTIONS.join(", ")}.`,
          );
        }
        return {
          ok: true,
          section: requested,
          divided: result.readout.recommendation.divided,
          text: readoutSectionToText(result.readout, requested as ReadoutSection),
        };
      }

      // Serve the exact document the human copies whenever it fits in one result.
      const readout = result.readout;
      const full = {
        ok: true,
        divided: readout.recommendation.divided,
        text: readoutToText(readout),
      };
      if (jsonLength(full) <= MAX_OUTPUT_CHARACTERS) return full;

      // Otherwise every section is still present, just compact. Sections are never
      // dropped; only item text is clipped, down to one item per list.
      const buildCompact = (shape: ReadoutCompactShape) => {
        const payload: Record<string, unknown> = {
          ok: true,
          compact: true,
          decision: truncate(readout.decision, shape.decisionCap),
          recommendation: {
            summary: truncate(readout.recommendation.summary, shape.summaryCap),
            divided: readout.recommendation.divided,
            detail: truncate(readout.recommendation.detail, shape.detailCap),
          },
        };
        for (const section of READOUT_LIST_SECTIONS) {
          const all = readoutSectionItems(readout, section);
          const max = section === "closing_comments" ? shape.closingItems : shape.items;
          payload[section] = {
            total: all.length,
            items: all.slice(0, max).map((item) => truncate(item, shape.itemCap)),
          };
        }
        payload.hint = "Call again with section=<name> for the full text";
        return payload;
      };

      let compact = buildCompact(READOUT_COMPACT_SHAPES[0]);
      for (const shape of READOUT_COMPACT_SHAPES) {
        compact = buildCompact(shape);
        if (jsonLength(compact) <= MAX_OUTPUT_CHARACTERS) return compact;
      }
      return compact;
    }),
  };

  return {
    list_board_advisers: listAdvisers,
    launch_board_meeting: launch,
    inspect_board_meeting: inspect,
    join_board_meeting: join,
    contribute_to_board_meeting: contribute,
    address_board_member: address,
    request_board_synthesis: synthesis,
    get_board_meeting_readout: readout,
  };
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Only one mounted <WebMCPTools/> may own the tool names at a time. The root
 * layout mounts one globally; the dev harness at /dev/webmcp mounts another over a
 * fixture session. React runs child effects before parent effects, so on that route
 * the harness instance wins and the layout instance stands down — everywhere else
 * the layout instance is the only one.
 */
let registrationOwner: object | null = null;

function isNameTakenError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "InvalidStateError";
}

export function WebMCPTools() {
  const session = useSession();
  // The execute handlers read the ref so they always see the current session
  // without re-running (and therefore re-registering) the effect below.
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    // Prefer the current spec surface (Document); fall back to the pre-webmcp#184
    // Navigator surface. Feature-detect the method, never the object.
    const mc = document.modelContext ?? navigator.modelContext;
    const supported = typeof mc?.registerTool === "function";

    document.documentElement.dataset.webmcp = supported ? "supported" : "unsupported";
    if (!supported || !mc) {
      window.__boardMeetingWebMCP = { supported: false, tools: [] };
      return;
    }

    // Only the instance that actually owns the eight names publishes the debug flag,
    // so a second instance can never clobber the owner's tool list.
    if (registrationOwner) return;
    const owner = {};
    registrationOwner = owner;
    window.__boardMeetingWebMCP = { supported: true, tools: [] };

    const controller = new AbortController();
    const options = { signal: controller.signal };
    const tools = createBoardTools(() => sessionRef.current);
    const order: BoardTool[] = [
      tools.list_board_advisers,
      tools.launch_board_meeting,
      tools.inspect_board_meeting,
      tools.join_board_meeting,
      tools.contribute_to_board_meeting,
      tools.address_board_member,
      tools.request_board_synthesis,
      tools.get_board_meeting_readout,
    ];

    const publish = (registered: string[]) => {
      window.__boardMeetingWebMCP = { supported: true, tools: registered };
    };

    void Promise.allSettled([
      mc.registerTool({ ...tools.list_board_advisers }, options),
      mc.registerTool({ ...tools.launch_board_meeting }, options),
      mc.registerTool({ ...tools.inspect_board_meeting }, options),
      mc.registerTool({ ...tools.join_board_meeting }, options),
      mc.registerTool({ ...tools.contribute_to_board_meeting }, options),
      mc.registerTool({ ...tools.address_board_member }, options),
      mc.registerTool({ ...tools.request_board_synthesis }, options),
      mc.registerTool({ ...tools.get_board_meeting_readout }, options),
    ])
      .then((results) => {
        if (controller.signal.aborted) return;
        const registered = order
          .filter((_, i) => results[i].status === "fulfilled")
          .map((t) => t.name);
        publish(registered);

        const rejected = order
          .map((tool, i) => ({ tool, result: results[i] }))
          .filter((r) => r.result.status === "rejected")
          .map((r) => ({ tool: r.tool, reason: (r.result as PromiseRejectedResult).reason }));
        const retryable = rejected.filter((r) => isNameTakenError(r.reason)).map((r) => r.tool);
        const fatal = rejected.filter((r) => !isNameTakenError(r.reason));
        if (fatal.length) {
          console.warn(
            "WebMCP: some site tools did not register",
            fatal.map((f) => `${f.tool.name}: ${errorText(f.reason)}`),
          );
        }
        if (!retryable.length) return;
        // A name can still be held for a tick by a previous mount (React StrictMode
        // double-invoke, Fast Refresh). One delayed retry clears that up in dev.
        setTimeout(() => {
          if (controller.signal.aborted) return;
          void Promise.allSettled(
            retryable.map((tool) => mc.registerTool({ ...tool }, options)),
          ).then((retryResults) => {
            if (controller.signal.aborted) return;
            publish([
              ...registered,
              ...retryable.filter((_, i) => retryResults[i].status === "fulfilled").map((t) => t.name),
            ]);
          });
        }, 150);
      })
      .catch(() => {
        /* allSettled does not reject; nothing to do. */
      });

    return () => {
      controller.abort();
      if (registrationOwner === owner) registrationOwner = null;
    };
  }, []);

  return null;
}

/** Stable tool order, re-exported for the dev harness and tests. */
export const BOARD_TOOL_ORDER = WEBMCP_TOOL_NAMES;
