import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const Verdict = z.object({
  pothole_present: z.boolean(),
  repair_patch_visible: z.boolean(),
  severity: z.number().int().min(1).max(5).nullable(),
  size: z.enum(["small", "medium", "large"]).nullable(),
  lane: z.enum(["right lane", "right lane, near curb", "center lane", "left lane", "bike lane", "crosswalk", "intersection", "unknown lane"]),
  road_type: z.enum(["street", "highway_or_ramp", "bridge_or_tunnel", "not_a_road"]),
  people_or_plates: z.boolean(),
  confidence: z.enum(["low", "medium", "high"]),
  note: z.string(),
});
export type Verdict = z.infer<typeof Verdict>;

const RUBRIC = `You check one frame from a bike/scooter/dash-mounted phone camera in New York City for potholes.
Return ONLY a JSON object with exactly these keys:
pothole_present (bool), repair_patch_visible (bool: a fresh asphalt patch where a pothole would be),
severity (int 1-5, or null if no pothole), size (small | medium | large | null),
lane (right lane | right lane, near curb | center lane | left lane | bike lane | crosswalk | intersection | unknown lane),
road_type (street | highway_or_ramp | bridge_or_tunnel | not_a_road),
people_or_plates (bool: identifiable faces or readable license plates in frame),
confidence (low | medium | high), note (one short lowercase sentence about what you see).

Severity: 1 shallow dip or surface crack. 2 small shallow hole under ~15 cm. 3 clear hole 15-30 cm, a real jolt.
4 deep or wide hole 30-60 cm, likely wheel damage, riders swerve. 5 very large or deep, serious hazard to bikes and scooters.
Be conservative: shadows, manhole covers, drains, puddles, stains and painted markings are NOT potholes.
If unsure, pothole_present=false with confidence "low". A photo of a screen showing a road counts as the road it shows.`;

export async function judgeFrame(frame: Buffer): Promise<Verdict> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey: key });
  // flash-lite answers in about a second, which a live ride needs. The API sometimes answers 429/503 under load;
  // a short retry usually gets through.
  let lastError: unknown;
  for (const waitMs of [0, 700, 1800]) {
    if (waitMs) await new Promise((r) => setTimeout(r, waitMs));
    try {
      const res = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: "image/jpeg", data: frame.toString("base64") } }, { text: RUBRIC }] }],
        config: { responseMimeType: "application/json", temperature: 0.1 },
      });
      return Verdict.parse(JSON.parse(res.text ?? "{}"));
    } catch (e) {
      lastError = e;
      if (!/"code":(429|500|503)|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(String((e as Error)?.message ?? e))) break;
    }
  }
  throw lastError;
}
