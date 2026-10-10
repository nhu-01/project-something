import "server-only";
import { query } from "./db";
import { judgeFrame, type Verdict } from "./gemini";
import { bbox, directionWord, meters, reverseGeocode, validPoint } from "./geo";
import { savePhoto } from "./storage";
import { damageConfidence, stripPadding } from "./yolo";
import { addCityPhoto, cityReportsNear } from "./city";

// Phone GPS is only good to 5-20 m (worse between buildings), so anything this close to a known hazard is treated as
// the same hazard. 15 m turned out to be too tight: a little drift made every visit log a "new" one.
export const JOIN_RADIUS_M = 25;
const joinRadius = (pos: Position) => Math.min(45, Math.max(JOIN_RADIUS_M, (pos.accuracy ?? 10) + 15));
// 311 reports mark an intersection or an address, not the exact hole, so a frame within this distance of one counts
// as that spot. (Wider than for rider hazards, and widened further when GPS is poor.)
const cityRadius = (pos: Position) => Math.min(60, Math.max(40, (pos.accuracy ?? 10) + 20));
const MAX_PHOTOS_PER_RIDE_SPOT = 4; // enough angles, not a flood from one pass
const MIN_GAP_S = 3;
// Hairline cracks and shallow dips (severity 1) are everywhere; logging each one buries the real hazards.
const MIN_NEW_SEVERITY = Number(process.env.MIN_NEW_SEVERITY ?? 2);
// The detector is only a cheap first pass, so its bar is deliberately low: Gemini makes the real call.
const NEW_HIT = Number(process.env.YOLO_NEW_HIT ?? 0.2); // confidence needed to consider a brand-new hazard
const KNOWN_HIT = Number(process.env.YOLO_KNOWN_HIT ?? 0.12); // lower bar when we already expect one here
// The detector was trained on asphalt roads, so it can miss sidewalks, pavers and unusual damage entirely.
// To cover that, Gemini also looks at a frame on a timer even when the detector saw nothing.
const LOOK_EVERY_MS = Number(process.env.GEMINI_LOOK_EVERY_MS ?? 3000);
const RIDEABLE = new Set(["street", "sidewalk_or_path"]);

// A picture of a pothole (screen or print) must not become a real pothole on the map. ALLOW_SCREEN_FRAMES=1 turns this
// off for indoor testing only.
const allowScreens = () => process.env.ALLOW_SCREEN_FRAMES === "1";
const isPicture = (v: Verdict) => v.screen_or_print && !allowScreens();
export type ScanResult = { event: RideEventOut | null; hint?: "screen" };

export type Position = { lat: number; lng: number; heading: number | null; accuracy: number | null };
// source "311" events are photos added to a city report (id is the 311 number); "rider" events are hazards riders logged.
export type RideEventOut = {
  kind: "new" | "confirmed" | "worse" | "better" | "repaired" | "photo" | "not_found";
  source: "rider" | "311"; potholeId: string; hazard: string; street: string; lane: string; severity: number | null; photoNumber?: number;
};
type Ride = { id: string; rider: string };
type Known = { id: number; lat: number; lng: number; street: string; lane: string; severity: number | null; status: string; kind: string };

const KNOWN_COLS = "id, lat, lng, street, lane, severity, status, kind";
const hazardOf = (v: Verdict) => (v.hazard_type === "none" ? "pothole" : v.hazard_type);

// Per-ride diagnostics, so thresholds can be tuned from real rides.
async function judge(ride: Ride, frame: Buffer) {
  await query("UPDATE rides SET gemini_calls = gemini_calls + 1, last_look = now() WHERE id=$1", [ride.id]);
  return judgeFrame(stripPadding(frame));
}
// True when it's been a while since Gemini last looked at a frame from this ride.
async function dueForLook(rideId: string) {
  const [r] = await query<{ due: boolean }>("SELECT (last_look IS NULL OR last_look < now() - ($2 || ' milliseconds')::interval) AS due FROM rides WHERE id=$1", [rideId, String(LOOK_EVERY_MS)]);
  return Boolean(r?.due);
}
async function detect(ride: Ride, frame: Buffer) {
  const conf = await damageConfidence(frame);
  await query("UPDATE rides SET frames = frames + 1, max_yolo = GREATEST(max_yolo, $2) WHERE id=$1", [ride.id, conf]);
  return conf;
}

