import { validPoint } from "@/lib/server/geo";
import { bad } from "@/lib/server/http";
import { photoMission } from "@/lib/server/route";

// A suggested route past nearby 311 pothole reports that still have no photo.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat")), lng = Number(u.searchParams.get("lng"));
  if (!validPoint(lat, lng)) return bad("lat and lng required");
  return Response.json(await photoMission([lat, lng]), { headers: { "cache-control": "no-store" } });
}
