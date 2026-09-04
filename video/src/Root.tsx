import "./index.css";
import { Composition, Folder } from "remotion";
import { LaunchVideo } from "./LaunchVideo";
import { BEATS, FPS, TOTAL } from "./timeline";
import { Open } from "./scenes/Open";
import { Board } from "./scenes/Board";
import { Brief } from "./scenes/Brief";
import { Positions } from "./scenes/Positions";
import { Argue } from "./scenes/Argue";
import { Seat } from "./scenes/Seat";
import { Tools } from "./scenes/Tools";
import { Agent } from "./scenes/Agent";
import { Memo } from "./scenes/Memo";
import { EndCard } from "./scenes/EndCard";

const SCENES: Record<string, React.FC> = {
  Open,
  Board,
  Brief,
  Positions,
  Argue,
  Seat,
  Tools,
  Agent,
  Memo,
  EndCard,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LaunchVideo"
        component={LaunchVideo}
        durationInFrames={TOTAL}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* Each beat on its own, at exactly the length the read gives it, so a
          scene can be retimed in place without scrubbing the whole film. */}
      <Folder name="Scenes">
        {BEATS.map((b) => (
          <Composition
            key={b.id}
            id={b.id}
            component={SCENES[b.id]}
            durationInFrames={b.duration}
            fps={FPS}
            width={1920}
            height={1080}
          />
        ))}
      </Folder>
    </>
  );
};
