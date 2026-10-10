import "server-only";
import { query } from "./db";
import { bbox, meters, validPoint } from "./geo";

// NYC 311 service requests (NYC Open Data, dataset erm2-nwe9): street-condition complaints described as potholes.
const SOURCE = "https://data.cityofnewyork.us/resource/erm2-nwe9.json";
const DAYS = 45;
// Riders must never be sent onto these. (A few "parkways" are ordinary surface streets with bike paths.)
const UNSAFE = /\b(EXPRESSWAY|EXPWY|EXPY|EXIT|RAMP|BRIDGE|TUNNEL|HIGHWAY|HWY|THRUWAY|TURNPIKE|FDR|BQE|LIE|PARKWAY|PKWY|SERVICE ROAD)\b/;
const SURFACE_PARKWAYS = /\b(OCEAN|EASTERN|PELHAM|MOSHOLU|BRONX PARK|KINGS|FORT HAMILTON) (PARKWAY|PKWY)\b/;
export const unsafeStreet = (text: string) => UNSAFE.test(text) && !SURFACE_PARKWAYS.test(text);

type Raw = {
  unique_key?: string; created_date?: string; status?: string; latitude?: string; longitude?: string; borough?: string;
  incident_address?: string; street_name?: string; cross_street_1?: string; cross_street_2?: string;
  intersection_street_1?: string; intersection_street_2?: string;
};
const title = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\s+/g, " ").trim();

function placeOf(r: Raw) {
  if (r.intersection_street_1 && r.intersection_street_2) return `${title(r.intersection_street_1)} & ${title(r.intersection_street_2)}`;
  if (r.incident_address) return title(r.incident_address);
  if (r.street_name) return title(r.street_name);
  return "Unnamed location";
}

// Pulls recent pothole complaints that carry coordinates, and refreshes the status of ones we already hold.
// Block-level complaints have no coordinates in the city's data and are skipped.
export async function syncCityReports() {
  const since = new Date(Date.now() - DAYS * 86400000).toISOString().slice(0, 19);
  const params = new URLSearchParams({
    $select: "unique_key,created_date,status,latitude,longitude,borough,incident_address,street_name,cross_street_1,cross_street_2,intersection_street_1,intersection_street_2",
    $where: `complaint_type='Street Condition' AND descriptor='Pothole' AND created_date > '${since}' AND latitude IS NOT NULL`,
    $order: "created_date DESC",
    $limit: "5000",
  });
  const res = await fetch(`${SOURCE}?${params}`, { signal: AbortSignal.timeout(40000), headers: process.env.NYC_OPEN_DATA_TOKEN ? { "X-App-Token": process.env.NYC_OPEN_DATA_TOKEN } : {} });
  if (!res.ok) throw new Error(`NYC Open Data answered ${res.status}`);
  const rows = (await res.json()) as Raw[];

  let kept = 0, skippedUnsafe = 0;
  const batch: unknown[][] = [];
  for (const r of rows) {
    const lat = Number(r.latitude), lng = Number(r.longitude);
    if (!r.unique_key || !r.created_date || !validPoint(lat, lng)) continue;
    const text = [r.incident_address, r.street_name, r.cross_street_1, r.cross_street_2, r.intersection_street_1, r.intersection_street_2].filter(Boolean).join(" ").toUpperCase();
    if (unsafeStreet(text)) { skippedUnsafe++; continue; }
    batch.push([r.unique_key, `${r.created_date}Z`.replace(/ZZ$/, "Z"), r.status ?? "Open", lat, lng, placeOf(r), title(r.borough ?? "New York")]);
    kept++;
  }
  for (let i = 0; i < batch.length; i += 200) {
    const chunk = batch.slice(i, i + 200);
    const values = chunk.map((_, j) => `($${j * 7 + 1},$${j * 7 + 2},$${j * 7 + 3},$${j * 7 + 4},$${j * 7 + 5},$${j * 7 + 6},$${j * 7 + 7})`).join(",");
    await query(
      `INSERT INTO city_reports (id, created_at, status, lat, lng, place, borough) VALUES ${values}
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, synced_at = now()`,
      chunk.flat(),
    );
  }
  // reports that have aged out of the feed and were never photographed: stop showing them. Ones with photos stay.
  await query(`UPDATE city_reports SET status='Closed' WHERE status <> 'Closed' AND photo_count = 0 AND created_at < now() - ($1 || ' days')::interval`, [String(DAYS)]);
  const [open] = await query<{ n: number; photographed: number }>("SELECT COUNT(*)::int AS n, COUNT(*) FILTER (WHERE photo_count > 0)::int AS photographed FROM city_reports WHERE status <> 'Closed'");
  return { fetched: rows.length, kept, skippedUnsafe, open: open.n, photographed: open.photographed };
}

