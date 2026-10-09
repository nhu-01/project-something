import { nearbyOpen } from "@/lib/server/core";
import { bad } from "@/lib/server/http";

// Open potholes around the rider, so the phone can warn about what's ahead before the camera sees it.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat")), lng = Number(u.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return bad("lat and lng required");
  // faster riders ask for a wider radius
  const r = Math.min(3000, Math.max(200, Number(u.searchParams.get("r")) || 600));
  const rows = await nearbyOpen(lat, lng, r);
  return Response.json(rows.map((p) => ({ id: String(p.id), lat: p.lat, lng: p.lng, street: p.street, lane: p.lane, severity: p.severity ?? 2, kind: p.kind })), { headers: { "cache-control": "no-store" } });
}