export async function nearbyOpen(lat: number, lng: number, radiusM: number): Promise<Known[]> {
  const [a, b, c, d] = bbox(lat, lng, radiusM);
  const rows = await query<Known>(
    `SELECT ${KNOWN_COLS} FROM potholes WHERE status='open' AND merged_into IS NULL AND lat BETWEEN $1 AND $2 AND lng BETWEEN $3 AND $4`,
    [a, b, c, d],
  );
  return rows.filter((p) => meters(lat, lng, p.lat, p.lng) <= radiusM);
}

const alreadySeen = async (rideId: string, potholeId: number) =>
  (await query("SELECT 1 FROM sightings WHERE ride_id=$1 AND pothole_id=$2 LIMIT 1", [rideId, potholeId])).length > 0;

async function record(ride: Ride, potholeId: number, kind: string, v: Verdict | null, pos: Position, photo: string | null, yolo: number | null, note: string) {
  // (yolo is null for hand-submitted photos, which skip the detector)
  await query(
    "INSERT INTO sightings (pothole_id, ride_id, rider, kind, severity, note, photo, yolo_conf, lat, lng) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [potholeId, ride.id, ride.rider, kind, v?.pothole_present ? v.severity : null, note, photo, yolo, pos.lat, pos.lng],
  );
}

// Frames with identifiable people or plates are never stored.
const photoFor = async (name: string, frame: Buffer, v: Verdict) => (v.people_or_plates ? null : savePhoto(name, stripPadding(frame)));

const justLogged = async (rideId: string) =>
  (await query("SELECT 1 FROM sightings WHERE ride_id=$1 AND kind='first_seen' AND at > now() - interval '3 seconds' LIMIT 1", [rideId])).length > 0;

// Two frames of the same hazard can be checked at the same moment and both decide it's new. After inserting, look for
// an older hazard right here; if there is one, ours is the duplicate, so fold it away and return the older one.
async function lostRace(newId: number, pos: Position): Promise<Known | null> {
  const older = (await nearbyOpen(pos.lat, pos.lng, joinRadius(pos))).filter((p) => p.id < newId).sort((a, b) => a.id - b.id)[0];
  if (!older) return null;
  await query("UPDATE potholes SET merged_into=$2 WHERE id=$1", [newId, older.id]);
  return older;
}

// A rider saw a known pothole again: compare with what we had and update it.
async function resight(ride: Ride, p: Known, v: Verdict, pos: Position, frame: Buffer, yolo: number): Promise<RideEventOut> {
  const sev = v.severity ?? p.severity ?? 1;
  const kind = p.severity != null && sev > p.severity ? "worse" : p.severity != null && sev < p.severity ? "better" : "confirmed";
  const photo = await photoFor(`${ride.id}-${p.id}.jpg`, frame, v);
  await record(ride, p.id, kind, v, pos, photo, yolo, v.note);
  await query("UPDATE potholes SET severity=$2, size=COALESCE($3,size), last_seen=now(), photo=COALESCE($4,photo) WHERE id=$1", [p.id, sev, v.size, photo]);
  return { kind, source: "rider", potholeId: String(p.id), hazard: p.kind, street: p.street, lane: p.lane, severity: sev };
}

