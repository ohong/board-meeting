import {Composition, Folder} from 'remotion';
import {BoardroomWalkthrough} from './Video';
import {BoardroomHighlightReel} from './highlight/BoardroomHighlightReel';
import {BriefScene} from './scenes/BriefScene';
import {ChooseScene} from './scenes/ChooseScene';
import {DiscussionScene} from './scenes/DiscussionScene';
import {IntroScene} from './scenes/IntroScene';
import {InviteScene} from './scenes/InviteScene';
import {JoinedScene} from './scenes/JoinedScene';
import {MemoScene} from './scenes/MemoScene';

export const Root = () => (
  <>
    <Folder name="Boardroom-scenes">
      <Composition id="IntroScene" component={IntroScene} durationInFrames={255} fps={30} width={1920} height={1080} />
      <Composition id="ChooseScene" component={ChooseScene} durationInFrames={159} fps={30} width={1920} height={1080} />
      <Composition id="BriefScene" component={BriefScene} durationInFrames={273} fps={30} width={1920} height={1080} />
      <Composition id="DiscussionScene" component={DiscussionScene} durationInFrames={570} fps={30} width={1920} height={1080} />
      <Composition id="InviteScene" component={InviteScene} durationInFrames={243} fps={30} width={1920} height={1080} />
      <Composition id="JoinedScene" component={JoinedScene} durationInFrames={106} fps={30} width={1920} height={1080} />
      <Composition id="MemoScene" component={MemoScene} durationInFrames={194} fps={30} width={1920} height={1080} />
    </Folder>
    <Composition
      id="BoardroomWalkthrough"
      component={BoardroomWalkthrough}
      durationInFrames={1800}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="BoardroomHighlightReel"
      component={BoardroomHighlightReel}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
