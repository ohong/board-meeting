import { AbsoluteFill, Interactive, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { BottomFade } from "../components/BottomFade";
import { Ui } from "../components/Ui";
import { CROP } from "../shots";
import { Sfx } from "../sound";
import { COLOR, SHADOW_FLOAT } from "../theme";
import { fadeIn, land, rise } from "../motion";
import { voLocal } from "../timeline";

/**
 * The brief.
 *
 * The real briefing box runs off the bottom of the frame, and the three numbers
 * that decide the argument lift out of it as cards. A screenshot of a textarea
 * is not a shot; a screenshot with its own contents standing up off the page is.
 */
const STATS = [
  { figure: "$1.6M", label: "ARR" },
  { figure: "6,000", label: "free workspaces" },
  { figure: "2.3%", label: "convert in 90 days" },
];

export const Brief: React.FC = () => {
  const frame = useCurrentFrame();
  const vo = voLocal("Brief");

  return (
    <AbsoluteFill name="Brief">
      <Backdrop vignette={0.04} />

      <AbsoluteFill style={{ paddingLeft: 120, paddingTop: 110 }}>
        <Caption
          eyebrow="Step 2 · Brief the board"
          headline="Hand them the real numbers."
          delay={vo - 12}
          size={80}
          maxWidth={1200}
        />
      </AbsoluteFill>

      {/* The numbers, standing up off the brief. */}
      <AbsoluteFill
        style={{
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 40,
          flexDirection: "row",
          paddingTop: 356,
        }}
      >
        {STATS.map((stat, i) => {
          const at = 30 + i * 9;
          return (
            <Interactive.Div
              key={stat.figure}
              name={stat.label}
              style={{
                minWidth: 400,
                padding: "42px 50px 40px",
                borderRadius: 26,
                background: COLOR.surface,
                boxShadow: `0 0 0 1px ${COLOR.line}, ${SHADOW_FLOAT}`,
                opacity: fadeIn(frame, at, 14),
                translate: `0px ${rise(frame, at, 34, 26)}px`,
                scale: land(frame, at, 0.9, 22),
              }}
            >
              <div
                style={{
                  fontSize: 94,
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  color: COLOR.ink,
                  lineHeight: 1,
                }}
              >
                {stat.figure}
              </div>
              <div style={{ marginTop: 16, fontSize: 31, color: COLOR.muted }}>{stat.label}</div>
            </Interactive.Div>
          );
        })}
      </AbsoluteFill>

      {/* The brief itself, running off the bottom edge. */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ marginBottom: -58 }}>
          <Ui crop={CROP.decision} width={1440} at={8} name="The decision" radius={24} />
        </div>
      </AbsoluteFill>

      <BottomFade from={74} />

      <Sfx name="whoosh" at={4} gain={0.7} />
      {STATS.map((stat, i) => (
        <Sfx key={stat.figure} name="tap" at={30 + i * 9} gain={0.6} />
      ))}
    </AbsoluteFill>
  );
};
