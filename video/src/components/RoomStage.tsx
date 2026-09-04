import { Img, Interactive, staticFile, useCurrentFrame } from "remotion";
import {
  CHAIR_ANGLE,
  TABLE_RX,
  TABLE_RY,
  pointAt,
  spotlightPoint,
} from "../seat-layout";
import { COLOR } from "../theme";
import { drift, fadeIn, land, ramp } from "../motion";
import { ChairIcon } from "./ChairIcon";

/**
 * The boardroom table, at film scale.
 *
 * Geometry is the product's own — `seat-layout.ts` is a copy of the app's, so
 * the ellipse, the seat arc and the pool of light are the same numbers the
 * running app uses. Only the typography is re-set: the app's 13px seat labels
 * would be three pixels wide once X has scaled a 1920 frame into a column, so
 * the layout is scaled by `scale` while the type stays at film size.
 */

export type Tone = "ink" | "warn" | "live" | "quiet" | "bad";

const TONE: Record<Tone, { bg: string; fg: string; border: string }> = {
  ink: { bg: COLOR.ink, fg: COLOR.surface, border: "transparent" },
  warn: { bg: "rgb(63 107 216 / 0.12)", fg: COLOR.ink2, border: "rgb(63 107 216 / 0.4)" },
  live: { bg: COLOR.liveSoft, fg: COLOR.ink2, border: "rgb(47 125 95 / 0.3)" },
  quiet: { bg: COLOR.surface, fg: COLOR.muted, border: COLOR.line },
  bad: { bg: COLOR.dissentSoft, fg: COLOR.dissent, border: "rgb(179 38 30 / 0.3)" },
};

export interface Seat {
  face: string;
  name: string;
  org: string;
  angle: number;
  /** Frame this seat lands on the ring. */
  at: number;
  pill?: { label: string; tone: Tone; at: number; dots?: boolean };
  speaking?: boolean;
  dim?: boolean;
}

/** Animated ellipsis, matching the app's "forming a position" seat state. */
const Dots: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: 9999,
            background: color,
            opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((frame / 14 - i * 0.22) * Math.PI * 2)),
          }}
        />
      ))}
    </span>
  );
};