// A frame taken at a 311 report: the photo joins that report's gallery (many riders, many photos, like Austin and
// Boston), and the report's latest read of the spot is refreshed.
async function cityFrame(ride: Ride, report: { id: string; place: string }, frame: Buffer, pos: Position, yolo: number): Promise<ScanResult> {
  const [stat] = await query<{ n: number; last: string | Date | null; missed: number }>(
    "SELECT COUNT(*)::int AS n, MAX(at) AS last, COUNT(*) FILTER (WHERE NOT present)::int AS missed FROM city_photos WHERE report_id=$1 AND ride_id=$2", [report.id, ride.id]);
  if (stat.n >= MAX_PHOTOS_PER_RIDE_SPOT) return { event: null };
  if (stat.last && Date.now() - new Date(stat.last).getTime() < MIN_GAP_S * 1000) return { event: null };
  if (yolo < KNOWN_HIT && !(await dueForLook(ride.id))) return { event: null };

  const v = await judge(ride, frame);
  if (isPicture(v)) return { event: null, hint: "screen" };
  const base = { source: "311" as const, potholeId: report.id, street: report.place };
  if (v.pothole_present) {
    const photo = await photoFor(`${ride.id}-c${report.id}-${stat.n}.jpg`, frame, v);
    await addCityPhoto({ reportId: report.id, rideId: ride.id, rider: ride.rider, photo, present: true, severity: v.severity, note: v.note, lat: pos.lat, lng: pos.lng },
      { kind: hazardOf(v), severity: v.severity, size: v.size, lane: v.lane });
    const [now] = await query<{ photo_count: number }>("SELECT photo_count FROM city_reports WHERE id=$1", [report.id]);
    return { event: { ...base, kind: "photo", hazard: hazardOf(v), lane: v.lane, severity: v.severity, photoNumber: now?.photo_count } };
  }
  // Nothing visible: recorded at most once per ride, and only when the model is fairly sure.
  if (v.confidence === "low" || stat.missed > 0) return { event: null };
  const photo = await photoFor(`${ride.id}-c${report.id}-none.jpg`, frame, v);
  await addCityPhoto({ reportId: report.id, rideId: ride.id, rider: ride.rider, photo, present: false, severity: null, note: v.note, lat: pos.lat, lng: pos.lng });
  return { event: { ...base, kind: "not_found", hazard: "pothole", lane: v.lane, severity: null } };
}

// Called for each camera frame during a ride.
export async function scanFrame(ride: Ride, frame: Buffer, pos: Position): Promise<ScanResult> {
  const yolo = await detect(ride, frame);
  if (!validPoint(pos.lat, pos.lng) || (pos.accuracy != null && pos.accuracy > 65)) return { event: null };

  // At a 311 spot: the photo goes on that report.
  const city = (await cityReportsNear(pos.lat, pos.lng, cityRadius(pos)))[0];
  if (city) return cityFrame(ride, city, frame, pos, yolo);

  const near = (await nearbyOpen(pos.lat, pos.lng, joinRadius(pos))).sort((x, y) => meters(pos.lat, pos.lng, x.lat, x.lng) - meters(pos.lat, pos.lng, y.lat, y.lng))[0];

  if (near) {
    if (await alreadySeen(ride.id, near.id)) return { event: null };
    if (yolo < KNOWN_HIT && !(await dueForLook(ride.id))) return { event: null };
    const v = await judge(ride, frame);
    if (isPicture(v)) return { event: null, hint: "screen" };
    if (v.pothole_present) return { event: await resight(ride, near, v, pos, frame, yolo) };
    // a fresh patch where a rider-logged hazard used to be
    if (v.repair_patch_visible && v.confidence !== "low") {
      const photo = await photoFor(`${ride.id}-${near.id}.jpg`, frame, v);
      await record(ride, near.id, "repaired", null, pos, photo, yolo, "a fresh patch where it used to be. looks repaired.");
      await query("UPDATE potholes SET status='repaired', severity=NULL, last_seen=now(), photo=COALESCE($2,photo) WHERE id=$1", [near.id, photo]);
      return { event: { kind: "repaired", source: "rider", potholeId: String(near.id), hazard: near.kind, street: near.street, lane: near.lane, severity: null } };
    }
    return { event: null };
  }

  if (yolo < NEW_HIT && !(await dueForLook(ride.id))) return { event: null };
  const v = await judge(ride, frame);
  if (isPicture(v)) return { event: null, hint: v.pothole_present ? "screen" : undefined };
  if (!v.pothole_present || !RIDEABLE.has(v.road_type) || v.confidence === "low" || (v.severity ?? 2) < MIN_NEW_SEVERITY) return { event: null };
  // At speed, the same hazard shows up in back-to-back frames taken more than JOIN_RADIUS_M apart. Don't log it twice.
  if (await justLogged(ride.id)) return { event: null };

  const place = await reverseGeocode(pos.lat, pos.lng);
  const sev = v.severity ?? 2;
  const [row] = await query<{ id: number }>(
    "INSERT INTO potholes (lat, lng, street, borough, direction, lane, size, severity, kind) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
    [pos.lat, pos.lng, place.street, place.borough, directionWord(pos.heading), v.lane, v.size ?? "medium", sev, hazardOf(v)],
  );
  if (await lostRace(row.id, pos)) return { event: null };
  const photo = await photoFor(`${ride.id}-${row.id}.jpg`, frame, v);
  if (photo) await query("UPDATE potholes SET photo=$2 WHERE id=$1", [row.id, photo]);
  await record(ride, row.id, "first_seen", v, pos, photo, yolo, v.note);
  return { event: { kind: "new", source: "rider", potholeId: String(row.id), hazard: hazardOf(v), street: place.street, lane: v.lane, severity: sev } };
}

