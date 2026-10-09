import { bad } from "@/lib/server/http";
import { startRide } from "@/lib/server/rides";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { deviceId?: unknown } | null;
  if (typeof body?.deviceId !== "string" || body.deviceId.length < 8 || body.deviceId.length > 80) return bad("deviceId required");
  return Response.json(await startRide(body.deviceId));
}
