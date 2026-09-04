import { AbsoluteFill, Img, Interactive, staticFile, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { Sfx } from "../sound";
import { BOARD, SHORT } from "../cast";
import { MONO } from "../fonts";
import { COLOR, SHADOW_CARD } from "../theme";
import { fadeIn, land, ramp } from "../motion";
import { voLocal } from "../timeline";

/**
 * Three positions, formed in parallel and in private.
 *
 * This is the one claim in the product that no screenshot can carry, because it
 * is about what is NOT happening: three separate agent invocations that cannot
 * see each other. So the frame is literally divided — three lanes behind two
 * rules, each filling at its own rate, each stamped "not shared". The text is
 * greeked on purpose: the film never invents words for a real person.
 */

/** Line lengths per lane, as a fraction of the lane width. */
const LINES = [
  [1, 0.94, 0.99, 0.86, 0.72],
  [0.97, 1, 0.88, 0.93, 0.55],
  [1, 0.91, 0.96, 0.8, 0.64],
];

/** How fast each lane writes; they finish at visibly different moments. */
const RATE = [1, 0.82, 0.92];
const DONE = [98, 124, 111];

const LANE_W = 470;
const GAP = 78;

export const Positions: React.FC = () => {
  const frame = useCurrentFrame();
  const vo = voLocal("Positions");

  const totalW = LANE_W * 3 + GAP * 2;
  const left = (1920 - totalW) / 2;

  return (
    <AbsoluteFill name="Positions">
      <Backdrop vignette={0.05} />

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 92 }}>
        <Caption
          eyebrow="In parallel · in private"
          headline="No groupthink."
          delay={vo - 14}
          size={78}
          align="center"
        />
      </AbsoluteFill>

      {/* The rules between the lanes: the separation IS the feature. */}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: left + LANE_W + GAP / 2 + i * (LANE_W + GAP),
            top: 330,
            width: 1,
            height: ramp(frame, 6 + i * 4, 30, 0, 668),
            background: COLOR.line,
          }}
        />
      ))}

      {BOARD.map((member, lane) => {
        const x = left + lane * (LANE_W + GAP);
        const start = 10 + lane * 6;
        const done = DONE[lane];

        return (
          <Interactive.Div
            key={member.name}
            name={SHORT[lane]}
            style={{
              position: "absolute",
              left: x,
              top: 336,
              width: LANE_W,
              opacity: fadeIn(frame, start, 16),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <Img
                src={staticFile(member.face)}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 9999,
                  objectFit: "cover",
                  background: COLOR.surface2,
                  boxShadow: `0 0 0 1px ${COLOR.line}, ${SHADOW_CARD}`,
                  scale: land(frame, start, 0.78, 22),
                }}
              />
              <div>
                <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.024em", color: COLOR.ink }}>
                  {SHORT[lane]}
                </div>
                <div style={{ marginTop: 4, fontSize: 24, color: COLOR.muted }}>{member.org}</div>
              </div>
            </div>

            <div
              style={{
                marginTop: 44,
                fontFamily: MONO,
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: COLOR.faint,
              }}
            >
              Opening position · private
            </div>

            {/* The position being written. Greeked, because the film does not
                put words in a real person's mouth to fill a shot. */}
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 24 }}>
              {LINES[lane].map((width, i) => {
                const at = start + 14 + i * 15 * RATE[lane];
                return (
                  <div
                    key={i}
                    style={{
                      height: 22,
                      borderRadius: 9999,
                      background: "#ededed",
                      width: LANE_W * width,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 9999,
                        background: "#d8d8d8",
                        width: `${ramp(frame, at, 26 / RATE[lane], 0, 100)}%`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 42,
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                height: 44,
                padding: "0 22px",
                borderRadius: 9999,
                fontSize: 23,
                fontWeight: 600,
                background: frame >= done ? COLOR.accentSoft : COLOR.surface,
                color: frame >= done ? COLOR.accentDeep : COLOR.muted,
                border: `1px solid ${frame >= done ? "transparent" : COLOR.line}`,
                scale: land(frame, done, 0.86, 16),
              }}
            >
              {frame >= done ? "✓ Position formed" : "Forming…"}
            </div>
          </Interactive.Div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 92,
          textAlign: "center",
          fontSize: 31,
          color: COLOR.muted,
          opacity: fadeIn(frame, 108, 20),
        }}
      >
        Separate agents. Members never see one another&rsquo;s private positions.
      </div>

      <Sfx name="whoosh" at={2} gain={0.6} />
      {DONE.map((at) => (
        <Sfx key={at} name="tap" at={at} gain={0.8} />
      ))}
    </AbsoluteFill>
  );
};
