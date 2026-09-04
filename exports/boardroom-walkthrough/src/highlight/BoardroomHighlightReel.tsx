import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {HighlightFrame} from './HighlightFrame';
import {HookScene} from './HookScene';
import {OutroScene} from './OutroScene';

const CutFlash = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: '#f0d482',
      mixBlendMode: 'screen',
      opacity: 0.14,
      pointerEvents: 'none',
    }}
  />
);

export const BoardroomHighlightReel = () => (
  <AbsoluteFill style={{backgroundColor: '#0a0c09'}}>
    <Sequence from={0} durationInFrames={36} name="Hook: the outcome">
      <HookScene />
    </Sequence>

    <Sequence from={36} durationInFrames={105} name="Choose the board">
      <HighlightFrame
        image="deployed/02-board-selected.png"
        kicker="01 / Assemble"
        headline="Pick the room."
        dark={false}
        cursor={{x: 1710, y: 82}}
        zoom={1.01}
      />
    </Sequence>

    <Sequence from={141} durationInFrames={105} name="Brief one decision">
      <HighlightFrame
        image="deployed/03-decision-brief.png"
        kicker="02 / Frame it"
        headline="Ask one sharp question."
        dark={false}
        cursor={{x: 1754, y: 1050}}
        zoom={1.015}
      />
    </Sequence>

    <Sequence from={246} durationInFrames={144} name="Independent discussion">
      <HighlightFrame
        image="deployed/04-live-boardroom.png"
        kicker="03 / Debate"
        headline="Watch minds collide."
        cursor={{x: 1090, y: 510}}
        zoom={1.03}
      />
    </Sequence>

    <Sequence from={390} durationInFrames={120} name="Invite via WebMCP">
      <HighlightFrame
        image="deployed/05-agent-invite.png"
        kicker="04 / Native WebMCP"
        headline="Invite your own AI."
        accent="#7c9cff"
        cursor={{x: 1715, y: 990}}
        zoom={1.035}
      />
    </Sequence>

    <Sequence from={510} durationInFrames={105} name="Board sharpens the decision">
      <HighlightFrame
        image="deployed/06-boardroom-discussion.png"
        kicker="05 / Synthesize"
        headline="The board sharpens the call."
        accent="#ee6a4b"
        cursor={{x: 1458, y: 617}}
        zoom={1.03}
      />
    </Sequence>

    <Sequence from={615} durationInFrames={165} name="Executive readout">
      <HighlightFrame
        image="deployed/07-executive-memo.png"
        kicker="06 / Decide"
        headline="Leave with a way forward."
        accent="#54b889"
        dark={false}
        zoom={1.022}
      />
    </Sequence>

    <Sequence from={780} durationInFrames={120} name="Boardroom close">
      <OutroScene />
    </Sequence>

    {[36, 141, 246, 390, 510, 615, 780].map((frame) => (
      <Sequence key={frame} from={frame} durationInFrames={2} name="Cut flash">
        <CutFlash />
      </Sequence>
    ))}
    <Audio src={staticFile('assets/highlight-music.m4a')} volume={0.9} />
  </AbsoluteFill>
);
