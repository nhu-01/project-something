import { scanFrame } from "@/lib/server/core";
import { readFrameRequest } from "@/lib/server/http";

export const maxDuration = 60;

export async function POST(req: Request) {
  const r = await readFrameRequest(req);
  if ("error" in r) return r.error;
  try {
    return Response.json(await scanFrame(r.ride, r.frame, r.pos, r.form.get("manual") === "1"));
  } catch (e) {
    console.error("scan failed", e);
    return Response.json({ event: null, error: "scan failed" }, { status: 500 });
  }
}
