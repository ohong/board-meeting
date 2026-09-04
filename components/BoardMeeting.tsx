"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AGENT_INVITATION } from "@/lib/example";
import type { MeetingSession, MeetingState, MemberSeat } from "@/lib/session";
import type { TranscriptEvent } from "@/lib/types";
import { Portrait } from "./Portrait";
import styles from "./BoardMeeting.module.css";

type SeatPosition = {
  left: string;
  top: string;
  align: "left" | "center" | "right";
};

// These are composed room layouts, not points sampled from a circle. Each board
// size keeps the chair's sight line to the folio clear and reserves the threshold.
const SEAT_LAYOUTS: Record<number, SeatPosition[]> = {
  3: [
    { left: "50%", top: "5%", align: "center" },
    { left: "8%", top: "39%", align: "left" },
    { left: "92%", top: "39%", align: "right" },
  ],
  4: [
    { left: "35%", top: "5%", align: "center" },
    { left: "65%", top: "5%", align: "center" },
    { left: "8%", top: "42%", align: "left" },
    { left: "92%", top: "42%", align: "right" },
  ],
  5: [
    { left: "27%", top: "7%", align: "center" },
    { left: "50%", top: "3%", align: "center" },
    { left: "73%", top: "7%", align: "center" },
    { left: "8%", top: "45%", align: "left" },
    { left: "92%", top: "45%", align: "right" },
  ],
  6: [
    { left: "34%", top: "3%", align: "center" },
    { left: "66%", top: "3%", align: "center" },
    { left: "8%", top: "34%", align: "left" },
    { left: "92%", top: "34%", align: "right" },
    { left: "13%", top: "69%", align: "left" },
    { left: "87%", top: "69%", align: "right" },
  ],
};

const MEMBER_STATUS: Record<MemberSeat["status"], string> = {
  idle: "Listening",
  thinking: "Considering privately",
  ready: "Ready",
  speaking: "Speaking",
  wants_to_respond: "Wants in",
  reconnecting: "Reconnecting…",
  reacting: "Reacting",
};

const REACTION_LABELS = {
  agree: "Agrees",
  concern: "Raises a concern",
  disagree: "Pushes back",
  want_to_respond: "Wants in",
} as const;

function briefingCopy(briefing: string): { question: string; context: string } {
  const trimmed = briefing.trim();
  if (!trimmed) return { question: "Awaiting the chair's brief", context: "" };
  const question = trimmed.match(/Question:\s*([^\n]+)/i)?.[1]?.trim();
  const context = trimmed.match(/Briefing:\s*([\s\S]+)/i)?.[1]?.trim() ?? "";
  const fallback = trimmed.split("\n").find((line) => line.trim())?.trim() ?? trimmed;
  return { question: question ?? fallback, context };
}

function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function guestStatus(status: MeetingState["guest"]["status"], hasGuest: boolean): string {
  if (!hasGuest && status === "waiting") return "Guest seat available";
  switch (status) {
    case "waiting":
      return "Waiting at the threshold";
    case "joining":
      return "Joining the room";
    case "joined":
      return "Present";
    case "contributing":
      return "Sharing context";
    case "asking":
      return "Asking the board";
    default:
      return "Guest seat available";
  }
}

function isChairEvent(event: TranscriptEvent): boolean {
  return event.speakerId === "chair" || event.speakerName.toLowerCase() === "you";
}

function isGuestEvent(event: TranscriptEvent): boolean {
  return event.speakerId === "guest";
}

function mentionAt(value: string, cursor: number) {
  const beforeCursor = value.slice(0, cursor);
  const match = beforeCursor.match(/(?:^|\s)@([^@\n]*)$/);
  if (!match || match.index === undefined) return null;
  const atOffset = match[0].lastIndexOf("@");
  const start = match.index + atOffset;
  return { start, end: cursor, query: match[1].trimStart().toLowerCase() };
}