export const RoomStage: React.FC<{
  seats: Seat[];
  scale: number;
  cx: number;
  cy: number;
  /** Frame the table starts drawing itself; omit for an already-set table. */
  drawAt?: number;
  /** Angles to mark with an empty, breathing seat ring. */
  empty?: number[];
  emptyAt?: number;
  spotlightAngle?: number | null;
  spotlightAt?: number;
  /** A rebuttal, drawn across the table from one seat angle to another. */
  arc?: { from: number; to: number; at: number } | null;
  chairLabel?: string;
  /** Rendered in stage coordinates, on top of the table. */
  children?: React.ReactNode;
}> = ({
  seats,
  scale: s,
  cx,
  cy,
  drawAt,
  empty = [],
  emptyAt = 0,
  spotlightAngle = null,
  spotlightAt = 0,
  arc = null,
  chairLabel = "You",
  children,
}) => {
  const frame = useCurrentFrame();

  const PORTRAIT = 96;
  const LABEL_W = 224;

  const tableW = TABLE_RX * 2 * s;
  const tableH = TABLE_RY * 2 * s;
  const chair = pointAt(CHAIR_ANGLE);

  // The table is drawn as an outline first and then filled, so the room reads as
  // being set rather than cutting in already built.
  const draw = drawAt === undefined ? 1 : ramp(frame, drawAt, 34, 0, 1);
  const fill = drawAt === undefined ? 1 : ramp(frame, drawAt + 22, 26, 0, 1);
  const perimeter = Math.PI * (3 * (TABLE_RX + TABLE_RY) - Math.sqrt((3 * TABLE_RX + TABLE_RY) * (TABLE_RX + 3 * TABLE_RY))) * s;

  const light = spotlightAngle === null ? null : spotlightPoint(spotlightAngle);
  const arcFrom = arc ? pointAt(arc.from) : null;
  const arcTo = arc ? pointAt(arc.to) : null;

  return (
    <Interactive.Div
      name="Room"
      style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
    >
      {/* The table surface, lit from above so the near edge falls into shade. */}
      <div
        style={{
          position: "absolute",
          left: cx - tableW / 2,
          top: cy - tableH / 2,
          width: tableW,
          height: tableH,
          borderRadius: "50%",
          opacity: fill,
          background: `linear-gradient(to bottom, ${COLOR.tableLit} 0%, #f4f4f4 58%, ${COLOR.tableShade} 100%)`,
          boxShadow:
            "inset 0 0 0 1px #d6d6d6, inset 0 3px 0 0 rgb(255 255 255 / 0.9), inset 0 -26px 46px -28px rgb(0 0 0 / 0.16), 0 3px 0 0 rgb(255 255 255 / 0.5), 0 38px 64px -36px rgb(0 0 0 / 0.2), 0 86px 130px -70px rgb(0 0 0 / 0.18)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 26 * s,
            borderRadius: "50%",
            boxShadow: "inset 0 0 0 1px #d6d6d6",
          }}
        />
      </div>

      {/* The outline that precedes it. */}
      {drawAt === undefined ? null : (
        <svg
          width={tableW + 8}
          height={tableH + 8}
          style={{ position: "absolute", left: cx - tableW / 2 - 4, top: cy - tableH / 2 - 4 }}
        >
          <ellipse
            cx={tableW / 2 + 4}
            cy={tableH / 2 + 4}
            rx={tableW / 2}
            ry={tableH / 2}
            fill="none"
            stroke={COLOR.lineStrong}
            strokeWidth={2}
            strokeDasharray={perimeter}
            strokeDashoffset={perimeter * (1 - draw)}
            opacity={1 - fill}
          />
        </svg>
      )}

      {/* The pool of light in front of whoever holds the floor. */}
      {light ? (
        <div
          style={{
            position: "absolute",
            left: cx + light.x * s - 200 * s,
            top: cy + light.y * s - 140 * s,
            width: 400 * s,
            height: 280 * s,
            borderRadius: "50%",
            opacity: fadeIn(frame, spotlightAt, 18),
            background:
              "radial-gradient(closest-side, rgb(255 255 255 / 0.98) 0%, rgb(255 255 255 / 0.5) 34%, rgb(255 255 255 / 0) 70%)",
          }}
        />
      ) : null}

      {/* A rebuttal, drawn seat to seat. The product's whole claim is that these
          people argue with each other rather than each answering the chair, and
          this is the one thing a static screenshot cannot show. */}
      {arc && arcFrom && arcTo ? (
        <ArcBetween
          x1={cx + arcFrom.x * s}
          y1={cy + arcFrom.y * s}
          x2={cx + arcTo.x * s}
          y2={cy + arcTo.y * s}
          cyTable={cy}
          at={arc.at}
        />
      ) : null}

      {/* Seats not yet taken. */}
      {empty.map((angle) => {
        const p = pointAt(angle);
        return (
          <div
            key={`empty-${angle}`}
            style={{
              position: "absolute",
              left: cx + p.x * s - PORTRAIT / 2,
              top: cy + p.y * s - PORTRAIT / 2,
              width: PORTRAIT,
              height: PORTRAIT,
              borderRadius: 9999,
              border: "3px dashed rgb(0 0 0 / 0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgb(0 0 0 / 0.26)",
              opacity:
                fadeIn(frame, emptyAt, 20) *
                (0.72 + 0.28 * Math.sin((frame / 46 + angle / 90) * Math.PI * 2)),
            }}
          >
            <ChairIcon size={34} />
          </div>
        );
      })}

      {seats.map((seat) => {
        const p = pointAt(seat.angle);
        // Seats fly in along the ring normal, from outside the room.
        const away = land(frame, seat.at, 0, 26);
        return (
          <div
            key={seat.name}
            style={{
              position: "absolute",
              left: cx + p.x * s * (2 - away) - LABEL_W / 2,
              top: cy + p.y * s * (2 - away) - PORTRAIT / 2,
              width: LABEL_W,
              textAlign: "center",
              opacity: fadeIn(frame, seat.at, 14),
              translate: `0px ${drift(frame, 3, 210, seat.angle / 260)}px`,
            }}
          >
            <div style={{ position: "relative", width: PORTRAIT, height: PORTRAIT, margin: "0 auto" }}>
              <div
                style={{
                  width: PORTRAIT,
                  height: PORTRAIT,
                  borderRadius: 9999,
                  background: COLOR.surface,
                  padding: 4,
                  boxShadow: seat.speaking
                    ? `0 0 0 3px ${COLOR.ink}, 0 18px 42px -12px rgb(0 0 0 / 0.34)`
                    : `0 0 0 1px ${COLOR.line}, 0 9px 26px -11px rgb(0 0 0 / 0.22)`,
                  opacity: seat.dim ? 0.55 : 1,
                }}
              >
                <Img
                  src={staticFile(seat.face)}
                  style={{ width: "100%", height: "100%", borderRadius: 9999, objectFit: "cover" }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 4,
                  bottom: 4,
                  width: 18,
                  height: 18,
                  borderRadius: 9999,
                  background: COLOR.live,
                  boxShadow: `0 0 0 3px ${COLOR.surface}`,
                }}
              />
            </div>

            {/* Fixed height: "Lulu Cheng Meservey" wraps to two lines and would
                otherwise push her reaction pill out of line with the others. */}
            <div style={{ height: 96, marginTop: 12 }}>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  lineHeight: 1.12,
                  letterSpacing: "-0.022em",
                  color: seat.dim ? COLOR.muted : COLOR.ink,
                }}
              >
                {seat.name}
              </div>
              <div style={{ marginTop: 3, fontSize: 22, color: seat.dim ? COLOR.faint : COLOR.muted }}>
                {seat.org}
              </div>
            </div>

            <div style={{ height: 46, display: "flex", justifyContent: "center" }}>
              {seat.pill ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    height: 40,
                    padding: "0 18px",
                    borderRadius: 9999,
                    fontSize: 21,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    background: TONE[seat.pill.tone].bg,
                    color: TONE[seat.pill.tone].fg,
                    border: `1px solid ${TONE[seat.pill.tone].border}`,
                    opacity: fadeIn(frame, seat.pill.at, 10),
                    scale: land(frame, seat.pill.at, 0.7, 16),
                  }}
                >
                  {seat.pill.dots ? <Dots color={TONE[seat.pill.tone].fg} /> : null}
                  {seat.pill.label}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}

      {/* The chair. Always the bottom of the ring, always the human. */}
      <div
        style={{
          position: "absolute",
          left: cx + chair.x * s - LABEL_W / 2,
          top: cy + chair.y * s - 48,
          width: LABEL_W,
          textAlign: "center",
          opacity: fill,
        }}
      >
        <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 9999,
              background: COLOR.surface,
              padding: 4,
              boxShadow: `0 0 0 1px ${COLOR.line}, 0 9px 26px -11px rgb(0 0 0 / 0.22)`,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 9999,
                background: COLOR.accentSoft,
                color: COLOR.accentDeep,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChairIcon size={30} />
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              right: 4,
              bottom: 4,
              width: 18,
              height: 18,
              borderRadius: 9999,
              background: COLOR.live,
              boxShadow: `0 0 0 3px ${COLOR.surface}`,
            }}
          />
        </div>
        <div style={{ marginTop: 12, fontSize: 26, fontWeight: 600, color: COLOR.ink }}>
          {chairLabel}
        </div>
        <div style={{ marginTop: 3, fontSize: 22, color: COLOR.muted }}>Board Chair</div>
      </div>

      {children}
    </Interactive.Div>
  );
};

/** The rebuttal curve, bowed across the table and arriving with a head. */
const ArcBetween: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cyTable: number;
  at: number;
}> = ({ x1, y1, x2, y2, cyTable, at }) => {
  const frame = useCurrentFrame();
  const progress = ramp(frame, at, 26, 0, 1);
  const fade = fadeIn(frame, at, 8);

  // Bow the curve down onto the table rather than straight across the faces.
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const cx = mx;
  const cy = my + (cyTable - my) * 0.9;

  const path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  const length = Math.hypot(cx - x1, cy - y1) + Math.hypot(x2 - cx, y2 - cy);

  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
    >
      <path
        d={path}
        fill="none"
        stroke={COLOR.ink}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - progress)}
        opacity={fade * 0.8}
      />
      <circle
        cx={x2}
        cy={y2}
        r={9}
        fill={COLOR.ink}
        opacity={progress > 0.96 ? fade * 0.8 : 0}
      />
    </svg>
  );
};
