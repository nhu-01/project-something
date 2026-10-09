import { query } from "@/lib/server/db";
import { validPoint } from "@/lib/server/geo";
import { bad } from "@/lib/server/http";
import { authRide } from "@/lib/server/rides";

type Point = { lat: unknown; lng: unknown; t: unknown };

// The phone sends its recent GPS breadcrumbs in small batches during a ride.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { rideId?: unknown; token?: unknown; points?: Point[] } | null;
  const ride = await authRide(body?.rideId, body?.token);
  if (!ride) return bad("unknown or ended ride", 401);
  const now = Date.now();
  const points = (Array.isArray(body?.points) ? body.points : []).slice(0, 80)
    .map((p) => ({ lat: Number(p.lat), lng: Number(p.lng), t: Number(p.t) }))
    // breadcrumbs can arrive late after a stretch with no signal, so accept anything from the last 12 hours
    .filter((p) => validPoint(p.lat, p.lng) && Number.isFinite(p.t) && p.t <= now + 60_000 && now - p.t < 12 * 3600 * 1000);
  if (!points.length) return Response.json({ saved: 0 });
  const values = points.map((_, i) => `($1, to_timestamp($${i * 3 + 2}::double precision / 1000), $${i * 3 + 3}, $${i * 3 + 4})`).join(",");
  await query(`INSERT INTO ride_points (ride_id, at, lat, lng) VALUES ${values}`, [ride.id, ...points.flatMap((p) => [p.t, p.lat, p.lng])]);
  return Response.json({ saved: points.length });
}
