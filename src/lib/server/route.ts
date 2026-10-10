import "server-only";
import { query } from "./db";
import { bbox, meters } from "./geo";

export type LatLng = [number, number];
export type RouteHazard = { id: string; kind: string; street: string; lane: string; severity: number; alongM: number };

// A cycling route from a public OpenStreetMap routing server. If it's unavailable we fall back to a straight line,
// which is only a rough guide (and is labelled as such in the UI).
export async function bikeRoute(points: LatLng[]): Promise<LatLng[] | null> {
  try {
    const url = `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${points.map((p) => `${p[1]},${p[0]}`).join(";")}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { "user-agent": "spotholes.nyc (hackathon project)" } });
    if (!res.ok) return null;
    const coords = (await res.json())?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
    return coords && coords.length > 1 ? coords.map(([lng, lat]) => [lat, lng] as LatLng) : null;
  } catch {
    return null;
  }
}

// Distance from p to segment a-b in meters, and how far along the segment the closest point is (0..1).
function toSegment(p: LatLng, a: LatLng, b: LatLng) {
  const kx = 111_320 * Math.cos((p[0] * Math.PI) / 180), ky = 111_320;
  const ax = (a[1] - p[1]) * kx, ay = (a[0] - p[0]) * ky, bx = (b[1] - p[1]) * kx, by = (b[0] - p[0]) * ky;
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  const t = len2 ? Math.min(1, Math.max(0, -(ax * dx + ay * dy) / len2)) : 0;
  return { d: Math.hypot(ax + t * dx, ay + t * dy), t };
}

export async function hazardsOnTheWay(from: LatLng, to: LatLng) {
  const routed = await bikeRoute([from, to]);
  // very long routes come back with thousands of points; thin them so matching stays fast
  const full = routed ?? [from, to];
  const step = Math.max(1, Math.ceil(full.length / 1500));
  const line = full.filter((_, i) => i % step === 0 || i === full.length - 1);
  const corridorM = routed ? 30 : 180; // a real route can be tight; a straight line has to be generous

  const lats = line.map((p) => p[0]), lngs = line.map((p) => p[1]);
  const [minLat, , minLng] = bbox(Math.min(...lats), Math.min(...lngs), corridorM);
  const [, maxLat, , maxLng] = bbox(Math.max(...lats), Math.max(...lngs), corridorM);
  const rows = await query<{ id: number; lat: number; lng: number; kind: string; street: string; lane: string; severity: number | null }>(
    "SELECT id, lat, lng, kind, street, lane, severity FROM potholes WHERE status='open' AND merged_into IS NULL AND lat BETWEEN $1 AND $2 AND lng BETWEEN $3 AND $4 LIMIT 20000",
    [minLat, maxLat, minLng, maxLng],
  );

  const cum: number[] = [0];
  for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + meters(line[i - 1][0], line[i - 1][1], line[i][0], line[i][1]));

  const hazards: RouteHazard[] = [];
  for (const r of rows) {
    let best = { d: Infinity, along: 0 };
    for (let i = 1; i < line.length; i++) {
      const s = toSegment([r.lat, r.lng], line[i - 1], line[i]);
      if (s.d < best.d) best = { d: s.d, along: cum[i - 1] + s.t * (cum[i] - cum[i - 1]) };
    }
    if (best.d <= corridorM) hazards.push({ id: String(r.id), kind: r.kind, street: r.street, lane: r.lane, severity: r.severity ?? 2, alongM: Math.round(best.along) });
  }
  hazards.sort((a, b) => a.alongM - b.alongM);
  return { hazards, distanceM: Math.round(cum[cum.length - 1]), routed: Boolean(routed) };
}

const STOPS = 5;

// A short loop of nearby 311 reports nobody has photographed yet: nearest first, then nearest to that one, and so on.
export async function photoMission(from: LatLng) {
  const { cityReportsNear } = await import("./city");
  const pool = (await cityReportsNear(from[0], from[1], 5000)).slice(0, 60);
  const stops: typeof pool = [];
  let here = from;
  while (stops.length < STOPS && pool.length) {
    pool.sort((a, b) => meters(here[0], here[1], a.lat, a.lng) - meters(here[0], here[1], b.lat, b.lng));
    const next = pool.shift()!;
    // two reports for the same corner would be one photo stop
    if (stops.some((s) => meters(s.lat, s.lng, next.lat, next.lng) < 60)) continue;
    stops.push(next); here = [next.lat, next.lng];
  }
  if (!stops.length) return { stops: [], line: [] as LatLng[], distanceM: 0, routed: false };
  const points: LatLng[] = [from, ...stops.map((s) => [s.lat, s.lng] as LatLng)];
  const routed = await bikeRoute(points);
  const line = routed ?? points;
  const distanceM = Math.round(line.slice(1).reduce((d, p, i) => d + meters(line[i][0], line[i][1], p[0], p[1]), 0));
  return { stops: stops.map(({ meters: _m, ...s }) => { void _m; return s; }), line, distanceM, routed: Boolean(routed) };
}
