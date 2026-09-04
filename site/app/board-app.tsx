'use client';

/* oxlint-disable next/no-img-element -- These bundled, fixed-ratio POC portraits intentionally avoid a Next-specific image pipeline in the default Sites stack. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Cable,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  Search,
  Share2,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RoomMeetingScreen } from '@/app/room-meeting';
import {
  BOARD_MEMBERS,
  DEMO_BOARD_IDS,
  DEMO_CONTEXT,
  DEMO_QUESTION,
  type BoardMember,
  findMember,
} from '@/lib/board-data';
import {
  registerBoardMeetingTools,
  type BoardMeetingPhase,
  type BoardMeetingReadout,
  type BoardMeetingToolAdapter,
} from '@/lib/webmcp';

type TranscriptMessage = {
  id: string;
  kind: 'board' | 'human' | 'guest' | 'secretary' | 'system';
  speaker: string;
  text: string;
  memberId?: string;
};

type WebMcpStatus = 'checking' | 'ready' | 'unavailable' | 'error';

const RECOMMENDATION =
  'Keep a deliberately constrained free workspace for distribution. Gate high-cost collaboration and support, then run a 30-day cohort test against a time-boxed trial.';

const READOUT: BoardMeetingReadout = {
  recommendation: RECOMMENDATION,
  options: [
    'Keep the current free tier unchanged.',
    'Replace free with a universal 14-day trial.',
    'Keep a narrower free workspace and gate costly collaboration features.',
  ],
  agreement: [
    'The discovery loop created by invited collaborators is worth protecting.',
    'The current support burden is too high for an 18-person company.',
    'The next move should be reversible and measured by behavior, not instinct.',
  ],
  tensions: [
    'DHH favors a cleaner paid product; Daniel and Lulu place more weight on preserving distribution and trust.',
    'A trial creates urgency, while a bounded free experience keeps the product easy to discover.',
  ],
  assumptions: [
    'Invited collaborators create more downstream demand than self-created free workspaces.',
    'Support cost can be reduced by changing entitlement before removing access.',
  ],
  openQuestions: [
    'Which free-workspace behaviors actually predict a paid team six months later?',
    'What share of support volume comes from active collaborators versus dormant accounts?',
  ],
  nextActions: [
    'Segment free workspaces by acquisition value, support cost, and conversion behavior.',
    'Prototype a limited free workspace that preserves invitation and sharing loops.',
    'Run a 30-day cohort test with precommitted keep, change, and stop thresholds.',
  ],
};

const INVITATION =
  'You are invited to the active board meeting on this page. Use its Site tools to inspect the meeting, join using the name you know yourself by, share any relevant context you already have, ask Daniel Ek one focused question about whether that evidence changes his view, and request a synthesis of the discussion. After I end the meeting, retrieve the final readout.';

function messageId() {
  return `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function summaryMarkdown(question: string, board: BoardMember[]) {
  const lines = (items: string[]) =>
    items.map((item) => `- ${item}`).join('\n');
  return [
    '# Board meeting readout',
    '',
    `**Agenda:** ${question}`,
    `**Board:** ${board.map((member) => member.name).join(', ')}`,
    '',
    '## Recommendation',
    RECOMMENDATION,
    '',
    '## What the board agreed on',
    lines(READOUT.agreement),
    '',
    '## Options considered',
    lines(READOUT.options),
    '',
    '## Tensions to preserve',
    lines(READOUT.tensions),
    '',
    '## Important assumptions',
    lines(READOUT.assumptions),
    '',
    '## Open questions',
    lines(READOUT.openQuestions),
    '',
    '## Next actions',
    lines(READOUT.nextActions),
  ].join('\n');
}

export function BoardApp() {
  const [phase, setPhase] = useState<BoardMeetingPhase>('select');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [guest, setGuest] = useState<string | null>(null);
  const [pendingSpeaker, setPendingSpeaker] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [agentWalkthroughRunning, setAgentWalkthroughRunning] = useState(false);
  const [webMcpStatus, setWebMcpStatus] = useState<WebMcpStatus>('checking');
  const [actionStatus, setActionStatus] = useState('');

  const phaseRef = useRef(phase);
  const selectedRef = useRef(selected);
  const questionRef = useRef(question);
  const contextRef = useRef(context);
  const transcriptRef = useRef(transcript);
  const guestRef = useRef(guest);
  const timersRef = useRef<number[]>([]);

  const selectedMembers = useMemo(
    () =>
      selected
        .map(findMember)
        .filter((member): member is BoardMember => Boolean(member)),
    [selected],
  );

  const filteredMembers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return BOARD_MEMBERS;
    return BOARD_MEMBERS.filter((member) =>
      `${member.name} ${member.bio} ${member.lens}`
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);

  const setPhaseValue = useCallback((value: BoardMeetingPhase) => {
    phaseRef.current = value;
    setPhase(value);
  }, []);

  const setGuestValue = useCallback((value: string | null) => {
    guestRef.current = value;
    setGuest(value);
  }, []);

  const replaceTranscript = useCallback((value: TranscriptMessage[]) => {
    transcriptRef.current = value;
    setTranscript(value);
  }, []);

  const appendMessage = useCallback(
    (message: Omit<TranscriptMessage, 'id'>) => {
      const next = [...transcriptRef.current, { ...message, id: messageId() }];
      replaceTranscript(next);
      return next.at(-1)!;
    },
    [replaceTranscript],
  );

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
  }, []);

  const selectedMemberForName = useCallback((value: string) => {
    const requested = normalizeName(value);
    return selectedRef.current
      .map(findMember)
      .find(
        (member) =>
          member &&
          [member.id, member.name, member.shortName]
            .map(normalizeName)
            .some(
              (name) =>
                name === requested ||
                name.includes(requested) ||
                requested.includes(name),
            ),
      );
  }, []);

  const joinMeeting = useCallback(
    (name: string) => {
      if (phaseRef.current !== 'meeting') {
        throw new Error('The guest seat opens only during an active meeting.');
      }
      if (guestRef.current && guestRef.current !== name) {
        throw new Error(
          `The guest seat is already occupied by ${guestRef.current}.`,
        );
      }
      const alreadyJoined = guestRef.current === name;
      if (!guestRef.current) {
        setGuestValue(name);
        appendMessage({
          kind: 'system',
          speaker: 'Boardroom',
          text: `${name} joined through WebMCP and can now address the room.`,
        });
      }
      return {
        status: alreadyJoined ? 'already_joined' : 'joined',
        participant: name,
      };
    },
    [appendMessage, setGuestValue],
  );

  const contributeToMeeting = useCallback(
    (text: string) => {
      if (phaseRef.current !== 'meeting') {
        throw new Error('Contributions require an active meeting.');
      }
      if (!guestRef.current) {
        throw new Error('Join the meeting before contributing.');
      }
      appendMessage({
        kind: 'guest',
        speaker: guestRef.current,
        text,
      });
      return { status: 'shared', contribution: text };
    },
    [appendMessage],
  );

  const addressBoardMember = useCallback(
    async (memberName: string, text: string) => {
      if (phaseRef.current !== 'meeting') {
        throw new Error(
          'Board members can be addressed only during an active meeting.',
        );
      }
      if (!guestRef.current) {
        throw new Error('Join the meeting before addressing a board member.');
      }
      const member = selectedMemberForName(memberName);
      if (!member) {
        throw new Error(`${memberName} is not a member of this board.`);
      }

      appendMessage({
        kind: 'guest',
        speaker: guestRef.current,
        text: `To ${member.name}: ${text}`,
      });
      setPendingSpeaker(member.name);
      await wait(450);
      if (phaseRef.current !== 'meeting') {
        setPendingSpeaker(null);
        throw new Error(
          'The meeting ended before the board member could respond.',
        );
      }
      appendMessage({
        kind: 'board',
        speaker: member.name,
        memberId: member.id,
        text: member.followUp,
      });
      setPendingSpeaker(null);
      return {
        status: 'answered',
        member: member.name,
        response: member.followUp,
      };
    },
    [appendMessage, selectedMemberForName],
  );

  const requestSynthesis = useCallback(() => {
    if (phaseRef.current !== 'meeting') {
      throw new Error('A synthesis requires an active meeting.');
    }
    if (!guestRef.current) {
      throw new Error('Join the meeting before requesting a synthesis.');
    }
    const synthesis =
      'The board agrees that support cost must fall and that the sharing loop has strategic value. The live disagreement is whether a trial or a narrower free workspace creates the better upgrade moment. The unresolved question is which free behaviors actually predict paid adoption.';
    appendMessage({ kind: 'secretary', speaker: 'Secretary', text: synthesis });
    return { status: 'added_to_transcript', synthesis };
  }, [appendMessage]);

  const getReadout = useCallback(() => {
    if (phaseRef.current !== 'summary') {
      return {
        ready: false as const,
        message:
          'The final readout is not ready. The human chair must end the meeting first.',
      };
    }
    if (guestRef.current) {
      setActionStatus(`Retrieved by ${guestRef.current}.`);
    }
    return { ready: true as const, readout: READOUT };
  }, []);

  const inspectMeeting = useCallback(
    () => ({
      question: questionRef.current,
      context: contextRef.current,
      phase: phaseRef.current,
      board: selectedRef.current
        .map(findMember)
        .filter((member): member is BoardMember => Boolean(member))
        .map((member) => member.name),
      participants: [
        'Human chair',
        ...selectedRef.current
          .map(findMember)
          .filter((member): member is BoardMember => Boolean(member))
          .map((member) => member.name),
        ...(guestRef.current ? [guestRef.current] : []),
      ],
      transcript: transcriptRef.current.slice(-16).map((message) => ({
        speaker: message.speaker,
        text: message.text,
      })),
      readoutReady: phaseRef.current === 'summary',
    }),
    [],
  );

  const toolAdapter = useMemo<BoardMeetingToolAdapter>(
    () => ({
      inspect: inspectMeeting,
      join: joinMeeting,
      contribute: contributeToMeeting,
      address: addressBoardMember,
      requestSynthesis,
      getReadout,
    }),
    [
      addressBoardMember,
      contributeToMeeting,
      getReadout,
      inspectMeeting,
      joinMeeting,
      requestSynthesis,
    ],
  );

  useEffect(() => {
    const controller = new AbortController();
    registerBoardMeetingTools(() => toolAdapter, controller.signal)
      .then((available) => setWebMcpStatus(available ? 'ready' : 'unavailable'))
      .catch((error: unknown) => {
        console.error('WebMCP tool registration failed', error);
        setWebMcpStatus('error');
      });
    return () => controller.abort();
  }, [toolAdapter]);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [phase]);

  function toggleMember(id: string) {
    setNotice('');
    const current = selectedRef.current;
    let next: string[];
    if (current.includes(id)) {
      next = current.filter((memberId) => memberId !== id);
    } else if (current.length === 6) {
      setNotice('A board can have up to six members.');
      return;
    } else {
      next = [...current, id];
    }
    selectedRef.current = next;
    setSelected(next);
  }

  function useDemoBoard() {
    selectedRef.current = DEMO_BOARD_IDS;
    setSelected(DEMO_BOARD_IDS);
    setNotice('');
  }

  function applyDemoBrief() {
    questionRef.current = DEMO_QUESTION;
    contextRef.current = DEMO_CONTEXT;
    setQuestion(DEMO_QUESTION);
    setContext(DEMO_CONTEXT);
  }

  function startMeeting() {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || selectedRef.current.length < 3) return;
    questionRef.current = cleanQuestion;
    contextRef.current = context.trim();
    setQuestion(cleanQuestion);
    clearTimers();
    setGuestValue(null);
    setPhaseValue('meeting');
    const initial: TranscriptMessage[] = [
      {
        id: messageId(),
        kind: 'system',
        speaker: 'Boardroom',
        text: 'The chair opened the agenda. Independent opening positions are coming into the room.',
      },
    ];
    replaceTranscript(initial);

    selectedRef.current
      .map(findMember)
      .filter((member): member is BoardMember => Boolean(member))
      .forEach((member, index, members) => {
        const thinkingTimer = window.setTimeout(
          () => {
            setPendingSpeaker(member.name);
          },
          280 + index * 680,
        );
        const messageTimer = window.setTimeout(
          () => {
            appendMessage({
              kind: 'board',
              speaker: member.name,
              memberId: member.id,
              text: member.opening,
            });
            setPendingSpeaker(
              index === members.length - 1
                ? null
                : (members[index + 1]?.name ?? null),
            );
          },
          620 + index * 680,
        );
        timersRef.current.push(thinkingTimer, messageTimer);
      });
  }

  function sendHumanMessage() {
    const text = draft.trim();
    if (!text || pendingSpeaker) return;
    appendMessage({ kind: 'human', speaker: 'You', text });
    setDraft('');

    const explicitlyAddressed = selectedMembers.find((member) =>
      text.toLowerCase().includes(member.shortName.toLowerCase()),
    );
    const boardTurns = transcriptRef.current.filter(
      (message) => message.kind === 'board',
    ).length;
    const member =
      explicitlyAddressed ??
      selectedMembers[boardTurns % selectedMembers.length];
    if (!member) return;
    setPendingSpeaker(member.name);
    const timer = window.setTimeout(() => {
      appendMessage({
        kind: 'board',
        speaker: member.name,
        memberId: member.id,
        text: member.followUp,
      });
      setPendingSpeaker(null);
    }, 520);
    timersRef.current.push(timer);
  }

  function endMeeting() {
    clearTimers();
    setPendingSpeaker(null);
    setPhaseValue('summary');
    setActionStatus('Readout ready.');
  }

  function resetMeeting() {
    clearTimers();
    setPhaseValue('select');
    selectedRef.current = [];
    setSelected([]);
    questionRef.current = '';
    contextRef.current = '';
    setQuestion('');
    setContext('');
    replaceTranscript([]);
    setGuestValue(null);
    setDraft('');
    setNotice('');
    setActionStatus('');
  }

  async function runAgentWalkthrough() {
    if (agentWalkthroughRunning) return;
    setAgentWalkthroughRunning(true);
    setInviteOpen(false);
    try {
      joinMeeting('Codex');
      await wait(360);
      contributeToMeeting(
        'One missing detail from prior research: invited free collaborators are 3.4× more likely to join a paid workspace within six months than self-created free accounts.',
      );
      await wait(460);
      const target = selectedMemberForName('Daniel Ek') ?? selectedMembers[0];
      if (target) {
        await addressBoardMember(
          target.name,
          'Does that evidence change how aggressively you would narrow the free tier?',
        );
      }
      await wait(320);
      requestSynthesis();
      setActionStatus('Codex completed the visible WebMCP walkthrough.');
    } catch (error) {
      setActionStatus(
        error instanceof Error
          ? error.message
          : 'The walkthrough could not finish.',
      );
    } finally {
      setAgentWalkthroughRunning(false);
    }
  }

  async function copyInvitation() {
    await navigator.clipboard.writeText(INVITATION);
    setActionStatus('Invitation copied.');
  }

  async function shareReadout() {
    const text = summaryMarkdown(questionRef.current, selectedMembers);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Board meeting readout', text });
        setActionStatus('Readout shared.');
      } else {
        await navigator.clipboard.writeText(text);
        setActionStatus('Readout copied to your clipboard.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      await navigator.clipboard.writeText(text);
      setActionStatus('Readout copied to your clipboard.');
    }
  }

  function downloadReadout() {
    const blob = new Blob(
      [summaryMarkdown(questionRef.current, selectedMembers)],
      { type: 'text/markdown;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'board-meeting-readout.md';
    anchor.click();
    URL.revokeObjectURL(url);
    setActionStatus('Markdown readout downloaded.');
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div
        className={
          phase === 'meeting'
            ? 'min-h-screen'
            : 'mx-auto grid min-h-screen max-w-[1680px] grid-cols-1 lg:grid-cols-[304px_minmax(0,1fr)]'
        }
      >
        {phase !== 'meeting' ? (
          <BoardRail
            phase={phase}
            selectedMembers={selectedMembers}
            guest={guest}
            webMcpStatus={webMcpStatus}
          />
        ) : null}

        {phase === 'select' ? (
          <SelectionScreen
            query={query}
            setQuery={setQuery}
            members={filteredMembers}
            selected={selected}
            notice={notice}
            onToggle={toggleMember}
            onDemo={useDemoBoard}
            onContinue={() => setPhaseValue('brief')}
          />
        ) : null}

        {phase === 'brief' ? (
          <BriefScreen
            question={question}
            context={context}
            selectedMembers={selectedMembers}
            onQuestion={(value) => {
              questionRef.current = value;
              setQuestion(value);
            }}
            onContext={(value) => {
              contextRef.current = value;
              setContext(value);
            }}
            onDemo={applyDemoBrief}
            onBack={() => setPhaseValue('select')}
            onStart={startMeeting}
          />
        ) : null}

        {phase === 'meeting' ? (
          <RoomMeetingScreen
            question={question}
            selectedMembers={selectedMembers}
            transcript={transcript}
            guest={guest}
            pendingSpeaker={pendingSpeaker}
            guestThresholdVisible={inviteOpen || agentWalkthroughRunning}
            draft={draft}
            actionStatus={actionStatus}
            onDraft={setDraft}
            onSend={sendHumanMessage}
            onInvite={() => setInviteOpen(true)}
            onEnd={endMeeting}
          />
        ) : null}

        {phase === 'summary' ? (
          <SummaryScreen
            question={question}
            selectedMembers={selectedMembers}
            guest={guest}
            actionStatus={actionStatus}
            onShare={shareReadout}
            onDownload={downloadReadout}
            onReset={resetMeeting}
          />
        ) : null}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-h-[88vh] max-w-[min(40rem,calc(100%-2rem))] overflow-y-auto rounded-2xl p-6 sm:max-w-xl">
          <DialogHeader>
            <div className="mb-2 grid size-11 place-items-center rounded-full bg-foreground text-background">
              <Cable className="size-5" />
            </div>
            <DialogTitle className="font-serif text-3xl tracking-[-0.035em]">
              Bring your AI into the room
            </DialogTitle>
            <DialogDescription className="max-w-lg text-sm leading-6">
              A compatible agent can discover six WebMCP tools on this page,
              join one guest seat, add context, address a director, and retrieve
              the final readout.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border bg-muted/45 p-4">
            <p className="eyebrow mb-2">Invitation prompt</p>
            <p className="text-sm leading-6 text-foreground/78">{INVITATION}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="h-11 flex-1 rounded-full"
              onClick={copyInvitation}
            >
              <Copy className="size-4" />
              Copy invitation
            </Button>
            <Button
              className="h-11 flex-1 rounded-full bg-[var(--signal)] text-white hover:bg-[var(--signal-strong)]"
              onClick={runAgentWalkthrough}
              disabled={agentWalkthroughRunning}
            >
              {agentWalkthroughRunning ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              Preview the handoff
            </Button>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            The preview uses the same actions as the registered tools. In a
            WebMCP-capable browser, your agent can perform the sequence
            directly.
          </p>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function BoardRail({
  phase,
  selectedMembers,
  guest,
  webMcpStatus,
}: {
  phase: BoardMeetingPhase;
  selectedMembers: BoardMember[];
  guest: string | null;
  webMcpStatus: WebMcpStatus;
}) {
  const steps: Array<{ id: BoardMeetingPhase; label: string }> = [
    { id: 'select', label: 'Assemble' },
    { id: 'brief', label: 'Set agenda' },
    { id: 'meeting', label: 'Discuss' },
    { id: 'summary', label: 'Readout' },
  ];
  const currentIndex = steps.findIndex((step) => step.id === phase);
  const webMcpCopy = {
    checking: 'Checking WebMCP',
    ready: 'WebMCP ready',
    unavailable: 'WebMCP preview mode',
    error: 'WebMCP unavailable',
  }[webMcpStatus];

  return (
    <aside className="board-rail flex flex-col border-b border-white/10 px-5 py-5 text-white lg:min-h-screen lg:border-r lg:border-b-0 lg:px-7 lg:py-7">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full border border-white/25 font-serif text-lg">
            B
          </div>
          <span className="text-[0.8rem] font-semibold uppercase tracking-[0.18em]">
            Boardroom
          </span>
        </div>
        <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/65">
          POC
        </span>
      </div>

      <ol className="mt-7 flex items-center gap-2 lg:mt-10 lg:block lg:space-y-2">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`flex min-w-0 items-center gap-2.5 rounded-full px-2.5 py-2 text-xs font-medium lg:text-sm ${
              index === currentIndex
                ? 'bg-white text-foreground'
                : index < currentIndex
                  ? 'text-white/75'
                  : 'text-white/35'
            }`}
          >
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full border text-[0.65rem] ${
                index < currentIndex
                  ? 'border-[var(--signal)] bg-[var(--signal)] text-white'
                  : index === currentIndex
                    ? 'border-foreground/20'
                    : 'border-white/20'
              }`}
            >
              {index < currentIndex ? <Check className="size-3" /> : index + 1}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </li>
        ))}
      </ol>

      <div className="mt-10 hidden lg:block">
        <p className="eyebrow text-white/45">In the room</p>
        <div className="mt-4 space-y-3">
          {selectedMembers.length ? (
            selectedMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <img
                  src={member.image}
                  alt=""
                  className="size-10 shrink-0 rounded-full bg-white/10 object-cover object-top grayscale"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  <p className="truncate text-xs text-white/42">
                    {member.lens.split(',')[0]}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="max-w-[15rem] text-sm leading-6 text-white/50">
              Select three to six people whose judgment you want in the room.
            </p>
          )}
          {guest ? (
            <div className="flex items-center gap-3 border-t border-white/10 pt-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--signal)]">
                <Cable className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{guest}</p>
                <p className="text-xs text-white/42">Guest AI · WebMCP</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-auto hidden border-t border-white/10 pt-5 lg:block">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span
            className={`size-2 rounded-full ${webMcpStatus === 'ready' ? 'bg-emerald-400' : 'bg-white/30'}`}
          />
          {webMcpCopy}
        </div>
        <p className="mt-3 text-xs leading-5 text-white/38">
          Interactive simulation · runtime target: Vercel Eve with GPT-5.6 Luna.
        </p>
      </div>
    </aside>
  );
}

function SelectionScreen({
  query,
  setQuery,
  members,
  selected,
  notice,
  onToggle,
  onDemo,
  onContinue,
}: {
  query: string;
  setQuery: (value: string) => void;
  members: BoardMember[];
  selected: string[];
  notice: string;
  onToggle: (id: string) => void;
  onDemo: () => void;
  onContinue: () => void;
}) {
  return (
    <section className="min-w-0 px-5 py-7 sm:px-8 lg:px-11 lg:py-10 xl:px-14">
      <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">Step 1 of 4 · Assemble the room</p>
          <h1 className="mt-3 font-serif text-[clamp(2.6rem,5vw,4.8rem)] leading-[0.94] tracking-[-0.045em]">
            Choose your board.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Pick advisers who will disagree usefully. Each seat brings a
            distinct point of view to one shared conversation.
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={onDemo}
          className="h-11 self-start rounded-full px-4 sm:self-auto"
        >
          <Users className="size-4" />
          Use demo board
        </Button>
      </header>

      <div className="sticky top-0 z-20 -mx-2 flex flex-col gap-3 bg-background/94 px-2 py-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="relative block w-full sm:max-w-sm">
          <label htmlFor="board-search" className="sr-only">
            Search board members
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="board-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people or expertise"
            className="h-11 rounded-full border-border bg-card pl-10 text-base shadow-none"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className="whitespace-nowrap text-sm font-medium"
              aria-live="polite"
            >
              <span className="tabular-nums">{selected.length}</span> of 3–6
              selected
            </p>
            {notice ? (
              <output className="block max-w-48 text-xs text-muted-foreground">
                {notice}
              </output>
            ) : null}
          </div>
          <Button
            disabled={selected.length < 3}
            onClick={onContinue}
            className="rounded-full bg-foreground px-4 text-background"
          >
            Brief the board
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => {
          const isSelected = selected.includes(member.id);
          return (
            <article key={member.id} className="group min-w-0">
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(member.id)}
                className="block w-full text-left outline-none"
              >
                <div
                  className={`relative aspect-[4/4.5] overflow-hidden rounded-[1.35rem] border bg-muted transition ${
                    isSelected
                      ? 'border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background'
                      : 'border-border group-hover:border-foreground/45'
                  }`}
                >
                  <img
                    src={member.image}
                    alt={`Portrait of ${member.name}`}
                    className="h-full w-full object-cover object-top grayscale transition duration-500 group-hover:scale-[1.015]"
                  />
                  <span
                    className={`absolute top-3 right-3 grid size-8 place-items-center rounded-full border shadow-sm backdrop-blur transition ${
                      isSelected
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-black/10 bg-white/90 text-transparent'
                    }`}
                  >
                    <Check className="size-4" />
                    <span className="sr-only">
                      {isSelected ? 'Selected' : 'Not selected'}
                    </span>
                  </span>
                  <span className="absolute right-3 bottom-3 rounded-full bg-black/72 px-3 py-1.5 text-[0.68rem] font-semibold tracking-wide text-white backdrop-blur">
                    {member.lens.split(',')[0]}
                  </span>
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold tracking-[-0.01em]">
                      {member.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                      {member.bio}
                    </p>
                  </div>
                  <span
                    className={`mt-1 size-2.5 shrink-0 rounded-full ${isSelected ? 'bg-[var(--signal)]' : 'bg-border'}`}
                  />
                </div>
              </button>
              <a
                href={member.source}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Senra interview <ExternalLink className="size-3" />
              </a>
            </article>
          );
        })}
      </div>

      <p className="mt-10 border-t pt-5 text-xs leading-5 text-muted-foreground">
        Portraits and biographies are sourced from the linked Senra interviews
        for this proof of concept.
      </p>
    </section>
  );
}

function BriefScreen({
  question,
  context,
  selectedMembers,
  onQuestion,
  onContext,
  onDemo,
  onBack,
  onStart,
}: {
  question: string;
  context: string;
  selectedMembers: BoardMember[];
  onQuestion: (value: string) => void;
  onContext: (value: string) => void;
  onDemo: () => void;
  onBack: () => void;
  onStart: () => void;
}) {
  return (
    <section className="min-w-0 px-5 py-7 sm:px-8 lg:px-12 lg:py-10 xl:px-16">
      <div className="mx-auto max-w-5xl">
        <Button
          variant="ghost"
          onClick={onBack}
          className="-ml-3 rounded-full text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> Back to board
        </Button>
        <header className="mt-7 max-w-3xl">
          <p className="eyebrow">Step 2 of 4 · Set the agenda</p>
          <h1 className="mt-3 font-serif text-[clamp(2.7rem,5vw,5rem)] leading-[0.95] tracking-[-0.045em]">
            What decision is on the table?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Give the board one crisp question and the context they need.
            Uncertainty is useful; vagueness is not.
          </p>
        </header>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <label htmlFor="decision-question" className="eyebrow">
              Decision question
            </label>
            <Textarea
              id="decision-question"
              value={question}
              onChange={(event) => onQuestion(event.target.value)}
              placeholder="Should we…?"
              maxLength={500}
              className="mt-4 min-h-44 resize-none border-0 bg-transparent p-0 font-serif text-2xl leading-9 shadow-none focus-visible:ring-0 md:text-2xl"
            />
            <span className="mt-3 block text-right text-xs tabular-nums text-muted-foreground">
              {question.length}/500
            </span>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <label htmlFor="decision-context" className="eyebrow">
              What the board should know
            </label>
            <Textarea
              id="decision-context"
              value={context}
              onChange={(event) => onContext(event.target.value)}
              placeholder="Metrics, constraints, prior attempts, and what makes this hard…"
              maxLength={3_000}
              className="mt-4 min-h-44 resize-none border-0 bg-transparent p-0 text-base leading-7 shadow-none focus-visible:ring-0"
            />
            <span className="mt-3 block text-right text-xs tabular-nums text-muted-foreground">
              {context.length}/3,000
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-2xl border bg-muted/45 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {selectedMembers.map((member) => (
                <img
                  key={member.id}
                  src={member.image}
                  alt=""
                  className="size-9 rounded-full border-2 border-background object-cover object-top grayscale"
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedMembers.length} independent opening positions
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onDemo}
            className="self-start rounded-full sm:self-auto"
          >
            Load sample decision
          </Button>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            size="lg"
            disabled={!question.trim()}
            onClick={onStart}
            className="h-12 rounded-full bg-[var(--signal)] px-6 text-white hover:bg-[var(--signal-strong)]"
          >
            Start the meeting <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function SummaryScreen({
  question,
  selectedMembers,
  guest,
  actionStatus,
  onShare,
  onDownload,
  onReset,
}: {
  question: string;
  selectedMembers: BoardMember[];
  guest: string | null;
  actionStatus: string;
  onShare: () => void;
  onDownload: () => void;
  onReset: () => void;
}) {
  return (
    <section className="min-w-0 px-5 py-7 sm:px-8 lg:px-12 lg:py-10 xl:px-16">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-6 border-b pb-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <p className="eyebrow">Meeting complete · Executive readout</p>
            </div>
            <h1 className="mt-4 font-serif text-[clamp(2.6rem,5vw,4.7rem)] leading-[0.96] tracking-[-0.045em]">
              The free tier should change, not disappear.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {question}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={onShare}
              className="rounded-full"
            >
              <Share2 className="size-4" /> Share
            </Button>
            <Button
              variant="outline"
              onClick={onDownload}
              className="rounded-full"
            >
              <Download className="size-4" /> Download
            </Button>
          </div>
        </header>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-2xl bg-foreground p-6 text-background sm:p-8">
            <p className="eyebrow text-white/48">Recommendation</p>
            <p className="mt-5 font-serif text-2xl leading-9 tracking-[-0.025em] sm:text-3xl sm:leading-10">
              {READOUT.recommendation}
            </p>
            <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5">
              <div className="flex -space-x-2">
                {selectedMembers.slice(0, 5).map((member) => (
                  <img
                    key={member.id}
                    src={member.image}
                    alt=""
                    className="size-9 rounded-full border-2 border-foreground object-cover object-top grayscale"
                  />
                ))}
              </div>
              <p className="text-xs text-white/50">
                Synthesized from {selectedMembers.length} board positions
                {guest ? ` + ${guest}` : ''}
              </p>
            </div>
          </article>

          <ReadoutSection
            number="01"
            title="What the board agreed on"
            items={READOUT.agreement}
            className="bg-card"
          />
          <ReadoutSection
            number="02"
            title="Tensions to preserve"
            items={READOUT.tensions}
            className="bg-[color:var(--signal)]/[0.055]"
          />
          <ReadoutSection
            number="03"
            title="Open questions"
            items={READOUT.openQuestions}
            className="bg-card"
          />
        </div>

        <article className="mt-5 rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow">04 · Next 30 days</p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-0.035em]">
                Turn the debate into evidence.
              </h2>
            </div>
            <span className="hidden rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground sm:inline">
              3 actions
            </span>
          </div>
          <ol className="mt-7 grid gap-3 md:grid-cols-3">
            {READOUT.nextActions.map((action, index) => (
              <li key={action} className="rounded-xl bg-muted/55 p-4">
                <span className="text-xs font-semibold tabular-nums text-[var(--signal)]">
                  0{index + 1}
                </span>
                <p className="mt-2 text-sm leading-6">{action}</p>
              </li>
            ))}
          </ol>
        </article>

        <article className="mt-5 rounded-2xl border bg-card p-6 sm:p-8">
          <p className="eyebrow">Closing views</p>
          <div className="mt-5 divide-y">
            {selectedMembers.map((member) => (
              <div
                key={member.id}
                className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[180px_1fr]"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={member.image}
                    alt=""
                    className="size-10 rounded-full object-cover object-top grayscale"
                  />
                  <p className="text-sm font-semibold">{member.name}</p>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {member.followUp}
                </p>
              </div>
            ))}
          </div>
        </article>

        <footer className="mt-8 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">{actionStatus}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ephemeral POC · no meeting data is stored.
            </p>
          </div>
          <Button
            onClick={onReset}
            className="self-start rounded-full bg-foreground text-background sm:self-auto"
          >
            <MessageCircle className="size-4" /> Start another meeting
          </Button>
        </footer>
      </div>
    </section>
  );
}

function ReadoutSection({
  number,
  title,
  items,
  className,
}: {
  number: string;
  title: string;
  items: string[];
  className: string;
}) {
  return (
    <article className={`rounded-2xl border p-6 ${className}`}>
      <p className="eyebrow">{number}</p>
      <h2 className="mt-2 font-serif text-2xl tracking-[-0.03em]">{title}</h2>
      <ul className="mt-5 space-y-4">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-3 text-sm leading-6 text-muted-foreground"
          >
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--signal)]" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
