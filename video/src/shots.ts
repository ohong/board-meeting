/**
 * Regions of the real UI, in the 1600x1000 CSS space the screenshots under
 * `public/shots/` were captured in.
 *
 * A whole page shown at timeline width is unreadable — 13px UI type lands at
 * about three pixels once X has scaled a 1920 frame into a column. So the film
 * never shows a page. It lifts single ELEMENTS out of the real screenshots and
 * floats them at two to three times size, sharp: one adviser card, one minutes
 * row, one recommendation block. Big enough to read, small enough to stay a
 * picture rather than a document, and unmistakably the actual product rather
 * than a rebuild.
 *
 * To re-derive a rectangle: open the screenshot, measure in CSS pixels (half the
 * pixel coordinates of the 2x file), and write it here.
 */
export interface Crop {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const el = (src: string, x: number, y: number, w: number, h: number): Crop => ({
  src,
  x,
  y,
  w,
  h,
});

export const CROP = {
  /* Board setup — one adviser card each. */
  cardEk: el("shots/selecting.png", 380, 410, 416, 118),
  cardDhh: el("shots/selecting.png", 806, 410, 416, 118),
  cardLulu: el("shots/selecting.png", 380, 541, 416, 118),
  selectFooter: el("shots/selecting.png", 352, 810, 856, 56),

  /* Brief the board. */
  decision: el("shots/briefing.png", 329, 320, 646, 184),
  yourBoard: el("shots/briefing.png", 1016, 274, 266, 290),
  startButton: el("shots/briefing.png", 1064, 720, 200, 52),

  /* Live boardroom. */
  speechCard: el("shots/discussion.png", 473, 510, 288, 120),
  interrupting: el("shots/discussion.png", 1194, 343, 386, 140),
  reactionRespond: el("shots/discussion.png", 526, 425, 140, 30),
  reactionConcerned: el("shots/discussion.png", 280, 522, 84, 30),
  liveBar: el("shots/discussion.png", 24, 62, 760, 44),

  /* The guest agent's seat. */
  codexContext: el("shots/guest.png", 1196, 404, 386, 120),
  codexAsk: el("shots/guest.png", 1196, 529, 386, 78),
  interimSynthesis: el("shots/guest.png", 1196, 662, 386, 160),
  codexConnected: el("shots/guest.png", 852, 894, 306, 76),
  joinedNote: el("shots/guest.png", 1196, 358, 386, 40),

  /* Invitation. */
  inviteBody: el("shots/invite.png", 566, 402, 472, 104),

  /* Executive memo. */
  recommendation: el("shots/readout.png", 362, 486, 876, 180),
  memoHeader: el("shots/readout.png", 340, 204, 640, 78),
  memoBoard: el("shots/readout.png", 358, 302, 790, 48),
  optionsCol: el("shots/readout.png", 358, 698, 430, 234),
  tradeoffsCol: el("shots/readout.png", 806, 700, 424, 168),
} as const;

export type CropName = keyof typeof CROP;
