/**
 * The video borrows the product's design tokens verbatim, so a frame of the
 * video and a frame of the app read as the same object. Values are copied from
 * `app/globals.css` in the board-meeting repo.
 */

export const COLOR = {
  canvas: "#fafafa",
  surface: "#ffffff",
  surface2: "#f5f5f5",
  surface3: "#ebebeb",
  line: "#e5e5e5",
  lineStrong: "#d4d4d4",

  ink: "#292929",
  ink2: "#5d5d5d",
  muted: "#757575",
  faint: "#9e9e9e",

  accentDeep: "#111111",
  accentSoft: "#f0f0f0",

  live: "#2f7d5f",
  liveSoft: "#eaf3ef",
  warn: "#3f6bd8",
  dissent: "#b3261e",
  dissentSoft: "#fbeeed",

  room: "#e6e6e6",
  roomDeep: "#dadada",
  roomWall: "#cbcbcb",
  tableLit: "#ffffff",
  tableShade: "#ebebeb",
} as const;

/** The product's two entrance curves, as Remotion easings. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_POP = [0.34, 1.4, 0.64, 1] as const;

export const SHADOW_CARD =
  "0 1px 2px rgb(0 0 0 / 0.04), 0 18px 40px -22px rgb(0 0 0 / 0.16)";
export const SHADOW_FLOAT =
  "0 2px 6px rgb(0 0 0 / 0.06), 0 24px 56px -20px rgb(0 0 0 / 0.22)";
export const SHADOW_SCREEN =
  "0 4px 12px rgb(0 0 0 / 0.05), 0 60px 120px -40px rgb(0 0 0 / 0.32)";

/** Grain, lifted from the `room-grain` utility. */
export const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Screenshots were captured at a 1600x1000 CSS viewport (2x DPR). Every overlay
 * in a screenshot scene is positioned in that coordinate space, so the frame
 * scales as one unit.
 */
export const SHOT_W = 1600;
export const SHOT_H = 1000;
