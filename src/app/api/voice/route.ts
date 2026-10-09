import { createHash } from "node:crypto";
import { head, put } from "@vercel/blob";
import { allPhrases } from "@/lib/voice";

export const maxDuration = 30;

const PHRASES = allPhrases();
const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"; // ElevenLabs premade voice "Rachel"

// Speaks one of the app's fixed phrases with ElevenLabs. Each phrase is generated once, then served from Blob.
export async function GET(req: Request) {
  const text = new URL(req.url).searchParams.get("text") ?? "";
  if (!PHRASES.has(text)) return new Response("unknown phrase", { status: 400 });
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return new Response("voice not configured", { status: 501 });
  const voice = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
  const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const pathname = `voice/${voice}/${createHash("sha1").update(text).digest("hex")}.mp3`;

  if (useBlob) {
    const cached = await head(pathname).catch(() => null);
    if (cached) return Response.redirect(cached.url, 302);
  }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    console.error("elevenlabs failed", res.status, (await res.text()).slice(0, 200));
    return new Response("voice failed", { status: 502 });
  }
  const audio = Buffer.from(await res.arrayBuffer());
  if (useBlob) await put(pathname, audio, { access: "public", contentType: "audio/mpeg", addRandomSuffix: false, allowOverwrite: true }).catch(() => {});
  return new Response(audio, { headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=31536000, immutable" } });
}
