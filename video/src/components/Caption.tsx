import { useCurrentFrame } from "remotion";
import { COLOR } from "../theme";
import { fadeIn, rise } from "../motion";

/**
 * The one block of native-scale type per beat.
 *
 * Each line rises out from behind a mask rather than fading in place: at
 * timeline size a cross-fade on 78px type reads as a slow blur, where a wipe
 * reads as a cut. `headline` may contain \n; every line gets its own mask and
 * its own two-frame offset, which is what gives the reveal its cadence.
 */
export const Caption: React.FC<{
  eyebrow?: string;
  headline: string;
  sub?: string;
  delay?: number;
  align?: "left" | "center";
  size?: number;
  maxWidth?: number;
}> = ({
  eyebrow,
  headline,
  sub,
  delay = 0,
  align = "left",
  size = 78,
  maxWidth = 1020,
}) => {
  const frame = useCurrentFrame();
  const lines = headline.split("\n");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        textAlign: align,
        maxWidth,
      }}
    >
      {eyebrow ? (
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: COLOR.faint,
            marginBottom: 26,
            opacity: fadeIn(frame, delay, 14),
            translate: `0px ${rise(frame, delay, 14, 20)}px`,
          }}
        >
          {eyebrow}
        </div>
      ) : null}

      {lines.map((line, i) => (
        <div
          key={line + i}
          style={{ overflow: "hidden", paddingBottom: size * 0.06 }}
        >
          <div
            style={{
              fontSize: size,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.035em",
              color: COLOR.ink,
              translate: `0px ${rise(frame, delay + 4 + i * 5, size * 1.15, 30)}px`,
            }}
          >
            {line}
          </div>
        </div>
      ))}

      {sub ? (
        <div
          style={{
            marginTop: 24,
            fontSize: 38,
            lineHeight: 1.35,
            letterSpacing: "-0.018em",
            color: COLOR.muted,
            opacity: fadeIn(frame, delay + 12 + lines.length * 5, 18),
            translate: `0px ${rise(frame, delay + 12 + lines.length * 5, 20, 26)}px`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
