import "server-only";
import { getCityReport } from "@/lib/data";

export type StreetPhoto = { id: string; url: string; capturedAt: string | null };

// Street-level photos near a point from Mapillary's open API (crowd-sourced, CC BY-SA 4.0). Needs MAPILLARY_TOKEN,
// a free client token from mapillary.com/dashboard/developers; without it the feature is simply off.
// We never use Google Street View imagery: its terms forbid collecting it.
export const mapillaryEnabled = () => Boolean(process.env.MAPILLARY_TOKEN);

export async function streetPhotosNear(lat: number, lng: number): Promise<StreetPhoto[]> {
  const token = process.env.MAPILLARY_TOKEN;
  if (!token) return [];
  const dLat = 40 / 111_320, dLng = 40 / (111_320 * Math.cos((lat * Math.PI) / 180)); // about 40 m each way
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat].join(",");
  const url = `https://graph.mapillary.com/images?access_token=${encodeURIComponent(token)}&fields=id,thumb_1024_url,captured_at&bbox=${bbox}&limit=40`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: { id: string; thumb_1024_url?: string; captured_at?: number }[] };
    return (body.data ?? [])
      .filter((d) => d.thumb_1024_url)
      .sort((a, b) => (b.captured_at ?? 0) - (a.captured_at ?? 0))
      .slice(0, 6)
      .map((d) => ({ id: d.id, url: d.thumb_1024_url!, capturedAt: d.captured_at ? new Date(d.captured_at).toISOString() : null }));
  } catch { return []; }
}

export async function streetPhotosForSpot(id: string) {
  const r = await getCityReport(id);
  return r ? streetPhotosNear(r.lat, r.lng) : null;
}
