import { AbsoluteFill, Img, Interactive, staticFile, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Sfx } from "../sound";
import { ROSTER } from "../cast";
import { TABLE_RX, TABLE_RY } from "../seat-layout";
import { COLOR, SHADOW_FLOAT } from "../theme";
import { fadeIn, land, ramp, rise } from "../motion";
import { voLocal } from "../timeline";

/**
 * The close.
 *
 * The table comes back as an outline behind the title — the shape the film
 * opened on, drawn once more and left empty for whoever is watching to fill.
 */
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const vo = voLocal("EndCard");

  const s = 2.08;
  const w = TABLE_RX * 2 * s;
  const h = TABLE_RY * 2 * s;
  const perimeter =
    Math.PI *
    (3 * (TABLE_RX + TABLE_RY) -
      Math.sqrt((3 * TABLE_RX + TABLE_RY) * (TABLE_RX + 3 * TABLE_RY))) *
    s;

  return (
    <AbsoluteFill name="End card">
      <Backdrop vignette={0.05} />

      <svg
        width={w + 8}
        height={h + 8}
        style={{ position: "absolute", left: 960 - w / 2 - 4, top: 540 - h / 2 - 4, opacity: 0.6 }}
      >
        <ellipse
          cx={w / 2 + 4}
          cy={h / 2 + 4}
          rx={w / 2}
          ry={h / 2}
          fill="none"
          stroke={COLOR.lineStrong}
          strokeWidth={2}
          strokeDasharray={perimeter}
          strokeDashoffset={perimeter * (1 - ramp(frame, 0, 46, 0, 1))}
        />
      </svg>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 38 }}>
        <div style={{ display: "flex", marginBottom: 6 }}>
          {ROSTER.slice(0, 6).map((face, i) => (
            <div
              key={face}
              style={{
                width: 92,
                height: 92,
                marginLeft: i === 0 ? 0 : -26,
                borderRadius: 9999,
                background: COLOR.surface,
                padding: 4,
                boxShadow: `0 0 0 1px ${COLOR.line}, 0 10px 26px -14px rgb(0 0 0 / 0.3)`,
                opacity: fadeIn(frame, 2 + i * 3, 14),
                scale: land(frame, 2 + i * 3, 0.72, 20),
              }}
            >
              <Img
                src={staticFile(face)}
                style={{ width: "100%", height: "100%", borderRadius: 9999, objectFit: "cover" }}
              />
            </div>
          ))}
        </div>

        <div style={{ overflow: "hidden", paddingBottom: 10 }}>
          <Interactive.Div
            name="Title"
            style={{
              fontSize: 100,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-0.042em",
              color: COLOR.ink,
              textAlign: "center",
              translate: `0px ${rise(frame, vo - 14, 130, 32)}px`,
            }}
          >
            The Best Board Meeting
            <br />
            You&rsquo;ve Ever Had
          </Interactive.Div>
        </div>

        <Interactive.Div
          name="URL"
          style={{
            marginTop: 6,
            padding: "24px 48px",
            borderRadius: 9999,
            background: COLOR.ink,
            color: COLOR.surface,
            fontSize: 42,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            boxShadow: SHADOW_FLOAT,
            opacity: fadeIn(frame, vo + 12, 16),
            scale: land(frame, vo + 12, 0.88, 22),
          }}
        >
          board-meeting.shjavokhir1.workers.dev
        </Interactive.Div>

        <div
          style={{
            marginTop: 8,
            fontSize: 30,
            fontWeight: 500,
            color: COLOR.muted,
            textAlign: "center",
            opacity: fadeIn(frame, vo + 24, 16),
          }}
        >
          Built for the OpenAI WebMCP Challenge · Next.js on Cloudflare Workers · MIT
        </div>
      </AbsoluteFill>

      {/* Provenance, stated in the product and stated here. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 52,
          textAlign: "center",
          fontSize: 23,
          lineHeight: 1.4,
          color: COLOR.faint,
          padding: "0 200px",
          opacity: fadeIn(frame, vo + 34, 18),
        }}
      >
        Advisers are simulations distilled from public interviews and writing. They are not
        endorsements by, or statements of, the people represented.
      </div>

      <Sfx name="ring" at={vo - 10} gain={0.8} />
    </AbsoluteFill>
  );
};
