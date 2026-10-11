import { validPoint } from "@/lib/server/geo";
import { bad } from "@/lib/server/http";
import { cityReportsNear } from "@/lib/server/city";

// The one 311 spot to go and photograph: the closest open report, with a small preference for spots with fewer photos
// (each existing photo counts as 300 m of extra distance). Returns { spot: null } when nothing is near.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat")), lng = Number(u.searchParams.get("lng"));
  if (!validPoint(lat, lng)) return bad("lat and lng required");
  const near = await cityReportsNear(lat, lng, 5000);
  const best = [...near].sort((a, b) => a.meters + a.photoCount * 300 - (b.meters + b.photoCount * 300))[0];
  return Response.json(
    { spot: best ? { id: best.id, lat: best.lat, lng: best.lng, place: best.place, borough: best.borough, photos: best.photoCount, meters: Math.round(best.meters) } : null },
    { headers: { "cache-control": "no-store" } },
  );
}
