import { inNyc } from "@/lib/server/geo";
import { bad } from "@/lib/server/http";
import { hazardsOnTheWay, type LatLng } from "@/lib/server/route";

const parse = (s: string | null): LatLng | null => {
  const [lat, lng] = (s ?? "").split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) && inNyc(lat, lng) ? [lat, lng] : null;
};

// Known hazards between where the rider is and where they're heading.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const from = parse(u.searchParams.get("from")), to = parse(u.searchParams.get("to"));
  if (!from || !to) return bad("from and to must be lat,lng points in new york city");
  return Response.json(await hazardsOnTheWay(from, to), { headers: { "cache-control": "no-store" } });
}
