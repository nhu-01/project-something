import { searchPlaces } from "@/lib/server/geo";

// Address suggestions for "where are you heading?" and for manual reports.
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 3) return Response.json([]);
  return Response.json(await searchPlaces(q), { headers: { "cache-control": "public, max-age=300" } });
}
