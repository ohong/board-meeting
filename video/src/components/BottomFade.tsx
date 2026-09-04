import { AbsoluteFill } from "remotion";
import { COLOR } from "../theme";

/**
 * Where a document deliberately runs off the bottom of the frame, this makes it
 * read as a choice rather than as a crop that missed.
 */
export const BottomFade: React.FC<{ from?: number }> = ({ from = 62 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(to bottom, rgb(250 250 250 / 0) ${from}%, ${COLOR.canvas} 100%)`,
    }}
  />
);
