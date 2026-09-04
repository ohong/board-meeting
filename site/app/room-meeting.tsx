'use client';

/* oxlint-disable next/no-img-element -- Bundled archival portraits use a fixed crop in the Sites runtime. */

import { useEffect, useRef } from 'react';
import { Cable, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { findMember, type BoardMember } from '@/lib/board-data';

type TranscriptMessage = {
  id: string;
  kind: 'board' | 'human' | 'guest' | 'secretary' | 'system';
  speaker: string;
  text: string;
  memberId?: string;
};

const ROOM_SEAT_LAYOUTS: Record<number, Array<{ x: number; y: number }>> = {
  3: [
    { x: 50, y: 8 },
    { x: 14, y: 43 },
    { x: 86, y: 43 },
  ],
  4: [
    { x: 30, y: 9 },
    { x: 70, y: 9 },
    { x: 13, y: 49 },
    { x: 87, y: 49 },
  ],
  5: [
    { x: 50, y: 7 },
    { x: 19, y: 25 },
    { x: 81, y: 25 },
    { x: 16, y: 66 },
    { x: 84, y: 66 },
  ],
  6: [
    { x: 31, y: 8 },
    { x: 69, y: 8 },
    { x: 13, y: 39 },
    { x: 87, y: 39 },
    { x: 17, y: 69 },
    { x: 83, y: 69 },
  ],
};

export function RoomMeetingScreen({
  question,
  selectedMembers,
  transcript,
  guest,
  pendingSpeaker,
  guestThresholdVisible,
  draft,
  actionStatus,
  onDraft,
  onSend,
  onInvite,
  onEnd,
}: {
  question: string;
  selectedMembers: BoardMember[];
  transcript: TranscriptMessage[];
  guest: string | null;
  pendingSpeaker: string | null;
  guestThresholdVisible: boolean;
  draft: string;
  actionStatus: string;
  onDraft: (value: string) => void;
  onSend: () => void;
  onInvite: () => void;
  onEnd: () => void;
}) {
  const positions =
    ROOM_SEAT_LAYOUTS[selectedMembers.length] ?? ROOM_SEAT_LAYOUTS[3];
  const latest = transcript.at(-1);
  const latestBoardMessage = [...transcript]
    .reverse()
    .find((message) => message.kind === 'board');
  const allOpeningsReady = selectedMembers.every((member) =>
    transcript.some((message) => message.memberId === member.id),
  );
  const transcriptScrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const scroller = transcriptScrollerRef.current;
      scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingSpeaker, transcript.length]);

  function seatStatus(member: BoardMember, index: number) {
    const hasPosition = transcript.some(
      (message) => message.memberId === member.id,
    );
    if (pendingSpeaker === member.name) return 'Considering privately';
    if (latestBoardMessage?.memberId === member.id) return 'Speaking';
    if (latest?.kind === 'secretary' && index === 0) return 'Reconsidering';
    if (latest?.kind === 'human' && index === 1) return 'Wants in';
    if (hasPosition && !allOpeningsReady) return 'Ready';
    return hasPosition ? 'Listening' : 'Considering privately';
  }

  return (
    <section className="room-experience flex min-h-screen min-w-0 flex-col bg-[#10110f] text-[#f2eee6] lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <header className="room-header flex min-h-16 items-center gap-4 border-b border-white/10 px-5 py-3 lg:px-7">
        <div className="flex shrink-0 items-center gap-3">
          <span className="grid size-8 place-items-center border border-[#a88952]/55 font-serif text-sm">
            B
          </span>
          <div>
            <p className="text-sm font-semibold">Board Meeting</p>
            <p className="font-mono text-[0.64rem] text-white/42">
              {selectedMembers.length + 1 + (guest ? 1 : 0)} seated · discussion
              live
            </p>
          </div>
        </div>
        <p className="mx-auto hidden max-w-xl truncate text-sm text-white/58 md:block">
          {question}
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={onInvite}
            className="h-10 rounded-lg border-white/18 bg-transparent px-3 text-[#f2eee6] hover:bg-white/8 hover:text-white"
          >
            <Cable className="size-4 text-[#7c9cff]" /> Invite your agent
          </Button>
          <Button
            variant="ghost"
            onClick={onEnd}
            className="h-10 rounded-lg px-3 text-white/65 hover:bg-[#a54b34]/16 hover:text-[#ef8f7e]"
          >
            End meeting
          </Button>
        </div>
      </header>

      <div className="meeting-grid grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(400px,34vw)]">
        <section className="room-field relative min-h-[680px] overflow-hidden border-b border-white/10 lg:min-h-0 lg:border-r lg:border-b-0">
          <div className="room-light absolute inset-0" />
          <div className="room-stage relative mx-auto h-full min-h-[680px] w-full max-w-[1040px] lg:min-h-0">
            <div className="board-table" aria-hidden="true">
              <div className="board-table-inlay" />
            </div>

            <article className="agenda-folio absolute top-[39%] left-1/2 z-10 w-[min(40%,360px)] -translate-x-1/2 -translate-y-1/2 border border-[#d7d0c4] bg-[#f2eee6] p-4 text-[#171714] shadow-[0_16px_36px_rgb(0_0_0/35%)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#d7d0c4] pb-2 font-mono text-[0.62rem] text-[#68645c]">
                <span>Decision under review</span>
                <span>Discussion</span>
              </div>
              <h1 className="mt-3 line-clamp-4 font-serif text-[clamp(1.15rem,2.2vw,2rem)] leading-[1.03] tracking-[-0.03em]">
                {question}
              </h1>
              <p className="mt-4 border-t border-[#d7d0c4] pt-2 text-xs text-[#68645c]">
                The question stays at the center while the room works around it.
              </p>
            </article>

            {selectedMembers.map((member, index) => (
              <ParticipantSeat
                key={member.id}
                member={member}
                status={seatStatus(member, index)}
                position={positions[index] ?? positions[0]}
                onCall={() =>
                  onDraft(
                    `${draft}${draft && !draft.endsWith(' ') ? ' ' : ''}@${member.shortName} `,
                  )
                }
              />
            ))}

            <HumanSeat />
            {guest || guestThresholdVisible ? (
              <GuestSeat
                name={guest}
                status={
                  guest
                    ? latest?.kind === 'guest'
                      ? 'Sharing context'
                      : latest?.kind === 'secretary'
                        ? 'Waiting for readout'
                        : 'Joined via WebMCP'
                    : 'Waiting for your agent'
                }
              />
            ) : null}
          </div>

          <div className="room-guidance pointer-events-none absolute bottom-4 left-5 z-30 max-w-sm lg:left-7">
            <p className="font-mono text-[0.64rem] text-[#aaa79f]">
              Click a seat to call on someone
            </p>
            <p className="mt-1 text-sm text-[#f2eee6]/72">
              You chair the room. Only you can end the meeting.
            </p>
          </div>
        </section>

        <aside className="minutes-sheet flex min-h-[620px] min-w-0 flex-col bg-[#fbf9f5] text-[#171714] lg:min-h-0">
          <div className="flex items-center justify-between border-b border-[#d7d0c4] px-5 py-4">
            <div>
              <h2 className="font-serif text-2xl tracking-[-0.025em]">
                Minutes
              </h2>
              <p className="font-mono text-[0.62rem] text-[#68645c]">
                Shared record · {transcript.length} entries
              </p>
            </div>
            <span className="flex items-center gap-2 text-xs font-medium text-[#68645c]">
              <span className="size-1.5 rounded-full bg-[#b84432]" /> Live
            </span>
          </div>

          <div
            ref={transcriptScrollerRef}
            className="min-h-0 flex-1 overflow-y-auto px-5"
            aria-live="polite"
          >
            {transcript.map((message) => (
              <TranscriptRow key={message.id} message={message} />
            ))}
            {pendingSpeaker ? (
              <div className="border-b border-[#d7d0c4] py-4 font-mono text-[0.68rem] text-[#68645c]">
                {pendingSpeaker} · considering privately
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#d7d0c4] p-4">
            <label htmlFor="meeting-composer" className="sr-only">
              Add context or call on someone
            </label>
            <div className="flex items-end border border-[#b9b1a5] bg-white">
              <Textarea
                id="meeting-composer"
                value={draft}
                onChange={(event) => onDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Add context or call on someone with @"
                className="min-h-14 resize-none border-0 bg-transparent px-3 py-3 text-[0.95rem] shadow-none focus-visible:ring-0"
              />
              <Button
                size="icon"
                aria-label="Send message"
                disabled={!draft.trim() || Boolean(pendingSpeaker)}
                onClick={onSend}
                className="m-2 size-10 shrink-0 rounded-full bg-[#171714] text-white hover:bg-[#3b3630]"
              >
                <Send className="size-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[0.62rem] text-[#68645c]">
              <span>Enter to send · Shift + Enter for a new line</span>
              <output className="text-right">{actionStatus}</output>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ParticipantSeat({
  member,
  status,
  position,
  onCall,
}: {
  member: BoardMember;
  status: string;
  position: { x: number; y: number };
  onCall: () => void;
}) {
  const speaking = status === 'Speaking';
  return (
    <button
      type="button"
      onClick={onCall}
      aria-label={`Call on ${member.name}. ${status}.`}
      className={`participant-seat absolute z-20 w-36 -translate-x-1/2 -translate-y-1/2 text-center ${speaking ? 'is-speaking' : ''}`}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
    >
      <img
        src={member.image}
        alt=""
        className="seat-portrait mx-auto size-[72px] border border-white/25 object-cover object-top grayscale"
      />
      <span className="seat-nameplate mt-2 block border border-white/18 bg-[#171916] px-2 py-2 shadow-[0_8px_20px_rgb(0_0_0/25%)]">
        <strong className="block text-[0.76rem] leading-tight font-semibold text-[#f2eee6]">
          {member.name}
        </strong>
        <span
          className={`mt-1 block font-mono text-[0.58rem] ${speaking ? 'text-[#e16e57]' : 'text-[#aaa79f]'}`}
        >
          {status}
        </span>
      </span>
    </button>
  );
}

function HumanSeat() {
  return (
    <div className="participant-seat absolute top-[84%] left-1/2 z-20 w-32 -translate-x-1/2 -translate-y-1/2 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full border-2 border-[#e16e57] bg-[#242520] font-serif text-lg text-[#f2eee6]">
        Y
      </span>
      <span className="seat-nameplate mt-2 block border border-[#e16e57]/55 bg-[#171916] px-2 py-2">
        <strong className="block text-xs font-semibold">You</strong>
        <span className="mt-1 block font-mono text-[0.58rem] text-[#e16e57]">
          Chair · Listening
        </span>
      </span>
    </div>
  );
}

function GuestSeat({ name, status }: { name: string | null; status: string }) {
  const initials = (name ?? 'Guest')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div
      className={`guest-seat participant-seat absolute top-[82%] left-[78%] z-20 w-36 -translate-x-1/2 -translate-y-1/2 text-center ${name ? 'is-joined' : 'is-waiting'}`}
    >
      <span className="guest-monogram mx-auto grid size-14 place-items-center rounded-full border border-dashed border-[#7c9cff]/70 bg-[#171916] font-mono text-sm text-[#b8c7ff]">
        {name ? initials : <Cable className="size-4" />}
      </span>
      <span className="seat-nameplate mt-2 block border border-[#7c9cff]/45 bg-[#171916] px-2 py-2">
        <strong className="block text-xs font-semibold text-[#f2eee6]">
          {name ?? 'Guest seat'}
        </strong>
        <span className="mt-1 block font-mono text-[0.56rem] text-[#9eb3ff]">
          {name ? 'Guest agent · WebMCP' : status}
        </span>
      </span>
    </div>
  );
}

function TranscriptRow({ message }: { message: TranscriptMessage }) {
  if (message.kind === 'system') {
    return (
      <div className="border-b border-[#d7d0c4] py-3 font-mono text-[0.65rem] leading-5 text-[#68645c]">
        {message.text}
      </div>
    );
  }

  const member = message.memberId ? findMember(message.memberId) : undefined;
  const isHuman = message.kind === 'human';
  const isGuest = message.kind === 'guest';
  const isSecretary = message.kind === 'secretary';
  const initials = message.speaker
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <article
      className={`border-b border-[#d7d0c4] py-5 ${isHuman ? 'border-l-2 border-l-[#b84432] pl-3' : isGuest ? 'border-l-2 border-l-[#315edb] pl-3' : ''}`}
    >
      <div className="flex items-center gap-2.5">
        {member ? (
          <img
            src={member.image}
            alt=""
            className="size-8 rounded-full object-cover object-top grayscale"
          />
        ) : (
          <span
            className={`grid size-8 place-items-center rounded-full border font-mono text-[0.6rem] ${isGuest ? 'border-[#315edb] text-[#315edb]' : 'border-[#b9b1a5] text-[#68645c]'}`}
          >
            {isSecretary ? 'S' : initials}
          </span>
        )}
        <div>
          <p className="text-sm font-semibold">{message.speaker}</p>
          <p className="font-mono text-[0.58rem] text-[#68645c]">
            {message.kind === 'board'
              ? 'Board member'
              : message.kind === 'guest'
                ? 'Guest agent'
                : message.kind === 'secretary'
                  ? 'Where the board stands'
                  : 'Chair'}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[0.95rem] leading-6 text-[#312e2a]">
        {message.text}
      </p>
    </article>
  );
}
