import "server-only";

export const inNyc = (lat: number, lng: number) => lat >= 40.45 && lat <= 40.95 && lng >= -74.3 && lng <= -73.65;

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

// NYC Planning Labs Geosearch (free, NYC-specific). Best effort; never blocks a detection.
export async function reverseGeocode(lat: number, lng: number): Promise<{ street: string; borough: string }> {
  try {
    const res = await fetch(`https://geosearch.planninglabs.nyc/v2/reverse?point.lat=${lat}&point.lon=${lng}&size=1`, { signal: AbortSignal.timeout(4000) });
    const p = (await res.json())?.features?.[0]?.properties;
    if (p) return { street: titleCase(String(p.street ?? p.name ?? "unnamed street")), borough: String(p.borough ?? "New York") };
  } catch { /* fall through */ }
  return { street: "unnamed street", borough: "New York" };
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