function ParticipantPortrait({ member }: { member: MemberSeat }) {
  return (
    <span className={styles.portraitFrame} aria-hidden="true">
      <Portrait
        slug={member.slug}
        name={member.name}
        initials={member.initials}
        size="roster"
      />
    </span>
  );
}

function Monogram({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span className={`${styles.monogram} ${accent ? styles.monogramGuest : ""}`} aria-hidden="true">
      {initials(label) || "○"}
    </span>
  );
}

function MinutesEntry({
  event,
  member,
  isCurrent,
}: {
  event: TranscriptEvent;
  member?: MemberSeat;
  isCurrent: boolean;
}) {
  if (event.kind === "system") {
    return (
      <div className={styles.systemEvent} data-current={isCurrent || undefined}>
        <span aria-hidden="true" className={styles.systemMark} />
        <p>{event.text}</p>
        <time dateTime={new Date(event.createdAt).toISOString()}>{formatClock(event.createdAt)}</time>
      </div>
    );
  }

  if (event.kind === "reaction") {
    return (
      <div className={styles.reactionEvent} data-current={isCurrent || undefined}>
        <span>{event.speakerName}</span>
        <strong>{event.reaction ? REACTION_LABELS[event.reaction] : event.text}</strong>
        <time dateTime={new Date(event.createdAt).toISOString()}>{formatClock(event.createdAt)}</time>
      </div>
    );
  }

  const chair = isChairEvent(event);
  const guest = isGuestEvent(event);
  const entryClass = chair
    ? styles.entryChair
    : guest
      ? styles.entryGuest
      : styles.entryMember;

  return (
    <article className={`${styles.minuteEntry} ${entryClass}`} data-current={isCurrent || undefined}>
      <header className={styles.entryHeader}>
        {member ? (
          <span className={styles.minutePortrait} aria-hidden="true">
            <Portrait
              slug={member.slug}
              name={member.name}
              initials={member.initials}
              size="roster"
            />
          </span>
        ) : (
          <Monogram label={chair ? "You" : event.speakerName} accent={guest} />
        )}
        <span className={styles.entryIdentity}>
          <strong>{chair ? "You" : event.speakerName}</strong>
          <small>{chair ? "Chair" : guest ? "Guest agent" : member?.role.split(",")[0]}</small>
        </span>
        <time dateTime={new Date(event.createdAt).toISOString()}>{formatClock(event.createdAt)}</time>
      </header>
      {event.addressedTo ? <p className={styles.recipient}>To {event.addressedTo}</p> : null}
      <p className={styles.entryText}>{event.text}</p>
    </article>
  );
}

