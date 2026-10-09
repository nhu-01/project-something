import "server-only";
import { query } from "@/lib/server/db";
import { meters } from "@/lib/server/geo";
import type { Pothole, Severity, Sighting, SightingKind, Stats, Status, Track } from "./types";

// The only place pages read potholes from. Everything here is real rider data from the database.
type PRow = {
  id: number; lat: number; lng: number; street: string; borough: string; direction: string; lane: string; size: string;
  severity: number | null; status: string; kind: string | null; first_seen: string | Date; last_seen: string | Date; photo: string | null;
};
type SRow = { id: string | number; pothole_id: number; at: string | Date; rider: string; kind: string; severity: number | null; note: string };

const iso = (d: string | Date) => new Date(d).toISOString();
const sev = (n: number | null) => (n == null ? null : (Math.min(5, Math.max(1, n)) as Severity));

function shape(p: PRow, sightings: SRow[]): Pothole {
  return {
    id: String(p.id), lat: p.lat, lng: p.lng, street: p.street, borough: p.borough, direction: p.direction, lane: p.lane,
    size: (["small", "medium", "large"].includes(p.size) ? p.size : "medium") as Pothole["size"],
    kind: (p.kind === "bump" || p.kind === "rough" ? p.kind : "pothole") as Pothole["kind"],
    severity: sev(p.severity), status: (p.status === "repaired" ? "repaired" : "open") as Status,
    firstSeen: iso(p.first_seen), lastSeen: iso(p.last_seen), seed: p.id * 7919, photo: p.photo ?? undefined,
    sightings: sightings.map((s): Sighting => ({ id: String(s.id), at: iso(s.at), rider: s.rider, kind: s.kind as SightingKind, severity: sev(s.severity), note: s.note })),
  };
}

export async function getPotholes(): Promise<Pothole[]> {
  const rows = await query<PRow>("SELECT * FROM potholes ORDER BY last_seen DESC LIMIT 2000");
  if (!rows.length) return [];
  const sightings = await query<SRow>("SELECT id, pothole_id, at, rider, kind, severity, note FROM sightings ORDER BY at ASC");
  const by = new Map<number, SRow[]>();
  for (const s of sightings) by.set(s.pothole_id, [...(by.get(s.pothole_id) ?? []), s]);
  return rows.map((p) => shape(p, by.get(p.id) ?? []));
}

export async function getPothole(id: string): Promise<Pothole | null> {
  if (!/^\d+$/.test(id)) return null;
  const [p] = await query<PRow>("SELECT * FROM potholes WHERE id=$1", [id]);
  if (!p) return null;
  return shape(p, await query<SRow>("SELECT id, pothole_id, at, rider, kind, severity, note FROM sightings WHERE pothole_id=$1 ORDER BY at ASC", [id]));
}

// Hide the start and end of every ride, so tracks don't point at anyone's home: 12% of the ride at each end,
// at least 25 m and at most 150 m.
const trimFor = (lengthM: number) => Math.min(150, Math.max(25, lengthM * 0.12));
const GAP_M = 400; // a jump this big between breadcrumbs is a GPS glitch or a pause (fast riders legitimately cover ~30 m/s)

// Where the app has been ridden in the last `days` days, as anonymous line segments.
export async function getTracks(days = 30): Promise<Track[]> {
  const rows = await query<{ ride_id: string; lat: number; lng: number }>(
    `SELECT ride_id, lat, lng FROM ride_points WHERE at > now() - ($1 || ' days')::interval ORDER BY ride_id, at LIMIT 400000`,
    [String(days)],
  );
  const byRide = new Map<string, [number, number][]>();
  for (const r of rows) (byRide.get(r.ride_id) ?? byRide.set(r.ride_id, []).get(r.ride_id)!).push([r.lat, r.lng]);

  const tracks: Track[] = [];
  for (const pts of byRide.values()) {
    if (pts.length < 2) continue;
    const first = pts[0], last = pts[pts.length - 1];
    const length = pts.slice(1).reduce((d, p, i) => d + meters(pts[i][0], pts[i][1], p[0], p[1]), 0);
    const trim = trimFor(length);
    const kept = pts.filter((p) => meters(p[0], p[1], first[0], first[1]) > trim && meters(p[0], p[1], last[0], last[1]) > trim);
    let seg: Track = [];
    for (const p of kept) {
      const prev = seg[seg.length - 1];
      const step = prev ? meters(prev[0], prev[1], p[0], p[1]) : Infinity;
      if (prev && step > GAP_M) { if (seg.length > 1) tracks.push(seg); seg = []; }
      else if (prev && step < 12) continue; // closer than this adds nothing you can see on the map
      seg.push(p);
    }
    if (seg.length > 1) tracks.push(seg);
  }
  return tracks;
}

export const trackMiles = (tracks: Track[]) =>
  tracks.reduce((sum, t) => sum + t.slice(1).reduce((d, p, i) => d + meters(t[i][0], t[i][1], p[0], p[1]), 0), 0) / 1609.344;

export async function getStats(): Promise<Stats> {
  const [t] = await query<{ tracked: number; open: number; repaired: number; new_week: number; repaired_week: number }>(
    `SELECT COUNT(*)::int AS tracked,
            COUNT(*) FILTER (WHERE status='open')::int AS open,
            COUNT(*) FILTER (WHERE status='repaired')::int AS repaired,
            COUNT(*) FILTER (WHERE first_seen > now() - interval '7 days')::int AS new_week,
            COUNT(*) FILTER (WHERE status='repaired' AND last_seen > now() - interval '7 days')::int AS repaired_week
     FROM potholes`,
  );
  const [r] = await query<{ n: number }>("SELECT COUNT(*)::int AS n FROM rides WHERE started_at > now() - interval '7 days'");
  const days = await query<{ day: string | Date; found: number; repaired: number }>(
    `SELECT date_trunc('day', at) AS day,
            COUNT(*) FILTER (WHERE kind='first_seen')::int AS found,
            COUNT(*) FILTER (WHERE kind='repaired')::int AS repaired
     FROM sightings WHERE at > now() - interval '14 days' GROUP BY 1`,
  );
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const byDay = new Map(days.map((d) => [dayKey(new Date(d.day)), d]));
  const daily = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const hit = byDay.get(dayKey(d));
    return { day: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }), found: hit?.found ?? 0, repaired: hit?.repaired ?? 0 };
  });
  const worst = await query<{ street: string; borough: string; open: number; avg: number }>(
    `SELECT street, MIN(borough) AS borough, COUNT(*)::int AS open, AVG(severity)::float AS avg
     FROM potholes WHERE status='open' AND severity IS NOT NULL GROUP BY street ORDER BY AVG(severity) * COUNT(*) DESC LIMIT 5`,
  );
  return {
    tracked: t.tracked, open: t.open, repaired: t.repaired, ridesThisWeek: r.n, milesRidden: trackMiles(await getTracks(3650)), newThisWeek: t.new_week, repairedThisWeek: t.repaired_week, daily,
    worstStreets: worst.map((w) => ({ street: w.street, borough: w.borough, open: w.open, avgSeverity: w.avg })),
  };
}
