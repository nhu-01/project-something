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
  // anything older than the window that we still hold as open has aged out of the feed: stop showing it
  await query(`UPDATE city_reports SET status='Closed' WHERE status <> 'Closed' AND created_at < now() - ($1 || ' days')::interval`, [String(DAYS)]);
  const [open] = await query<{ n: number }>("SELECT COUNT(*)::int AS n FROM city_reports WHERE status <> 'Closed' AND pothole_id IS NULL");
  return { fetched: rows.length, kept, skippedUnsafe, openUnphotographed: open.n };
}

export type CityReport = { id: string; lat: number; lng: number; place: string; borough: string; createdAt: string; status: string };
type Row = { id: string; lat: number; lng: number; place: string; borough: string; created_at: string | Date; status: string };
const shape = (r: Row): CityReport => ({ id: r.id, lat: r.lat, lng: r.lng, place: r.place, borough: r.borough, createdAt: new Date(r.created_at).toISOString(), status: r.status });
const OPEN = "status <> 'Closed' AND pothole_id IS NULL";

// City reports nobody has photographed yet.
export async function openCityReports(): Promise<CityReport[]> {
  return (await query<Row>(`SELECT id, lat, lng, place, borough, created_at, status FROM city_reports WHERE ${OPEN} ORDER BY created_at DESC LIMIT 3000`)).map(shape);
}

export async function cityReportsNear(lat: number, lng: number, radiusM: number): Promise<(CityReport & { meters: number })[]> {
  const [a, b, c, d] = bbox(lat, lng, radiusM);
  const rows = await query<Row>(`SELECT id, lat, lng, place, borough, created_at, status FROM city_reports WHERE ${OPEN} AND lat BETWEEN $1 AND $2 AND lng BETWEEN $3 AND $4`, [a, b, c, d]);
  return rows.map((r) => ({ ...shape(r), meters: meters(lat, lng, r.lat, r.lng) })).filter((r) => r.meters <= radiusM).sort((x, y) => x.meters - y.meters);
}

// A rider's camera just confirmed a hazard: if the city has a report right here, tie them together.
export async function linkCityReport(potholeId: number, lat: number, lng: number) {
  const [near] = await cityReportsNear(lat, lng, 60);
  if (near) await query("UPDATE city_reports SET pothole_id=$2 WHERE id=$1", [near.id, potholeId]);
  return near ?? null;
}
