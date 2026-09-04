import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { COLOR, EASE_IN_OUT, SHOT_H, SHOT_W } from "../theme";

/**
 * A real screenshot of the running app, held behind the caption.
 *
 * Screenshots here carry texture and proof, not copy: at timeline width nobody
 * reads a 13px label, and left sharp the app's own headings fight the caption
 * for the same corner of the frame. So every shot is pushed in slowly, thrown
 * a little out of focus, and washed back under a scrim — the layout, the
 * portraits and the shape of the product still read, the words no longer
 * compete.
 *
 * `focusX`/`focusY` (0-1) choose the point of the screenshot held at frame
 * centre, so a scene can sit on the adviser grid or the minutes column.
 */
export const Shot: React.FC<{
  src: string;
  focusX?: number;
  focusY?: number;
  zoomFrom?: number;
  zoomTo?: number;
  frames: number;
  scrim?: number;
  blur?: number;
}> = ({
  src,
  focusX = 0.5,
  focusY = 0.5,
  zoomFrom = 1.26,
  zoomTo = 1.36,
  frames,
  scrim = 0.76,
  blur = 7,
}) => {
  const frame = useCurrentFrame();

  // Where the focus point sits relative to the image centre, in image pixels.
  const offX = (0.5 - focusX) * SHOT_W;
  const offY = (0.5 - focusY) * SHOT_H;

  return (
    <AbsoluteFill name="Shot" style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Img
          name="Screenshot"
          src={staticFile(src)}
          style={{
            width: SHOT_W,
            height: SHOT_H,
            filter: `blur(${blur}px)`,
            scale: interpolate(frame, [0, frames], [zoomFrom, zoomTo], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EASE_IN_OUT),
              output: "perceptual-scale",
            }),
            translate: `${offX}px ${offY}px`,
          }}
        />
      </AbsoluteFill>

      {/* Scrim: pushes the screenshot back so the caption stays the subject. */}
      <AbsoluteFill style={{ background: COLOR.canvas, opacity: scrim }} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(100deg, ${COLOR.canvas} 0%, rgb(250 250 250 / 0.62) 46%, rgb(250 250 250 / 0) 100%)`,
          opacity: 0.75,
        }}
      />
    </AbsoluteFill>
  );
};
