import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {CaptionLayer} from './components/CaptionLayer';
import {BriefScene} from './scenes/BriefScene';
import {ChooseScene} from './scenes/ChooseScene';
import {DiscussionScene} from './scenes/DiscussionScene';
import {IntroScene} from './scenes/IntroScene';
import {InviteScene} from './scenes/InviteScene';
import {JoinedScene} from './scenes/JoinedScene';
import {MemoScene} from './scenes/MemoScene';

export const BoardroomWalkthrough = () => (
  <AbsoluteFill style={{backgroundColor: '#0d0f0d'}}>
    <Sequence from={0} durationInFrames={255} name="Meet Boardroom">
      <IntroScene />
    </Sequence>
    <Sequence from={255} durationInFrames={159} name="Choose your board">
      <ChooseScene />
    </Sequence>
    <Sequence from={414} durationInFrames={273} name="Brief the board">
      <BriefScene />
    </Sequence>
    <Sequence from={687} durationInFrames={570} name="Independent discussion">
      <DiscussionScene />
    </Sequence>
    <Sequence from={1257} durationInFrames={243} name="Invite your AI">
      <InviteScene />
    </Sequence>
    <Sequence from={1500} durationInFrames={106} name="Agent joins">
      <JoinedScene />
    </Sequence>
    <Sequence from={1606} durationInFrames={194} name="Executive memo">
      <MemoScene />
    </Sequence>
    <Audio src={staticFile('assets/narration.m4a')} volume={1.8} />
    <CaptionLayer />
  </AbsoluteFill>
);
