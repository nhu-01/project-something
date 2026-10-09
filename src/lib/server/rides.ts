import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { query } from "./db";

const secret = () => process.env.HASH_SALT ?? "dev-only-salt";
const sign = (id: string) => createHmac("sha256", secret()).update(id).digest("hex").slice(0, 32);

// Riders are anonymous: a device id from the browser is hashed into a short label like "r-4k2p".
export function riderLabel(deviceId: string) {
  const h = createHmac("sha256", secret()).update(`rider:${deviceId}`).digest();
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return "r-" + Array.from(h.subarray(0, 4), (b) => alphabet[b % alphabet.length]).join("");
}

export async function startRide(deviceId: string, source: "ride" | "report" = "ride") {
  const id = randomUUID();
  const rider = riderLabel(deviceId);
  await query("INSERT INTO rides (id, rider, source) VALUES ($1, $2, $3)", [id, rider, source]);
  return { rideId: id, token: sign(id), rider };
}

export async function authRide(rideId: unknown, token: unknown): Promise<{ id: string; rider: string } | null> {
  if (typeof rideId !== "string" || typeof token !== "string" || token.length !== 32) return null;
  const expected = Buffer.from(sign(rideId)), got = Buffer.from(token);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  const [ride] = await query<{ id: string; rider: string }>("SELECT id, rider FROM rides WHERE id=$1 AND ended_at IS NULL", [rideId]);
  return ride ?? null;
}

// Hand-submitted photos are limited per device so the form can't be used to flood the map.
export async function reportsInLastHour(deviceId: string) {
  const [r] = await query<{ n: number }>("SELECT COUNT(*)::int AS n FROM rides WHERE rider=$1 AND source='report' AND started_at > now() - interval '1 hour'", [riderLabel(deviceId)]);
  return r?.n ?? 0;
}
export const endRide = (id: string) => query("UPDATE rides SET ended_at=now() WHERE id=$1", [id]);
