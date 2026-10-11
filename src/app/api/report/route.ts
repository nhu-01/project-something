import { reportPhoto } from "@/lib/server/core";
import { validPoint } from "@/lib/server/geo";
import { bad } from "@/lib/server/http";
import { endRide, reportsInLastHour, startRide } from "@/lib/server/rides";

export const maxDuration = 60;
const MAX_PER_HOUR = 12;

// A photo and a location, submitted by hand from /submit.
export async function POST(req: Request) {
  const form = await req.formData();
  const deviceId = form.get("deviceId");
  if (typeof deviceId !== "string" || deviceId.length < 8 || deviceId.length > 80) return bad("deviceId required");
  const photo = form.get("photo");
  if (!(photo instanceof File) || !photo.size) return bad("photo required");
  if (photo.size > 3_500_000) return bad("photo is too large");
  const lat = Number(form.get("lat")), lng = Number(form.get("lng"));
  if (!validPoint(lat, lng)) return bad("location required");
  if ((await reportsInLastHour(deviceId)) >= MAX_PER_HOUR) return bad("that's a lot of reports in one hour. try again a little later.", 429);

  const ride = await startRide(deviceId, "report");
  try {
    const result = await reportPhoto({ id: ride.rideId, rider: ride.rider }, Buffer.from(await photo.arrayBuffer()), { lat, lng, heading: null, accuracy: null });
    return Response.json(result);
  } catch (e) {
    console.error("report failed", e);
    return bad("we couldn't check that photo. please try again.", 500);
  } finally {
    await endRide(ride.rideId).catch(() => {});
  }
}
