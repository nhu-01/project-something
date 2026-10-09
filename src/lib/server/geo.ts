import "server-only";

export const inNyc = (lat: number, lng: number) => lat >= 40.45 && lat <= 40.95 && lng >= -74.3 && lng <= -73.65;
export const validPoint = (lat: number, lng: number) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
const OSM_HEADERS = { "user-agent": "spotholes.nyc (hackathon project)" };

export function meters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000, rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(bLat - aLat) / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bbox(lat: number, lng: number, m: number) {
  const dLat = m / 111_320, dLng = m / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [lat - dLat, lat + dLat, lng - dLng, lng + dLng] as const;
}

export function directionWord(heading: number | null) {
  if (heading == null || !Number.isFinite(heading)) return "unknown direction";
  return ["northbound", "eastbound", "southbound", "westbound"][Math.round((((heading % 360) + 360) % 360) / 90) % 4];
}

// Street name for a point: NYC's own geocoder inside the city, OpenStreetMap's everywhere else.
// Best effort; never blocks a detection.
export async function reverseGeocode(lat: number, lng: number): Promise<{ street: string; borough: string }> {
  if (!inNyc(lat, lng)) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&lat=${lat}&lon=${lng}`, { signal: AbortSignal.timeout(4000), headers: OSM_HEADERS });
      const a = (await res.json())?.address;
      if (a) return { street: String(a.road ?? a.pedestrian ?? a.footway ?? a.path ?? a.neighbourhood ?? "unnamed street"), borough: String(a.city ?? a.town ?? a.village ?? a.county ?? a.state ?? "") || "unknown area" };
    } catch { /* fall through */ }
    return { street: "unnamed street", borough: "unknown area" };
  }
  try {
    const res = await fetch(`https://geosearch.planninglabs.nyc/v2/reverse?point.lat=${lat}&point.lon=${lng}&size=1`, { signal: AbortSignal.timeout(4000) });
    const p = (await res.json())?.features?.[0]?.properties;
    if (p) return { street: titleCase(String(p.street ?? p.name ?? "unnamed street")), borough: String(p.borough ?? "New York") };
  } catch { /* fall through */ }
  return { street: "unnamed street", borough: "New York" };
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export type Place = { label: string; lat: number; lng: number };

// Address suggestions: NYC's geocoder first, OpenStreetMap as a fallback for places outside the city.
export async function searchPlaces(q: string): Promise<Place[]> {
  const ok = (p: { label: string; lat?: number; lng?: number }): p is Place => Boolean(p.label) && typeof p.lat === "number" && typeof p.lng === "number" && validPoint(p.lat, p.lng);
  try {
    const res = await fetch(`https://geosearch.planninglabs.nyc/v2/autocomplete?text=${encodeURIComponent(q)}&size=6`, { signal: AbortSignal.timeout(4000) });
    const features = (res.ok ? (await res.json())?.features ?? [] : []) as { properties?: { label?: string }; geometry?: { coordinates?: [number, number] } }[];
    const nyc = features.map((f) => ({ label: String(f.properties?.label ?? "").replace(/, USA$/, ""), lat: f.geometry?.coordinates?.[1], lng: f.geometry?.coordinates?.[0] })).filter(ok);
    if (nyc.length) return nyc.slice(0, 5);
  } catch { /* try the fallback */ }
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(4000), headers: OSM_HEADERS });
    const rows = (res.ok ? await res.json() : []) as { display_name?: string; lat?: string; lon?: string }[];
    return rows.map((r) => ({ label: String(r.display_name ?? "").split(",").slice(0, 3).join(","), lat: Number(r.lat), lng: Number(r.lon) })).filter(ok);
  } catch {
    return [];
  }
}
