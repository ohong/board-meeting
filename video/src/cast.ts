import { memberAngles } from "./seat-layout";

/**
 * The demo board — the same three advisers the app's own fixtures seat, so the
 * film and the screenshots inside it agree with each other.
 */
export const BOARD = [
  { face: "portraits/daniel-ek.webp", name: "Daniel Ek", org: "Spotify" },
  { face: "portraits/david-heinemeier-hansson.webp", name: "David Heinemeier Hansson", org: "37signals" },
  { face: "portraits/lulu-cheng-meservey.webp", name: "Lulu Cheng Meservey", org: "Rostra" },
] as const;

/** DHH's seat label wraps at the table; the app truncates, the film shortens. */
export const SHORT = ["Daniel Ek", "David H. Hansson", "Lulu Cheng Meservey"] as const;

export const ANGLES = memberAngles(BOARD.length);

/** The full roster, for the opening and closing rosters. */
export const ROSTER = [
  "portraits/daniel-ek.webp",
  "portraits/david-heinemeier-hansson.webp",
  "portraits/lulu-cheng-meservey.webp",
  "portraits/sam-altman.webp",
  "portraits/tobi-lutke.webp",
  "portraits/rick-rubin.webp",
  "portraits/marc-andreessen.webp",
  "portraits/doug-leone.webp",
] as const;

/** Where the room lives in the frame for the table beats. */
export const STAGE = { cx: 1310, cy: 548, scale: 1.42 } as const;
