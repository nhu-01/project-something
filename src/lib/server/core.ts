import "server-only";
import { query } from "./db";
import { judgeFrame, type Verdict } from "./gemini";
import { bbox, directionWord, inNyc, meters, reverseGeocode } from "./geo";
import { savePhoto } from "./storage";
import { potholeConfidence } from "./yolo";

export const JOIN_RADIUS_M = 15; // frames within this distance of a known pothole count as a pass over it
const NEW_HIT = Number(process.env.YOLO_NEW_HIT ?? 0.35); // detector confidence needed to consider a brand-new pothole
const KNOWN_HIT = Number(process.env.YOLO_KNOWN_HIT ?? 0.2); // lower bar when we already expect one here

// A picture of a pothole (screen or print) must not become a real pothole on the map. ALLOW_SCREEN_FRAMES=1 turns this
// off for indoor testing only.
const allowScreens = () => process.env.ALLOW_SCREEN_FRAMES === "1";
const isPicture = (v: Verdict) => v.screen_or_print && !allowScreens();
export type ScanResult = { event: RideEventOut | null; hint?: "screen" };

export type Position = { lat: number; lng: number; heading: number | null; accuracy: number | null };
export type RideEventOut = { kind: "new" | "confirmed" | "worse" | "better" | "repaired"; potholeId: string; street: string; lane: string; severity: number | null };
type Ride = { id: string; rider: string };
type Known = { id: number; lat: number; lng: number; street: string; lane: string; severity: number | null; status: string };

export async function nearbyOpen(lat: number, lng: number, radiusM: number): Promise<Known[]> {
  const [a, b, c, d] = bbox(lat, lng, radiusM);
  const rows = await query<Known>(
    "SELECT id, lat, lng, street, lane, severity, status FROM potholes WHERE status='open' AND lat BETWEEN $1 AND $2 AND lng BETWEEN $3 AND $4",
    [a, b, c, d],
  );
  return rows.filter((p) => meters(lat, lng, p.lat, p.lng) <= radiusM);
}

const alreadySeen = async (rideId: string, potholeId: number) =>
  (await query("SELECT 1 FROM sightings WHERE ride_id=$1 AND pothole_id=$2 LIMIT 1", [rideId, potholeId])).length > 0;

async function record(ride: Ride, potholeId: number, kind: string, v: Verdict | null, pos: Position, photo: string | null, yolo: number | null, note: string) {
  await query(
    "INSERT INTO sightings (pothole_id, ride_id, rider, kind, severity, note, photo, yolo_conf, lat, lng) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [potholeId, ride.id, ride.rider, kind, v?.pothole_present ? v.severity : null, note, photo, yolo, pos.lat, pos.lng],
  );
}

// Frames with identifiable people or plates are never stored.
const photoFor = async (name: string, frame: Buffer, v: Verdict) => (v.people_or_plates ? null : savePhoto(name, frame));

// A rider saw a known pothole again: compare with what we had and update it.
async function resight(ride: Ride, p: Known, v: Verdict, pos: Position, frame: Buffer, yolo: number): Promise<RideEventOut> {
  const sev = v.severity ?? p.severity ?? 1;
  const kind = p.severity != null && sev > p.severity ? "worse" : p.severity != null && sev < p.severity ? "better" : "confirmed";
  const photo = await photoFor(`${ride.id}-${p.id}.jpg`, frame, v);
  await record(ride, p.id, kind, v, pos, photo, yolo, v.note);
  await query("UPDATE potholes SET severity=$2, size=COALESCE($3,size), last_seen=now(), photo=COALESCE($4,photo) WHERE id=$1", [p.id, sev, v.size, photo]);
  return { kind, potholeId: String(p.id), street: p.street, lane: p.lane, severity: sev };
}

