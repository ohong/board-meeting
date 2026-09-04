import { Audio, Sequence, staticFile } from "remotion";

/**
 * The sound design is deliberately sparse. The product is a quiet, typographic
 * thing; a launch film that clicked and popped on every entrance would be a
 * different product. These land on real events only — a seat taken, a position
 * flipping, the room opening, the memo closing — and everything sits well under
 * the voice.
 */
export type SfxName =
  | "whoosh"
  | "tap"
  | "click"
  | "pop"
  | "ring"
  | "boom"
  | "unlock";

const LEVEL: Record<SfxName, number> = {
  whoosh: 0.22,
  tap: 0.3,
  click: 0.5,
  pop: 0.24,
  ring: 0.34,
  boom: 0.16,
  unlock: 0.2,
};

export const Sfx: React.FC<{
  name: SfxName;
  /** Frame, relative to the enclosing sequence. */
  at: number;
  /** Multiplier on the sound's default level. */
  gain?: number;
}> = ({ name, at, gain = 1 }) => (
  <Sequence from={at} name={`sfx:${name}`} layout="none">
    <Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={() => LEVEL[name] * gain} />
  </Sequence>
);
