import { query } from "@/lib/server/db";

// Read-only look at the database for demos: which tables are hypertables, how big each table is, its columns, and a few
// recent rows. Photo URLs are left out. Needs the admin key.
const allowed = (req: Request) => Boolean(process.env.ADMIN_KEY) && req.headers.get("x-admin-key") === process.env.ADMIN_KEY;
const TABLES = ["rides", "potholes", "sightings", "city_reports", "city_photos", "ride_points"] as const;

export async function GET(req: Request) {
  if (!allowed(req)) return new Response("not found", { status: 404 });
  const hypertables = await query("SELECT hypertable_name, num_chunks, compression_enabled FROM timescaledb_information.hypertables").catch(() => []);
  const tables: Record<string, unknown> = {};
  for (const t of TABLES) {
    try {
      const [{ n }] = await query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM ${t}`);
      const columns = await query<{ c: string }>("SELECT column_name || ' ' || data_type AS c FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position", [t]);
      tables[t] = { rows: n, columns: columns.map((c) => c.c) };
    } catch { tables[t] = { missing: true }; }
  }
  const sightings = await query("SELECT id, at::text, pothole_id, kind, severity, ROUND(yolo_conf::numeric, 2) AS yolo_conf, LEFT(note, 50) AS note FROM sightings ORDER BY at DESC LIMIT 5");
  const potholes = await query("SELECT id, street, borough, kind, severity, status, first_seen::text FROM potholes WHERE merged_into IS NULL ORDER BY last_seen DESC LIMIT 5");
  const city = await query("SELECT id, LEFT(place, 40) AS place, borough, status, photo_count, created_at::text FROM city_reports ORDER BY created_at DESC LIMIT 5");
  return Response.json({ hypertables, tables, samples: { sightings, potholes, city_reports: city } }, { headers: { "cache-control": "no-store" } });
}
