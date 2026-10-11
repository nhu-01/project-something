import { query } from "@/lib/server/db";

// Maintenance: rider-found hazards that have no picture anywhere (and anything matching ?match=text) are not worth
// showing. GET lists them; POST with { ids } hides exactly those (merged_into = -1, so it can be undone).
// Needs the admin key.
const allowed = (req: Request) => Boolean(process.env.ADMIN_KEY) && req.headers.get("x-admin-key") === process.env.ADMIN_KEY;

type Row = { id: number; street: string; borough: string; kind: string | null; status: string; first_seen: string; sights: number; photo: boolean };

async function candidates(match: string | null) {
  return query<Row>(
    `SELECT p.id, p.street, p.borough, p.kind, p.status, p.first_seen::text AS first_seen,
            (SELECT COUNT(*)::int FROM sightings s WHERE s.pothole_id = p.id) AS sights,
            (p.photo IS NOT NULL) AS photo
       FROM potholes p
      WHERE p.merged_into IS NULL
        AND ((p.photo IS NULL AND NOT EXISTS (SELECT 1 FROM sightings s WHERE s.pothole_id = p.id AND s.photo IS NOT NULL))
             OR ($1::text IS NOT NULL AND p.street ILIKE '%' || $1 || '%'))
      ORDER BY p.id`, [match]);
}

export async function GET(req: Request) {
  if (!allowed(req)) return new Response("not found", { status: 404 });
  const match = new URL(req.url).searchParams.get("match");
  return Response.json({ candidates: await candidates(match) });
}

export async function POST(req: Request) {
  if (!allowed(req)) return new Response("not found", { status: 404 });
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((n): n is number => Number.isInteger(n)) : [];
  if (!ids.length) return Response.json({ error: "ids required" }, { status: 400 });
  const done = await query<{ id: number }>("UPDATE potholes SET merged_into = -1 WHERE merged_into IS NULL AND id = ANY($1::int[]) RETURNING id", [ids]);
  return Response.json({ hidden: done.map((r) => r.id) });
}
