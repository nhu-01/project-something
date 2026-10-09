import { nearbyOpen } from "@/lib/server/core";
import { bad } from "@/lib/server/http";

// Open potholes around the rider, so the phone can warn about what's ahead before the camera sees it.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat")), lng = Number(u.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return bad("lat and lng required");
  const rows = await nearbyOpen(lat, lng, 600);
  return Response.json(rows.map((p) => ({ id: String(p.id), lat: p.lat, lng: p.lng, street: p.street, lane: p.lane, severity: p.severity ?? 2 })), { headers: { "cache-control": "no-store" } });
}
