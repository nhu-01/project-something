import { inNyc } from "@/lib/server/geo";

// Address suggestions for "where are you heading?", from NYC's own geocoder (NYC Planning Labs Geosearch).
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 3) return Response.json([]);
  try {
    const res = await fetch(`https://geosearch.planninglabs.nyc/v2/autocomplete?text=${encodeURIComponent(q)}&size=6`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return Response.json([]);
    const features = ((await res.json())?.features ?? []) as { properties?: { label?: string }; geometry?: { coordinates?: [number, number] } }[];
    const out = features
      .map((f) => ({ label: String(f.properties?.label ?? "").replace(/, USA$/, ""), lat: f.geometry?.coordinates?.[1], lng: f.geometry?.coordinates?.[0] }))
      .filter((f): f is { label: string; lat: number; lng: number } => Boolean(f.label) && typeof f.lat === "number" && typeof f.lng === "number" && inNyc(f.lat, f.lng))
      .slice(0, 5);
    return Response.json(out, { headers: { "cache-control": "public, max-age=300" } });
  } catch {
    return Response.json([]);
  }
}
