import "server-only";
import { query } from "@/lib/server/db";
import type { Pothole, Severity, Sighting, SightingKind, Stats, Status } from "./types";

// The only place pages read potholes from. Everything here is real rider data from the database.
type PRow = {
  id: number; lat: number; lng: number; street: string; borough: string; direction: string; lane: string; size: string;
  severity: number | null; status: string; first_seen: string | Date; last_seen: string | Date; photo: string | null;
};
type SRow = { id: string | number; pothole_id: number; at: string | Date; rider: string; kind: string; severity: number | null; note: string };

const iso = (d: string | Date) => new Date(d).toISOString();
const sev = (n: number | null) => (n == null ? null : (Math.min(5, Math.max(1, n)) as Severity));

function shape(p: PRow, sightings: SRow[]): Pothole {
  return {
    id: String(p.id), lat: p.lat, lng: p.lng, street: p.street, borough: p.borough, direction: p.direction, lane: p.lane,
    size: (["small", "medium", "large"].includes(p.size) ? p.size : "medium") as Pothole["size"],
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
    tracked: t.tracked, open: t.open, repaired: t.repaired, ridesThisWeek: r.n, newThisWeek: t.new_week, repairedThisWeek: t.repaired_week, daily,
    worstStreets: worst.map((w) => ({ street: w.street, borough: w.borough, open: w.open, avgSeverity: w.avg })),
  };
}
