import "server-only";
import { query } from "@/lib/server/db";
import type { CityReport, CityReportDetail, Pothole, Severity, Sighting, SightingKind, Stats, Status } from "./types";

// The only place pages read potholes from. Everything here is real rider data from the database.
type PRow = {
  id: number; lat: number; lng: number; street: string; borough: string; direction: string; lane: string; size: string;
  severity: number | null; status: string; kind: string | null; first_seen: string | Date; last_seen: string | Date; photo: string | null;
};
type SRow = { id: string | number; pothole_id: number; at: string | Date; rider: string; kind: string; severity: number | null; note: string; photo: string | null };

const iso = (d: string | Date) => new Date(d).toISOString();
const sev = (n: number | null) => (n == null ? null : (Math.min(5, Math.max(1, n)) as Severity));

function shape(p: PRow, sightings: SRow[]): Pothole {
  return {
    id: String(p.id), lat: p.lat, lng: p.lng, street: p.street, borough: p.borough, direction: p.direction, lane: p.lane,
    size: (["small", "medium", "large"].includes(p.size) ? p.size : "medium") as Pothole["size"],
    kind: (p.kind === "bump" || p.kind === "rough" ? p.kind : "pothole") as Pothole["kind"],
    severity: sev(p.severity), status: (p.status === "repaired" ? "repaired" : "open") as Status,
    firstSeen: iso(p.first_seen), lastSeen: iso(p.last_seen), seed: p.id * 7919, photo: p.photo ?? undefined,
    sightings: sightings.map((s): Sighting => ({ id: String(s.id), at: iso(s.at), rider: s.rider, kind: s.kind as SightingKind, severity: sev(s.severity), note: s.note, photo: s.photo ?? undefined })),
  };
}

// Real rider frames, newest-most-ridden first, for the walkthrough and demo ride screens.
export async function getDemoPhotos(max = 6): Promise<string[]> {
  const list = await getPotholes();
  return list
    .filter((p) => p.photo || p.sightings.some((s) => s.photo))
    .sort((a, b) => b.sightings.length - a.sightings.length)
    .flatMap((p) => [p.photo, ...p.sightings.map((s) => s.photo)])
    .filter((u): u is string => Boolean(u))
    .slice(0, max);
}

export async function getPotholes(): Promise<Pothole[]> {
  const rows = await query<PRow>("SELECT * FROM potholes WHERE merged_into IS NULL ORDER BY last_seen DESC LIMIT 2000");
  if (!rows.length) return [];
  const sightings = await query<SRow>("SELECT id, pothole_id, at, rider, kind, severity, note, photo FROM sightings ORDER BY at ASC");
  const by = new Map<number, SRow[]>();
  for (const s of sightings) by.set(s.pothole_id, [...(by.get(s.pothole_id) ?? []), s]);
  return rows.map((p) => shape(p, by.get(p.id) ?? []));
}

export async function getPothole(id: string): Promise<Pothole | null> {
  if (!/^\d+$/.test(id)) return null;
  let [p] = await query<PRow & { merged_into: number | null }>("SELECT * FROM potholes WHERE id=$1", [id]);
  // a duplicate that was folded into another hazard: show the one it became part of
  if (p?.merged_into) [p] = await query<PRow & { merged_into: number | null }>("SELECT * FROM potholes WHERE id=$1", [p.merged_into]);
  if (!p) return null;
  return shape(p, await query<SRow>("SELECT id, pothole_id, at, rider, kind, severity, note, photo FROM sightings WHERE pothole_id=$1 ORDER BY at ASC", [p.id]));
}

type CityLike = Awaited<ReturnType<typeof import("@/lib/server/city").openCityReports>>[number];
const asCity = (r: CityLike): CityReport => ({ ...r, kind: r.kind === "bump" || r.kind === "rough" ? r.kind : r.kind ? "pothole" : null, severity: sev(r.severity), size: r.size === "small" || r.size === "medium" || r.size === "large" ? r.size : null });

// Every open 311 pothole report, with how many rider photos it has.
export async function getCityReports(): Promise<CityReport[]> {
  const { openCityReports } = await import("@/lib/server/city");
  return (await openCityReports()).map(asCity);
}

// One 311 report with its whole photo history.
export async function getCityReport(id: string): Promise<CityReportDetail | null> {
  if (!/^\d{5,12}$/.test(id)) return null;
  const { cityReportWithPhotos } = await import("@/lib/server/city");
  const r = await cityReportWithPhotos(id);
  return r ? { ...asCity(r), photos: r.photos.map((p) => ({ ...p, severity: sev(p.severity) })) } : null;
}

export async function getStats(): Promise<Stats> {
  const [t] = await query<{ tracked: number; new_week: number }>(
    `SELECT COUNT(*)::int AS tracked, COUNT(*) FILTER (WHERE first_seen > now() - interval '7 days')::int AS new_week FROM potholes WHERE merged_into IS NULL`,
  );
  const [r] = await query<{ n: number }>("SELECT COUNT(DISTINCT ride_id)::int AS n FROM city_photos WHERE at > now() - interval '7 days'");
  const [c] = await query<{ spots: number; photographed: number; photos: number }>(
    "SELECT COUNT(*)::int AS spots, COUNT(*) FILTER (WHERE photo_count > 0)::int AS photographed, COALESCE(SUM(photo_count),0)::int AS photos FROM city_reports WHERE status <> 'Closed'");

  const photoDays = await query<{ day: string | Date; n: number }>(
    "SELECT date_trunc('day', at) AS day, COUNT(*)::int AS n FROM city_photos WHERE present AND photo IS NOT NULL AND at > now() - interval '14 days' GROUP BY 1");
  const reportDays = await query<{ day: string | Date; n: number }>(
    "SELECT date_trunc('day', first_seen) AS day, COUNT(*)::int AS n FROM potholes WHERE merged_into IS NULL AND first_seen > now() - interval '14 days' GROUP BY 1");
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const p = new Map(photoDays.map((d) => [key(new Date(d.day)), d.n]));
  const rp = new Map(reportDays.map((d) => [key(new Date(d.day)), d.n]));
  const daily = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    return { day: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }), photos: p.get(key(d)) ?? 0, reports: rp.get(key(d)) ?? 0 };
  });

  const top = await query<{ id: string; place: string; borough: string; photos: number }>(
    "SELECT id, place, borough, photo_count AS photos FROM city_reports WHERE status <> 'Closed' AND photo_count > 0 ORDER BY photo_count DESC, last_photo_at DESC LIMIT 5");
  const latest = await query<{ id: string; place: string; borough: string; at: string | Date }>(
    "SELECT id, place, borough, last_photo_at AS at FROM city_reports WHERE last_photo_at IS NOT NULL ORDER BY last_photo_at DESC LIMIT 5");
  return {
    tracked: t.tracked, newThisWeek: t.new_week, ridesThisWeek: r.n, citySpots: c.spots, cityPhotographed: c.photographed, cityPhotos: c.photos, daily,
    topSpots: top, latest: latest.map((l) => ({ ...l, at: new Date(l.at).toISOString() })),
  };
}
