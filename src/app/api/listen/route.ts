import { authRide } from "@/lib/server/rides";
import { bad } from "@/lib/server/http";

export const maxDuration = 30;

// Voice commands ("take a picture here"): a short audio clip is transcribed by ElevenLabs speech-to-text and the
// text goes back to the phone, which decides whether it was a command. Only a live ride can call this, the clip is
// small, and nothing is stored.
export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return bad("voice commands are not set up", 503);
  const form = await req.formData();
  const ride = await authRide(form.get("rideId"), form.get("token"));
  if (!ride) return bad("unknown or ended ride", 401);
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size < 800 || audio.size > 400_000) return bad("audio missing or too large");

  const out = new FormData();
  out.append("model_id", "scribe_v1");
  out.append("file", audio, audio.name || "clip.webm");
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: out, signal: AbortSignal.timeout(15000) });
    // a key without the speech-to-text permission is the same as the feature being off
    if (res.status === 401 || res.status === 403) return bad("voice commands are not enabled for this key", 503);
    if (!res.ok) return bad("transcription failed", 502);
    const body = (await res.json()) as { text?: string };
    return Response.json({ text: (body.text ?? "").slice(0, 200) }, { headers: { "cache-control": "no-store" } });
  } catch {
    return bad("transcription failed", 502);
  }
}
