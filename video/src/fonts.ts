import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

/**
 * Inter is the product's cross-platform stand-in for SF Pro (see the type note
 * in `app/globals.css`), so the video and the app set the same face.
 */
export const { fontFamily: SANS } = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

/** Tool names are code; they are set in the one mono face. */
export const { fontFamily: MONO } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
