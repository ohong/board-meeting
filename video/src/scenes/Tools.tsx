import { AbsoluteFill, Interactive, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Caption } from "../components/Caption";
import { Sfx } from "../sound";
import { MONO } from "../fonts";
import { COLOR, SHADOW_CARD, SHADOW_FLOAT } from "../theme";
import { fadeIn, land, ramp, rise } from "../motion";
import { voLocal } from "../timeline";

/**
 * Registration.
 *
 * Eight tools wired to one page — drawn as what it is, a hub: the page in the
 * middle, the tools snapping onto it one at a time. The names are the real
 * exported tool names, in the mono face the app uses for code.
 */
const TOOLS = [
  "list_board_advisers",
  "launch_board_meeting",
  "inspect_board_meeting",
  "join_board_meeting",
  "contribute_to_board_meeting",
  "address_board_member",
  "request_board_synthesis",
  "get_board_meeting_readout",
];

const HUB_X = 960;
const HUB_Y = 604;
const CHIP_W = 470;
const CHIP_H = 76;
const ROW_Y = [396, 512, 628, 744];
const FIRST = 18;
const STEP = 7;
const DONE = FIRST + STEP * TOOLS.length + 14;

export const Tools: React.FC = () => {
  const frame = useCurrentFrame();
  const vo = voLocal("Tools");

  const seat = (i: number) => {
    const right = i >= 4;
    const y = ROW_Y[i % 4];
    return {
      right,
      y,
      x: right ? HUB_X + 404 : HUB_X - 404 - CHIP_W,
      anchorX: right ? HUB_X + 266 : HUB_X - 266,
    };
  };

  return (
    <AbsoluteFill name="Tools">
      <Backdrop vignette={0.05} />

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 88 }}>
        <Caption
          eyebrow="WebMCP"
          headline="Eight site tools, live on the page."
          sub="No integration. Nothing to scrape."
          delay={vo - 12}
          size={64}
          align="center"
          maxWidth={1500}
        />
      </AbsoluteFill>

      {/* The wires. */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        {TOOLS.map((tool, i) => {
          const s = seat(i);
          const at = FIRST + i * STEP;
          const mid = (s.anchorX + (s.right ? s.x : s.x + CHIP_W)) / 2;
          const d = `M ${s.anchorX} ${HUB_Y} C ${mid} ${HUB_Y} ${mid} ${s.y + CHIP_H / 2} ${
            s.right ? s.x : s.x + CHIP_W
          } ${s.y + CHIP_H / 2}`;
          return (
            <path
              key={tool}
              d={d}
              fill="none"
              stroke={COLOR.lineStrong}
              strokeWidth={2}
              strokeDasharray={420}
              strokeDashoffset={420 * (1 - ramp(frame, at - 6, 18, 0, 1))}
              opacity={0.9}
            />
          );
        })}
      </svg>

      {/* The page. */}
      <Interactive.Div
        name="document.modelContext"
        style={{
          position: "absolute",
          left: HUB_X - 262,
          top: HUB_Y - 64,
          width: 524,
          padding: "26px 30px",
          borderRadius: 24,
          background: COLOR.ink,
          color: COLOR.surface,
          boxShadow: SHADOW_FLOAT,
          opacity: fadeIn(frame, 0, 14),
          translate: `0px ${rise(frame, 0, 30, 24)}px`,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 500, letterSpacing: "-0.01em" }}>
          document.modelContext
        </div>
        <div
          style={{
            marginTop: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            height: 44,
            padding: "0 20px",
            borderRadius: 9999,
            fontSize: 23,
            fontWeight: 600,
            background: frame >= DONE ? COLOR.live : "rgb(255 255 255 / 0.12)",
            color: COLOR.surface,
            scale: land(frame, DONE, 0.88, 16),
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 9999,
              background: frame >= DONE ? COLOR.surface : COLOR.faint,
            }}
          />
          {frame >= DONE
            ? "8 tools registered"
            : `${Math.max(0, Math.min(8, Math.floor((frame - FIRST) / STEP) + 1))} of 8 registering`}
        </div>
      </Interactive.Div>

      {/* The tools. */}
      {TOOLS.map((tool, i) => {
        const s = seat(i);
        const at = FIRST + i * STEP;
        return (
          <Interactive.Div
            key={tool}
            name={tool}
            style={{
              position: "absolute",
              left: s.x,
              top: s.y,
              width: CHIP_W,
              height: CHIP_H,
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "0 22px",
              borderRadius: 16,
              background: COLOR.surface,
              boxShadow: `0 0 0 1px ${COLOR.line}, ${SHADOW_CARD}`,
              opacity: fadeIn(frame, at, 10),
              translate: `${(s.right ? -1 : 1) * ramp(frame, at, 20, 34, 0)}px 0px`,
              scale: land(frame, at, 0.92, 18),
            }}
          >
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 9999,
                background: COLOR.liveSoft,
                color: COLOR.live,
                fontSize: 19,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ✓
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 25,
                fontWeight: 500,
                color: COLOR.ink,
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
            >
              {tool}
            </span>
          </Interactive.Div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 96,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 24,
          color: COLOR.muted,
          opacity: fadeIn(frame, DONE + 6, 18),
        }}
      >
        document.modelContext.registerTool(&hellip;)
        <span style={{ color: COLOR.faint }}> · unregistered on AbortSignal</span>
      </div>

      <Sfx name="whoosh" at={0} gain={0.5} />
      {TOOLS.map((tool, i) => (
        <Sfx key={tool} name="tap" at={FIRST + i * STEP} gain={0.32} />
      ))}
      <Sfx name="click" at={DONE} gain={0.6} />
    </AbsoluteFill>
  );
};
