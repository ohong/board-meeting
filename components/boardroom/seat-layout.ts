/**
 * Seat geometry for the elliptical table.
 *
 * Angles are degrees measured from the top of the ellipse, increasing clockwise.
 * 0 = far side (top of screen), negative = left, positive = right, 180 = the chair.
 *
 *   x = rx * sin(theta)      y = -ry * cos(theta)      (screen coordinates, y down)
 *
 * Portraits sit ON the table rim: the seat ring is only slightly larger than the
 * table itself, so every avatar overlaps the edge the way people sit at a real
 * table. The chair ("You") owns the bottom of the ring. Board members are spread
 * symmetrically about the far side across an arc that widens with headcount, so a
 * three-person board reads as a tight huddle and a six-person board fills the
 * table without a visibly empty chair. The guest agent is not on the ring: it has
 * its own card at the edge of the room.
 *
 * Seats are spaced by ARC LENGTH, not by angle: equal angular steps bunch up
 * near the ends of the major axis, which put neighbouring six-seat portraits
 * within a few pixels of each other.
 */

/** Radii of the seat ring (portrait centres sit on this ellipse). */
export const RING_RX = 300;
export const RING_RY = 176;

/** Radii of the table itself. */
export const TABLE_RX = 284;
export const TABLE_RY = 164;

/** Scene box the whole room is laid out in (scaled down on smaller viewports). */
export const SCENE_W = 800;
export const SCENE_H = 560;

/** The chair sits at the bottom of the ring. */
export const CHAIR_ANGLE = 180;

/** Total arc (degrees) the members are spread across, by headcount. */
const SPAN_BY_COUNT: Record<number, number> = {
  1: 0,
  2: 92,
  3: 132,
  4: 178,
  5: 214,
  6: 244,
};

export interface ScenePoint {
  x: number;
  y: number;
}

export function pointAt(angleDeg: number, rx = RING_RX, ry = RING_RY): ScenePoint {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: rx * Math.sin(rad), y: -ry * Math.cos(rad) };
}

/** Cumulative arc length along the ring between two angles, sampled finely. */
function arcSamples(from: number, to: number, steps: number) {
  const angles: number[] = [];
  const cumulative: number[] = [];
  let total = 0;
  let prev = pointAt(from);
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    const p = pointAt(a);
    total += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
    angles.push(a);
    cumulative.push(total);
  }
  return { angles, cumulative, total };
}

const angleCache = new Map<number, number[]>();

/** Member seat angles, evenly spaced along the table edge. */
export function memberAngles(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];
  const cached = angleCache.get(count);
  if (cached) return cached;

  const span = SPAN_BY_COUNT[count] ?? 244;
  const { angles, cumulative, total } = arcSamples(-span / 2, span / 2, 720);

  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const target = (total * i) / (count - 1);
    let j = 0;
    while (j < cumulative.length - 1 && cumulative[j] < target) j++;
    out.push(angles[j]);
  }
  angleCache.set(count, out);
  return out;
}

/** Fixed width of the live speech card, so the reserved slot never changes shape. */
export const SPEECH_CARD_W = 240;

/**
 * Where the speaker's speech card lies: on the table surface, just above the
 * table's centre, leaning slightly toward the speaker's seat. The table interior
 * is the only region no seat can ever occupy, so the card is collision free for
 * every board size while still pointing at whoever is talking.
 */
export function speechCardPoint(angleDeg: number): ScenePoint {
  const seat = pointAt(angleDeg);
  return { x: Math.max(-60, Math.min(60, seat.x * 0.22)), y: -6 };
}