// Called for each camera frame during a ride.
export async function scanFrame(ride: Ride, frame: Buffer, pos: Position): Promise<ScanResult> {
  await query("UPDATE rides SET frames = frames + 1 WHERE id=$1", [ride.id]);
  if (!inNyc(pos.lat, pos.lng) || (pos.accuracy != null && pos.accuracy > 50)) return { event: null };

  const yolo = await potholeConfidence(frame);
  const near = (await nearbyOpen(pos.lat, pos.lng, JOIN_RADIUS_M)).sort((x, y) => meters(pos.lat, pos.lng, x.lat, x.lng) - meters(pos.lat, pos.lng, y.lat, y.lng))[0];

  if (near) {
    if (yolo < KNOWN_HIT || (await alreadySeen(ride.id, near.id))) return { event: null };
    const v = await judgeFrame(frame);
    if (isPicture(v)) return { event: null, hint: "screen" };
    // absence is settled by passCheck when the rider leaves
    return { event: v.pothole_present ? await resight(ride, near, v, pos, frame, yolo) : null };
  }

  if (yolo < NEW_HIT) return { event: null };
  const v = await judgeFrame(frame);
  if (isPicture(v)) return { event: null, hint: v.pothole_present ? "screen" : undefined };
  if (!v.pothole_present || v.road_type !== "street" || v.confidence === "low") return { event: null };

  const place = await reverseGeocode(pos.lat, pos.lng);
  const sev = v.severity ?? 2;
  const [row] = await query<{ id: number }>(
    "INSERT INTO potholes (lat, lng, street, borough, direction, lane, size, severity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
    [pos.lat, pos.lng, place.street, place.borough, directionWord(pos.heading), v.lane, v.size ?? "medium", sev],
  );
  const photo = await photoFor(`${ride.id}-${row.id}.jpg`, frame, v);
  if (photo) await query("UPDATE potholes SET photo=$2 WHERE id=$1", [row.id, photo]);
  await record(ride, row.id, "first_seen", v, pos, photo, yolo, v.note);
  return { event: { kind: "new", potholeId: String(row.id), street: place.street, lane: v.lane, severity: sev } };
}

// Called once when a rider has passed a known pothole without the camera confirming it.
export async function passCheck(ride: Ride, potholeId: number, frame: Buffer, pos: Position): Promise<RideEventOut | null> {
  const [p] = await query<Known>("SELECT id, lat, lng, street, lane, severity, status FROM potholes WHERE id=$1 AND status='open'", [potholeId]);
  if (!p || (await alreadySeen(ride.id, p.id))) return null;
  if (meters(pos.lat, pos.lng, p.lat, p.lng) > JOIN_RADIUS_M * 3) return null; // not actually near it

  const yolo = await potholeConfidence(frame);
  const v = await judgeFrame(frame);
  if (isPicture(v)) return null; // a picture says nothing about the real road, so record nothing
  if (v.pothole_present) return resight(ride, p, v, pos, frame, yolo);

  // Not visible. A repair patch, or two different riders in a row not finding it, counts as repaired.
  const [prev] = await query<{ kind: string; ride_id: string }>("SELECT kind, ride_id FROM sightings WHERE pothole_id=$1 ORDER BY at DESC LIMIT 1", [p.id]);
  const repaired = v.repair_patch_visible || (prev?.kind === "not_found" && prev.ride_id !== ride.id);
  if (!repaired) {
    await record(ride, p.id, "not_found", null, pos, null, yolo, "not visible on this pass.");
    return null;
  }
  const photo = await photoFor(`${ride.id}-${p.id}.jpg`, frame, v);
  await record(ride, p.id, "repaired", null, pos, photo, yolo, v.repair_patch_visible ? "a fresh patch where it used to be. looks repaired." : "not found by two riders in a row. looks repaired.");
  await query("UPDATE potholes SET status='repaired', severity=NULL, last_seen=now(), photo=COALESCE($2,photo) WHERE id=$1", [p.id, photo]);
  return { kind: "repaired", potholeId: String(p.id), street: p.street, lane: p.lane, severity: null };
}
