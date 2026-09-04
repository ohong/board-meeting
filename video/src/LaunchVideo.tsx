import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SANS } from "./fonts";
import { COLOR } from "./theme";
import { BEATS, XFADE } from "./timeline";
import { fadeIn } from "./motion";
import { EASE_IN_OUT } from "./theme";
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

/**
 * Picture and sound are placed independently.
 *
 * Every scene runs XFADE frames past its own end and the next one fades in over
 * the top, which cross-dissolves without shifting anything: the voiceover clips
 * sit at absolute frames taken straight from `timeline.ts`, so an adjustment to
 * a dissolve can never drag the read out of sync with the picture.
 */
const Beat: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const beat = BEATS[index];
  const Scene = SCENES[beat.id];

  return (
    <AbsoluteFill style={{ opacity: index === 0 ? 1 : fadeIn(frame, 0, XFADE) }}>
      <AbsoluteFill
        style={{
          scale: interpolate(frame, [0, beat.duration + XFADE], [1.006, 1.044], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE_IN_OUT),
            output: "perceptual-scale",
          }),
        }}
      >
        <Scene />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const LaunchVideo: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        fontFamily: SANS,
        backgroundColor: COLOR.canvas,
        letterSpacing: "-0.015em",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {BEATS.map((b, i) => (
        <Sequence
          key={b.id}
          from={b.from}
          durationInFrames={b.duration + (i === BEATS.length - 1 ? 0 : XFADE)}
          name={b.id}
        >
          <Beat index={i} />
        </Sequence>
      ))}

      {BEATS.map((b) => (
        <Sequence key={`vo-${b.line}`} from={b.voAt} name={`vo:${b.line}`} layout="none">
          <Audio src={staticFile(`audio/vo/${b.line}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
