import { Easing, interpolate } from "remotion";
import { EASE_OUT, EASE_POP } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const out = Easing.bezier(...EASE_OUT);
const pop = Easing.bezier(...EASE_POP);

/** 0 → 1 over `len` frames from `at`, on the product's entrance curve. */
export const fadeIn = (frame: number, at: number, len = 16) =>
  interpolate(frame, [at, at + len], [0, 1], { ...clamp, easing: out });

/** 1 → 0 over `len` frames ending at `at`. */
export const fadeOut = (frame: number, at: number, len = 12) =>
  interpolate(frame, [at, at + len], [1, 0], { ...clamp, easing: out });

/** Distance travelled, in px, for a thing sliding into place. */
export const rise = (frame: number, at: number, from = 28, len = 26) =>
  interpolate(frame, [at, at + len], [from, 0], { ...clamp, easing: out });

/** Scale that overshoots once and settles, for anything that lands. */
export const land = (frame: number, at: number, from = 0.8, len = 22) =>
  interpolate(frame, [at, at + len], [from, 1], { ...clamp, easing: pop });

/** Plain eased ramp between two values. */
export const ramp = (
  frame: number,
  at: number,
  len: number,
  a: number,
  b: number,
) => interpolate(frame, [at, at + len], [a, b], { ...clamp, easing: out });

/**
 * A slow drift, so nothing in the frame is ever perfectly still. Product films
 * read as slideshows the moment an element parks on an exact pixel and stays
 * there; a fraction of a pixel per frame is enough to stop that.
 */
export const drift = (frame: number, amplitude: number, period: number, phase = 0) =>
  Math.sin((frame / period + phase) * Math.PI * 2) * amplitude;
