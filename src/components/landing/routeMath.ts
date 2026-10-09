// Pure geometry for the hero route: two cubic segments, with an arc-length table so a point at fraction f
// lines up with where animateMotion has the rider at that fraction of the path.
export type Pt = { x: number; y: number };

const SEGS: [Pt, Pt, Pt, Pt][] = [
  [{ x: 30, y: 300 }, { x: 250, y: 300 }, { x: 330, y: 130 }, { x: 560, y: 160 }],
  [{ x: 560, y: 160 }, { x: 790, y: 190 }, { x: 900, y: 310 }, { x: 1170, y: 110 }],
];

export const ROUTE_D = `M ${SEGS[0][0].x} ${SEGS[0][0].y} C ${SEGS[0][1].x} ${SEGS[0][1].y}, ${SEGS[0][2].x} ${SEGS[0][2].y}, ${SEGS[0][3].x} ${SEGS[0][3].y} C ${SEGS[1][1].x} ${SEGS[1][1].y}, ${SEGS[1][2].x} ${SEGS[1][2].y}, ${SEGS[1][3].x} ${SEGS[1][3].y}`;

const cubic = (s: [Pt, Pt, Pt, Pt], t: number): Pt => {
  const u = 1 - t;
  return {
    x: u ** 3 * s[0].x + 3 * u * u * t * s[1].x + 3 * u * t * t * s[2].x + t ** 3 * s[3].x,
    y: u ** 3 * s[0].y + 3 * u * u * t * s[1].y + 3 * u * t * t * s[2].y + t ** 3 * s[3].y,
  };
};

const TABLE: { p: Pt; len: number }[] = (() => {
  const pts: { p: Pt; len: number }[] = [];
  let len = 0, prev: Pt | null = null;
  for (const s of SEGS) for (let i = 0; i <= 200; i++) {
    const p = cubic(s, i / 200);
    if (prev) len += Math.hypot(p.x - prev.x, p.y - prev.y);
    pts.push({ p, len }); prev = p;
  }
  return pts;
})();

export function pointAt(f: number): Pt {
  const target = TABLE[TABLE.length - 1].len * f;
  const i = TABLE.findIndex((e) => e.len >= target);
  return TABLE[Math.max(0, i)].p;
}
