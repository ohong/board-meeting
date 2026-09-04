import { Img, Interactive, staticFile, useCurrentFrame } from "remotion";
import type { Crop } from "../shots";
import { COLOR, SHADOW_FLOAT, SHOT_W, SHOT_H } from "../theme";
import { drift, fadeIn, land, rise } from "../motion";

/**
 * One element of the real UI, lifted out of a screenshot and floated at size.
 *
 * `width` is the width the crop is rendered at in the 1920 frame; everything
 * else follows from the crop's own aspect. Blowing a 416px card up to 900px is
 * what makes 13px product type legible after X has scaled the video into a
 * column — and it keeps the pixels real, which a rebuilt card would not.
 */
export const Ui: React.FC<{
  crop: Crop;
  width: number;
  at?: number;
  /** Entrance: rise from below, land with an overshoot, or just appear. */
  enter?: "rise" | "land" | "none";
  radius?: number;
  /** Off for crops that already carry the app's own card edge. */
  shadow?: boolean;
  /** Seconds-scale idle float, so the element never parks dead still. */
  floatPhase?: number;
  tilt?: number;
  name?: string;
  style?: React.CSSProperties;
}> = ({
  crop,
  width,
  at = 0,
  enter = "rise",
  radius = 20,
  shadow = true,
  floatPhase = 0,
  tilt = 0,
  name,
  style,
}) => {
  const frame = useCurrentFrame();
  const k = width / crop.w;

  return (
    <Interactive.Div
      name={name ?? "UI"}
      style={{
        width,
        height: crop.h * k,
        overflow: "hidden",
        borderRadius: radius,
        background: COLOR.surface,
        boxShadow: shadow ? `0 0 0 1px ${COLOR.line}, ${SHADOW_FLOAT}` : undefined,
        opacity: fadeIn(frame, at, 16),
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        translate:
          enter === "rise"
            ? `0px ${rise(frame, at, 44, 30) + drift(frame, 5, 190, floatPhase)}px`
            : `0px ${drift(frame, 5, 190, floatPhase)}px`,
        scale: enter === "land" ? land(frame, at, 0.86, 24) : undefined,
        ...style,
      }}
    >
      <Img
        src={staticFile(crop.src)}
        style={{
          width: SHOT_W * k,
          height: SHOT_H * k,
          maxWidth: "none",
          display: "block",
          marginLeft: -crop.x * k,
          marginTop: -crop.y * k,
        }}
      />
    </Interactive.Div>
  );
};
