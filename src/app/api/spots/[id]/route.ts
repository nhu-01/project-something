import { getCityReport } from "@/lib/data";

// One 311 report with all of its rider photos (used by the map's sheet).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const r = await getCityReport(id);
  if (!r) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json(r, { headers: { "cache-control": "no-store" } });
}