export type ReportResult =
  | { ok: true; event: RideEventOut; photoKept: boolean; to311?: { id: string; place: string } }
  | { ok: false; reason: "no_hazard" | "picture" | "not_rideable" };

// A photo someone submitted by hand, with a location they chose. No detector gate: Gemini always judges it.
// `photo` is the full picture, with no padding: it is what Gemini judges and what we keep.
export async function reportPhoto(ride: Ride, photo: Buffer, pos: Position): Promise<ReportResult> {
  const v = await judge(ride, photo);
  if (isPicture(v)) return { ok: false, reason: "picture" };
  if (!v.pothole_present) return { ok: false, reason: "no_hazard" };
  if (!RIDEABLE.has(v.road_type)) return { ok: false, reason: "not_rideable" };

  // A photo reported at a 311 spot joins that report's gallery.
  const city = (await cityReportsNear(pos.lat, pos.lng, cityRadius(pos)))[0];
  if (city) {
    const url = await photoFor(`${ride.id}-c${city.id}.jpg`, photo, v);
    await addCityPhoto({ reportId: city.id, rideId: ride.id, rider: ride.rider, photo: url, present: true, severity: v.severity, note: v.note, lat: pos.lat, lng: pos.lng },
      { kind: hazardOf(v), severity: v.severity, size: v.size, lane: v.lane });
    return { ok: true, photoKept: Boolean(url), to311: { id: city.id, place: city.place },
      event: { kind: "photo", source: "311", potholeId: city.id, hazard: hazardOf(v), street: city.place, lane: v.lane, severity: v.severity } };
  }

  const near = (await nearbyOpen(pos.lat, pos.lng, joinRadius(pos))).sort((x, y) => meters(pos.lat, pos.lng, x.lat, x.lng) - meters(pos.lat, pos.lng, y.lat, y.lng))[0];
  if (near) return { ok: true, event: await resight(ride, near, v, pos, photo, 0), photoKept: !v.people_or_plates };

  const place = await reverseGeocode(pos.lat, pos.lng);
  const sev = v.severity ?? 2;
  const [row] = await query<{ id: number }>(
    "INSERT INTO potholes (lat, lng, street, borough, direction, lane, size, severity, kind) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
    [pos.lat, pos.lng, place.street, place.borough, directionWord(null), v.lane, v.size ?? "medium", sev, hazardOf(v)],
  );
  const winner = await lostRace(row.id, pos);
  if (winner) return { ok: true, event: await resight(ride, winner, v, pos, photo, 0), photoKept: !v.people_or_plates };
  const url = await photoFor(`${ride.id}-${row.id}.jpg`, photo, v);
  if (url) await query("UPDATE potholes SET photo=$2 WHERE id=$1", [row.id, url]);
  await record(ride, row.id, "first_seen", v, pos, url, null, v.note);
  return { ok: true, event: { kind: "new", source: "rider", potholeId: String(row.id), hazard: hazardOf(v), street: place.street, lane: v.lane, severity: sev }, photoKept: Boolean(url) };
}
