import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { Ui } from "../components/Ui";
import { CROP } from "../shots";
import { Sfx } from "../sound";
import { fadeIn, land, ramp } from "../motion";
import { MONO } from "../fonts";
import { COLOR } from "../theme";
import { voLocal } from "../timeline";

/**
 * What the agent brings.
 *
 * The only beat in the film that is almost entirely real pixels: these are the
 * app's own minutes, with the guest agent's actual contributions in them. At 780
 * across, the product's 13px transcript type lands near 26 — the largest the
 * real UI can be read at, and the reason this scene is composed around a single
 * column rather than a page.
 */
const ROWS = [
  { crop: CROP.joinedNote, at: 6, radius: 12 },
  { crop: CROP.codexContext, at: 30, radius: 16 },
  { crop: CROP.codexAsk, at: 62, radius: 16 },
  { crop: CROP.interimSynthesis, at: 94, radius: 16 },
];

const COL_W = 780;

export const Agent: React.FC = () => {
  const frame = useCurrentFrame();
  const vo = voLocal("Agent");

  return (
    <AbsoluteFill name="Agent">
      <Backdrop vignette={0.04} />

      <AbsoluteFill style={{ paddingLeft: 120, justifyContent: "center" }}>
        <div style={{ width: 660 }}>
          <Caption
            eyebrow="Minutes · live"
            headline={"It brings what\nthe board\ncan't know."}
            sub="Your numbers. Your history. Into the same room."
            delay={vo - 12}
            size={74}
          />

          <div
            style={{
              marginTop: 44,
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 26px",
              borderRadius: 9999,
              background: COLOR.liveSoft,
              border: `1px solid rgb(47 125 95 / 0.28)`,
              fontFamily: MONO,
              fontSize: 23,
              color: COLOR.ink2,
              opacity: fadeIn(frame, 40, 16),
              scale: land(frame, 40, 0.9, 20),
            }}
          >
            <span style={{ width: 11, height: 11, borderRadius: 9999, background: COLOR.live }} />
            contribute_to_board_meeting
          </div>
        </div>
      </AbsoluteFill>

      {/* The minutes column, filling from the top the way the real panel does. */}
      <div
        style={{
          position: "absolute",
          left: 960,
          top: 96,
          width: COL_W,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          translate: `0px ${ramp(frame, 94, 30, 0, -34)}px`,
        }}
      >
        {ROWS.map((row) => (
          <Ui
            key={row.crop.y}
            crop={row.crop}
            width={COL_W}
            at={row.at}
            radius={row.radius}
            shadow={row.crop !== CROP.joinedNote}
            name="Minutes row"
          />
        ))}
      </div>

      {ROWS.slice(1).map((row) => (
        <Sfx key={row.at} name="pop" at={row.at} gain={0.8} />
      ))}
    </AbsoluteFill>
  );
};
