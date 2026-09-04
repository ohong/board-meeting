import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLOR, GRAIN_URL } from "../theme";
import { drift } from "../motion";

/**
 * The ground the whole film sits on: the product's canvas, its room gradient,
 * its grain — plus a very slow light that travels across the frame. The light is
 * the only thing here the app does not have; without it a near-white 1920 frame
 * held for four seconds looks like a still.
 */
export const Backdrop: React.FC<{ room?: boolean; vignette?: number }> = ({
  room = false,
  vignette = 0.05,
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill name="Backdrop">
      <AbsoluteFill
        style={{
          background: room
            ? `radial-gradient(120% 92% at 50% 6%, ${COLOR.room} 0%, ${COLOR.roomDeep} 52%, ${COLOR.roomWall} 100%)`
            : COLOR.canvas,
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(104deg, rgb(255 255 255 / 0) 34%, rgb(255 255 255 / 0.85) 50%, rgb(255 255 255 / 0) 66%)",
          translate: `${drift(frame, 620, 340)}px 0px`,
          opacity: room ? 0.5 : 0.75,
        }}
      />

      <AbsoluteFill
        style={{
          background: `radial-gradient(72% 62% at 50% 46%, rgb(0 0 0 / 0) 40%, rgb(0 0 0 / ${vignette * 1.9}) 100%)`,
          opacity: vignette > 0 ? 1 : 0,
        }}
      />

      <AbsoluteFill
        style={{
          backgroundImage: GRAIN_URL,
          opacity: 0.035,
          mixBlendMode: "multiply",
        }}
      />
    </AbsoluteFill>
  );
};
