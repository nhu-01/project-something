import { syncCityReports } from "@/lib/server/city";

export const maxDuration = 60;

// Run daily by Vercel Cron (which sends "Authorization: Bearer $CRON_SECRET"), or by hand with the admin key.
export async function GET(req: Request) {
  const cron = Boolean(process.env.CRON_SECRET) && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  const admin = Boolean(process.env.ADMIN_KEY) && req.headers.get("x-admin-key") === process.env.ADMIN_KEY;
  if (!cron && !admin) return new Response("not found", { status: 404 });
  try {
    return Response.json(await syncCityReports());
  } catch (e) {
    console.error("city sync failed", e);
    return Response.json({ error: e instanceof Error ? e.message : "sync failed" }, { status: 502 });
  }
}
