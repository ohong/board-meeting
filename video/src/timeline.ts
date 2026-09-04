import { VO_CLIPS } from "./vo";

export const FPS = 30;
const frames = (seconds: number) => Math.round(seconds * FPS);

/** Frames of cross-dissolve between beats. */
export const XFADE = 11;

/**
 * Air around each line of the read.
 *
 * The voiceover is fixed the moment it is generated, so this table is the only
 * place the film's pacing lives: `lead` is the silence a scene gets to establish
 * itself before the line starts, `tail` is what it holds afterwards. Nudge these
 * rather than scene durations — the scenes derive from them.
 */
const AIR: Record<string, { lead: number; tail: number }> = {
  "01-hook": { lead: 0.95, tail: 0.45 },
  "02-setup": { lead: 0.5, tail: 0.45 },
  "03-brief": { lead: 0.45, tail: 0.55 },
  "04-form": { lead: 0.45, tail: 0.4 },
  "05-argue": { lead: 0.4, tail: 0.75 },
  "06-tools": { lead: 0.55, tail: 0.3 },
  "07-mcp": { lead: 0.3, tail: 0.5 },
  "08-agent": { lead: 0.45, tail: 0.45 },
  "09-memo": { lead: 0.5, tail: 0.55 },
  "10-end": { lead: 0.7, tail: 1.7 },
};

/** Which scene carries which line. */
const SCENE_OF: Record<string, string> = {
  "01-hook": "Open",
  "02-setup": "Board",
  "03-brief": "Brief",
  "04-form": "Positions",
  "05-argue": "Argue",
  "06-tools": "Seat",
  "07-mcp": "Tools",
  "08-agent": "Agent",
  "09-memo": "Memo",
  "10-end": "EndCard",
};

export interface Beat {
  /** Scene id, matching the component and the Studio composition. */
  id: string;
  /** Voiceover clip under `public/audio/vo/`. */
  line: string;
  /** First frame of the scene. */
  from: number;
  /** Frames the scene is on screen, before the outgoing cross-dissolve. */
  duration: number;
  /** Absolute frame the line starts speaking. */
  voAt: number;
}

const built: Beat[] = [];
let cursor = 0;
for (const clip of VO_CLIPS) {
  const air = AIR[clip.id];
  const lead = frames(air.lead);
  const duration = lead + frames(clip.duration) + frames(air.tail);
  built.push({
    id: SCENE_OF[clip.id],
    line: clip.id,
    from: cursor,
    duration,
    voAt: cursor + lead,
  });
  cursor += duration;
}

export const BEATS = built;
export const TOTAL = cursor;

export const beat = (id: string): Beat => {
  const found = BEATS.find((b) => b.id === id);
  if (!found) throw new Error(`no beat ${id}`);
  return found;
};

/** Scene-local frame at which that scene's line starts speaking. */
export const voLocal = (id: string) => beat(id).voAt - beat(id).from;
