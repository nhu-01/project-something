import "server-only";
import { authRide } from "./rides";
import type { Position } from "./core";

export const bad = (error: string, status = 400) => Response.json({ error }, { status });

const num = (v: FormDataEntryValue | null) => (v == null || v === "" ? null : Number(v));

// Shared parsing for the two frame endpoints: ride auth, a small JPEG, and a GPS fix.
export async function readFrameRequest(req: Request) {
  const form = await req.formData();
  const ride = await authRide(form.get("rideId"), form.get("token"));
  if (!ride) return { error: bad("unknown or ended ride", 401) } as const;
  const file = form.get("frame");
  if (!(file instanceof File) || file.size === 0 || file.size > 600_000) return { error: bad("frame missing or too large") } as const;
  const lat = num(form.get("lat")), lng = num(form.get("lng"));
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return { error: bad("location missing") } as const;
  const heading = num(form.get("heading")), accuracy = num(form.get("accuracy"));
  const pos: Position = { lat, lng, heading: heading != null && Number.isFinite(heading) ? heading : null, accuracy: accuracy != null && Number.isFinite(accuracy) ? accuracy : null };
  return { ride, pos, frame: Buffer.from(await file.arrayBuffer()), form } as const;
}