export function BoardMeeting({
  session,
  state,
}: {
  session: MeetingSession;
  state: MeetingState;
}) {
  const [draft, setDraft] = useState("");
  const [cursor, setCursor] = useState(0);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionsDismissed, setMentionsDismissed] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [sendPending, setSendPending] = useState(false);
  const [endPending, setEndPending] = useState(false);
  const [nearLatest, setNearLatest] = useState(true);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const nearLatestRef = useRef(true);
  const brief = useMemo(() => briefingCopy(state.briefing), [state.briefing]);
  const positions = SEAT_LAYOUTS[state.members.length] ?? SEAT_LAYOUTS[3];

  const chronologicalTranscript = useMemo(
    () => [...state.transcript].sort((a, b) => a.createdAt - b.createdAt),
    [state.transcript],
  );
  const latestEventId = chronologicalTranscript.at(-1)?.id;
  const streamingEvent = state.inProgressPublicMessage;
  const memberById = useMemo(
    () => new Map(state.members.map((member) => [member.slug, member])),
    [state.members],
  );
  const latestReaction = useMemo(() => {
    const reactions = new Map<string, string>();
    for (const event of chronologicalTranscript.slice(-4)) {
      if (event.kind === "reaction" && event.reaction) {
        reactions.set(event.speakerId, REACTION_LABELS[event.reaction]);
      }
    }
    return reactions;
  }, [chronologicalTranscript]);

  const phaseLabel =
    state.meetingPhase === "opening"
      ? "Opening positions"
      : state.meetingPhase === "ending"
        ? "Closing the meeting"
        : "Board discussion";
  const activeSpeaker = state.members.find((member) => member.status === "speaking");
  const publicTurnBusy = Boolean(activeSpeaker) || ["contributing", "asking"].includes(state.guest.status);
  const meetingClosing = state.meetingPhase === "ending" || endPending;
  const composerDisabled = meetingClosing || sendPending;
  const mention = mentionAt(draft, cursor);
  const mentionOptions = useMemo(() => {
    if (!mention || mentionsDismissed) return [];
    return state.members.filter((member) =>
      member.name.toLowerCase().includes(mention.query),
    );
  }, [mention, mentionsDismissed, state.members]);
  const mentionsOpen = Boolean(mention && mentionOptions.length);

  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    if (nearLatestRef.current) {
      requestAnimationFrame(() => {
        log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
      });
    }
  }, [chronologicalTranscript.length, latestEventId, streamingEvent?.text]);

  function insertMention(name: string) {
    const input = composerRef.current;
    const insertion = `@${name} `;
    const range = mention ?? { start: cursor, end: cursor };
    const before = draft.slice(0, range.start);
    const needsSpace = before.length > 0 && !/\s$/.test(before);
    const next = `${before}${needsSpace ? " " : ""}${insertion}${draft.slice(range.end)}`;
    const nextCursor = before.length + (needsSpace ? 1 : 0) + insertion.length;
    setDraft(next);
    setCursor(nextCursor);
    setMentionIndex(0);
    setMentionsDismissed(false);
    session.setComposing(true);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || composerDisabled) return;
    setSendPending(true);
    setMentionsDismissed(true);
    try {
      const result = await session.sendUserMessage(message);
      if (result.ok) {
        setDraft("");
        setCursor(0);
        session.setComposing(false);
      }
    } finally {
      setSendPending(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionsOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        setMentionIndex((current) =>
          (current + direction + mentionOptions.length) % mentionOptions.length,
        );
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const selected = mentionOptions[mentionIndex] ?? mentionOptions[0];
        if (selected) insertMention(selected.name);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMentionsDismissed(true);
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  async function copyInvitation() {
    try {
      await navigator.clipboard.writeText(AGENT_INVITATION);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  async function endMeeting() {
    if (endPending) return;
    setEndPending(true);
    try {
      await session.endMeeting();
    } finally {
      setEndPending(false);
    }
  }

  function handleLogScroll() {
    const log = logRef.current;
    if (!log) return;
    const isNear = log.scrollHeight - log.scrollTop - log.clientHeight < 72;
    nearLatestRef.current = isNear;
    setNearLatest(isNear);
  }

  function jumpToLatest() {
    const log = logRef.current;
    if (!log) return;
    nearLatestRef.current = true;
    setNearLatest(true);
    log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }

  return (
    <main className={styles.meetingShell}>
      <a className={styles.skipLink} href="#meeting-minutes">
        Skip to minutes
      </a>

      <header className={styles.roomHeader}>
        <div className={styles.productIdentity}>
          <span className={styles.productMark} aria-hidden="true">BM</span>
          <h1>Board Meeting</h1>
        </div>
        <p className={styles.headerDecision} title={brief.question}>{brief.question}</p>
        <div className={styles.headerActions}>
          <span className={styles.phaseStatus}>
            <i aria-hidden="true" /> {phaseLabel}
          </span>
          <button
            type="button"
            className={styles.inviteButton}
            aria-expanded={inviteOpen}
            aria-controls="guest-pass"
            disabled={meetingClosing}
            onClick={() => {
              setInviteOpen((open) => !open);
              setCopyState("idle");
            }}
          >
            Invite your agent
          </button>
          <button
            type="button"
            className={styles.endButton}
            disabled={meetingClosing}
            onClick={() => void endMeeting()}
          >
            {meetingClosing ? "Ending meeting…" : "End meeting"}
          </button>
        </div>
      </header>

      <div className={styles.roomAndMinutes}>
        <section className={styles.room} aria-labelledby="room-heading">
          <h2 id="room-heading" className={styles.visuallyHidden}>Boardroom</h2>
          <div className={styles.roomLight} aria-hidden="true" />
          <div className={styles.table} aria-hidden="true">
            <span className={styles.tableInlay} />
          </div>

          <button
            type="button"
            className={`${styles.agendaFolio} ${agendaOpen ? styles.agendaOpen : ""}`}
            aria-expanded={agendaOpen}
            onClick={() => setAgendaOpen((open) => !open)}
          >
            <span className={styles.folioHeader}>
              <span>{phaseLabel}</span>
              <span>{agendaOpen ? "Close brief" : "Open brief"}</span>
            </span>
            <strong>{brief.question}</strong>
            {agendaOpen && brief.context ? <span className={styles.folioContext}>{brief.context}</span> : null}
          </button>

          <ol className={styles.seatList} data-count={state.members.length} aria-label="Board members">
            {state.members.map((member, index) => {
              const position = positions[index] ?? positions[0];
              const reaction = latestReaction.get(member.slug);
              return (
                <li
                  key={member.slug}
                  className={styles.seatPosition}
                  data-align={position.align}
                  style={{ left: position.left, top: position.top }}
                >
                  <button
                    type="button"
                    className={styles.memberSeat}
                    data-status={member.status}
                    aria-label={`${member.name}, ${MEMBER_STATUS[member.status]}. Insert mention`}
                    onClick={() => insertMention(member.name)}
                  >
                    <ParticipantPortrait member={member} />
                    <span className={styles.nameplate}>
                      <strong>{member.name}</strong>
                      <small>{MEMBER_STATUS[member.status]}</small>
                      {reaction ? <em>{reaction}</em> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className={styles.chairSeat} aria-label="You, chair">
            <Monogram label="You" />
            <span className={styles.chairNameplate}>
              <strong>You</strong>
              <small>Chair · The floor is yours</small>
            </span>
          </div>

          <div
            className={styles.guestSeat}
            data-status={state.guest.status}
            data-occupied={Boolean(state.guest.name) || undefined}
            aria-label={`${state.guest.name ?? "Guest agent"}, ${guestStatus(state.guest.status, Boolean(state.guest.name))}`}
          >
            <Monogram label={state.guest.name ?? "Guest"} accent={Boolean(state.guest.name)} />
            <span className={styles.guestNameplate}>
              <strong>{state.guest.name ?? "Guest agent"}</strong>
              <small>{guestStatus(state.guest.status, Boolean(state.guest.name))}</small>
              {state.guest.name ? <em>WebMCP</em> : null}
            </span>
          </div>

          <div className={styles.roomLegend} aria-hidden="true">
            <span>{state.members.length} advisers seated</span>
            <span>{activeSpeaker ? `${activeSpeaker.name} has the floor` : "The table is listening"}</span>
          </div>

          {inviteOpen ? (
            <aside id="guest-pass" className={styles.guestPass} aria-labelledby="guest-pass-title">
              <div className={styles.guestPassHeader}>
                <div>
                  <span>Guest pass · WebMCP</span>
                  <h2 id="guest-pass-title">Invite your agent</h2>
                </div>
                <button
                  type="button"
                  aria-label="Close invitation"
                  onClick={() => setInviteOpen(false)}
                >
                  Close
                </button>
              </div>
              <p>Give this invitation to a compatible personal agent while this meeting remains open.</p>
              <label htmlFor="agent-invitation">Invitation</label>
              <textarea id="agent-invitation" readOnly value={AGENT_INVITATION} />
              <div className={styles.guestPassActions}>
                <button type="button" onClick={() => void copyInvitation()}>
                  {copyState === "copied" ? "Invitation copied" : "Copy invitation"}
                </button>
                <span role={copyState === "error" ? "alert" : "status"}>
                  {copyState === "copied"
                    ? "Waiting for your agent…"
                    : copyState === "error"
                      ? "Copy failed. Select the invitation text and copy it manually."
                      : "The guest seat will activate when they join."}
                </span>
              </div>
            </aside>
          ) : null}
        </section>

        <aside className={styles.minutes} id="meeting-minutes" aria-labelledby="minutes-heading">
          <header className={styles.minutesHeader}>
            <div>
              <span>Live record</span>
              <h2 id="minutes-heading">Minutes</h2>
            </div>
            <p>{phaseLabel}</p>
          </header>

          <div
            ref={logRef}
            className={styles.minutesLog}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-atomic="false"
            aria-busy={publicTurnBusy}
            onScroll={handleLogScroll}
          >
            {chronologicalTranscript.length || streamingEvent ? (
              <>
                {chronologicalTranscript.map((event) => (
                  <MinutesEntry
                    key={event.id}
                    event={event}
                    member={memberById.get(event.speakerId)}
                    isCurrent={!streamingEvent && event.id === latestEventId}
                  />
                ))}
                {streamingEvent ? (
                  <MinutesEntry
                    key={streamingEvent.id}
                    event={streamingEvent}
                    member={memberById.get(streamingEvent.speakerId)}
                    isCurrent
                  />
                ) : null}
              </>
            ) : (
              <div className={styles.emptyMinutes}>
                <strong>The record begins when the room speaks.</strong>
                <p>Independent positions stay private until each adviser is ready.</p>
              </div>
            )}
          </div>

          {!nearLatest ? (
            <button type="button" className={styles.jumpButton} onClick={jumpToLatest}>
              Jump to latest
            </button>
          ) : null}

          <form className={styles.composer} onSubmit={submitMessage}>
            <label htmlFor="chair-message">Chair the discussion</label>
            <div className={styles.composerField}>
              {mentionsOpen ? (
                <div
                  id="board-mention-list"
                  className={styles.mentionList}
                  role="listbox"
                  aria-label="Board member suggestions"
                >
                  {mentionOptions.map((member, index) => (
                    <button
                      type="button"
                      id={`mention-${member.slug}`}
                      key={member.slug}
                      role="option"
                      aria-selected={index === mentionIndex}
                      data-active={index === mentionIndex || undefined}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => insertMention(member.name)}
                    >
                      <Portrait
                        slug={member.slug}
                        name={member.name}
                        initials={member.initials}
                        size="roster"
                      />
                      <span>
                        <strong>{member.name}</strong>
                        <small>{member.role.split(",")[0]}</small>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              <textarea
                ref={composerRef}
                id="chair-message"
                value={draft}
                rows={2}
                disabled={composerDisabled}
                placeholder="Add context or call on someone with @"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={mentionsOpen}
                aria-controls={mentionsOpen ? "board-mention-list" : undefined}
                aria-activedescendant={
                  mentionsOpen ? `mention-${mentionOptions[mentionIndex]?.slug}` : undefined
                }
                onChange={(event) => {
                  setDraft(event.target.value);
                  setCursor(event.target.selectionStart);
                  setMentionIndex(0);
                  setMentionsDismissed(false);
                  session.setComposing(Boolean(event.target.value.trim()));
                }}
                onClick={(event) => setCursor(event.currentTarget.selectionStart)}
                onSelect={(event) => setCursor(event.currentTarget.selectionStart)}
                onKeyDown={handleComposerKeyDown}
                onFocus={() => session.setComposing(Boolean(draft.trim()))}
                onBlur={() => session.setComposing(false)}
              />
              <button type="submit" disabled={!draft.trim() || composerDisabled}>
                {sendPending ? "Sending…" : "Send"}
              </button>
            </div>
            <p className={styles.composerHelp}>
              {meetingClosing
                ? "Closing comments are being collected."
                : publicTurnBusy
                  ? `${activeSpeaker?.name ?? state.guest.name ?? "A guest"} has the floor. Your note will follow this turn.`
                  : "Enter sends. Shift + Enter adds a line."}
            </p>
          </form>
        </aside>
      </div>
    </main>
  );
}
