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

export async function startRide(deviceId: string) {
  const id = randomUUID();
  const rider = riderLabel(deviceId);
  await query("INSERT INTO rides (id, rider) VALUES ($1, $2)", [id, rider]);
  return { rideId: id, token: sign(id), rider };
}

export async function authRide(rideId: unknown, token: unknown): Promise<{ id: string; rider: string } | null> {
  if (typeof rideId !== "string" || typeof token !== "string" || token.length !== 32) return null;
  const expected = Buffer.from(sign(rideId)), got = Buffer.from(token);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  const [ride] = await query<{ id: string; rider: string }>("SELECT id, rider FROM rides WHERE id=$1 AND ended_at IS NULL", [rideId]);
  return ride ?? null;
}
