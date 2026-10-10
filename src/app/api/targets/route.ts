import { cityReportsNear } from "@/lib/server/city";
import { nearbyOpen } from "@/lib/server/core";
import { validPoint } from "@/lib/server/geo";
import { bad } from "@/lib/server/http";

// What's around a rider: 311 spots to photograph and hazards other riders logged. Drives the arrow on the ride screen.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat")), lng = Number(u.searchParams.get("lng"));
  if (!validPoint(lat, lng)) return bad("lat and lng required");
  const r = Math.min(3000, Math.max(200, Number(u.searchParams.get("r")) || 800));
  const [spots, hazards] = await Promise.all([cityReportsNear(lat, lng, r), nearbyOpen(lat, lng, r)]);
  return Response.json({
    spots: spots.slice(0, 60).map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, place: s.place, borough: s.borough, photos: s.photoCount, createdAt: s.createdAt })),
    hazards: hazards.slice(0, 60).map((h) => ({ id: String(h.id), lat: h.lat, lng: h.lng, place: h.street, severity: h.severity ?? 2, kind: h.kind })),
  }, { headers: { "cache-control": "no-store" } });
}