export type CityReport = {
  id: string; lat: number; lng: number; place: string; borough: string; createdAt: string; status: string;
  photoCount: number; lastPhotoAt: string | null; kind: string | null; severity: number | null; size: string | null; lane: string | null; cover: string | null;
};
type Row = {
  id: string; lat: number; lng: number; place: string; borough: string; created_at: string | Date; status: string;
  photo_count: number; last_photo_at: string | Date | null; kind: string | null; severity: number | null; size: string | null; lane: string | null; cover: string | null;
};
const COLS = `r.id, r.lat, r.lng, r.place, r.borough, r.created_at, r.status, r.photo_count, r.last_photo_at, r.kind, r.severity, r.size, r.lane,
  (SELECT p.photo FROM city_photos p WHERE p.report_id = r.id AND p.present AND p.photo IS NOT NULL ORDER BY p.at DESC LIMIT 1) AS cover`;
const shape = (r: Row): CityReport => ({
  id: r.id, lat: r.lat, lng: r.lng, place: r.place, borough: r.borough, createdAt: new Date(r.created_at).toISOString(), status: r.status,
  photoCount: r.photo_count, lastPhotoAt: r.last_photo_at ? new Date(r.last_photo_at).toISOString() : null,
  kind: r.kind, severity: r.severity, size: r.size, lane: r.lane, cover: r.cover,
});
const OPEN = "r.status <> 'Closed'";

// Every open 311 pothole report, photographed or not.
export async function openCityReports(): Promise<CityReport[]> {
  return (await query<Row>(`SELECT ${COLS} FROM city_reports r WHERE ${OPEN} ORDER BY r.created_at DESC LIMIT 4000`)).map(shape);
}

export async function cityReportsNear(lat: number, lng: number, radiusM: number): Promise<(CityReport & { meters: number })[]> {
  const [a, b, c, d] = bbox(lat, lng, radiusM);
  const rows = await query<Row>(`SELECT ${COLS} FROM city_reports r WHERE ${OPEN} AND r.lat BETWEEN $1 AND $2 AND r.lng BETWEEN $3 AND $4`, [a, b, c, d]);
  return rows.map((r) => ({ ...shape(r), meters: meters(lat, lng, r.lat, r.lng) })).filter((r) => r.meters <= radiusM).sort((x, y) => x.meters - y.meters);
}

export type CityPhoto = { id: string; at: string; rider: string | null; photo: string | null; present: boolean; severity: number | null; note: string };

// One 311 report with its whole photo history, newest first.
export async function cityReportWithPhotos(id: string): Promise<(CityReport & { photos: CityPhoto[] }) | null> {
  const [r] = await query<Row>(`SELECT ${COLS} FROM city_reports r WHERE r.id = $1`, [id]);
  if (!r) return null;
  const photos = await query<{ id: string | number; at: string | Date; rider: string | null; photo: string | null; present: boolean; severity: number | null; note: string }>(
    "SELECT id, at, rider, photo, present, severity, note FROM city_photos WHERE report_id = $1 ORDER BY at DESC LIMIT 200", [id],
  );
  return { ...shape(r), photos: photos.map((p) => ({ id: String(p.id), at: new Date(p.at).toISOString(), rider: p.rider, photo: p.photo, present: p.present, severity: p.severity, note: p.note })) };
}

type NewPhoto = { reportId: string; rideId: string; rider: string; photo: string | null; present: boolean; severity: number | null; note: string; lat: number; lng: number };

// Adds a photo (or a "nothing found here") to a 311 report and refreshes the report's latest read of the spot.
export async function addCityPhoto(p: NewPhoto, read?: { kind: string; severity: number | null; size: string | null; lane: string }) {
  await query(
    "INSERT INTO city_photos (report_id, ride_id, rider, photo, present, severity, note, lat, lng) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [p.reportId, p.rideId, p.rider, p.photo, p.present, p.severity, p.note, p.lat, p.lng],
  );
  if (p.present && p.photo) {
    await query(
      `UPDATE city_reports SET photo_count = photo_count + 1, last_photo_at = now(),
         kind = COALESCE($2, kind), severity = COALESCE($3, severity), size = COALESCE($4, size), lane = COALESCE($5, lane) WHERE id = $1`,
      [p.reportId, read?.kind ?? null, read?.severity ?? null, read?.size ?? null, read?.lane ?? null],
    );
  } else {
    await query("UPDATE city_reports SET last_photo_at = now() WHERE id = $1", [p.reportId]);
  }
}
