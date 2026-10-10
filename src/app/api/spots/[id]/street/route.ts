import { mapillaryEnabled, streetPhotosForSpot } from "@/lib/server/mapillary";

// Street-level photos around one 311 spot (Mapillary). Empty and `enabled: false` when no token is configured.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!mapillaryEnabled()) return Response.json({ enabled: false, photos: [] });
  const photos = await streetPhotosForSpot(id);
  if (!photos) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ enabled: true, photos }, { headers: { "cache-control": "public, max-age=3600" } });
}
