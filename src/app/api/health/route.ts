import { query } from "@/lib/server/db";

// Quick check that the deployment can reach its database and has its keys.
export async function GET() {
  const out: Record<string, unknown> = { gemini: Boolean(process.env.GEMINI_API_KEY), blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN), salt: Boolean(process.env.HASH_SALT) };
  try {
    const t = Date.now();
    const [r] = await query<{ n: number }>("SELECT COUNT(*)::int AS n FROM potholes");
    out.db = { ok: true, potholes: r.n, ms: Date.now() - t };
  } catch (e) {
    out.db = { ok: false, error: e instanceof Error ? e.message : "error" };
  }
  return Response.json(out, { headers: { "cache-control": "no-store" } });
}
