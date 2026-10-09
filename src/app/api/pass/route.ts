import { passCheck } from "@/lib/server/core";
import { bad, readFrameRequest } from "@/lib/server/http";

export const maxDuration = 60;

export async function POST(req: Request) {
  const r = await readFrameRequest(req);
  if ("error" in r) return r.error;
  const potholeId = Number(r.form.get("potholeId"));
  if (!Number.isInteger(potholeId)) return bad("potholeId required");
  try {
    return Response.json({ event: await passCheck(r.ride, potholeId, r.frame, r.pos) });
  } catch (e) {
    console.error("pass check failed", e);
    return Response.json({ event: null, error: "pass check failed" }, { status: 500 });
  }
}
