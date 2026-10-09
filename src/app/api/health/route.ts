import { query } from "@/lib/server/db";

// Quick check that the deployment can reach its database and has its keys, plus anonymous ride diagnostics
// (no locations, no rider ids) for debugging what recent rides actually recorded.
export async function GET() {
  const out: Record<string, unknown> = {
    gemini: Boolean(process.env.GEMINI_API_KEY), blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    voice: Boolean(process.env.ELEVENLABS_API_KEY), salt: Boolean(process.env.HASH_SALT),
  };
  try {
    const t = Date.now();
    const [r] = await query<{ n: number }>("SELECT COUNT(*)::int AS n FROM potholes");
    out.db = { ok: true, potholes: r.n, ms: Date.now() - t };
    out.recentRides = await query(
      `SELECT to_char(r.started_at, 'MM-DD HH24:MI') AS started,
              CASE WHEN r.ended_at IS NULL THEN NULL ELSE ROUND(EXTRACT(EPOCH FROM (r.ended_at - r.started_at)))::int END AS seconds,
              r.frames, ROUND(r.max_yolo::numeric, 2)::float AS max_yolo, r.gemini_calls,
              (SELECT COUNT(*)::int FROM ride_points p WHERE p.ride_id = r.id) AS points,
              (SELECT COUNT(*)::int FROM sightings s WHERE s.ride_id = r.id) AS sightings
       FROM rides r ORDER BY r.started_at DESC LIMIT 12`,
    );
  } catch (e) {
    out.db = { ok: false, error: e instanceof Error ? e.message : "error" };
  }
  return Response.json(out, { headers: { "cache-control": "no-store" } });
}
