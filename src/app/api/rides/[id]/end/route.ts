import { query } from "@/lib/server/db";
import { bad } from "@/lib/server/http";
import { authRide } from "@/lib/server/rides";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { token?: unknown } | null;
  if (!(await authRide(id, body?.token))) return bad("unknown or ended ride", 401);
  await query("UPDATE rides SET ended_at=now() WHERE id=$1", [id]);
  return Response.json({ ok: true });
}
