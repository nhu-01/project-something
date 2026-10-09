import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const Verdict = z.object({
  pothole_present: z.boolean(),
  hazard_type: z.enum(["pothole", "bump", "rough", "none"]),
  repair_patch_visible: z.boolean(),
  severity: z.number().int().min(1).max(5).nullable(),
  size: z.enum(["small", "medium", "large"]).nullable(),
  lane: z.enum(["right lane", "right lane, near curb", "center lane", "left lane", "bike lane", "crosswalk", "intersection", "sidewalk", "unknown lane"]),
  road_type: z.enum(["street", "sidewalk_or_path", "highway_or_ramp", "bridge_or_tunnel", "not_a_road"]),
  people_or_plates: z.boolean(),
  screen_or_print: z.boolean(),
  confidence: z.enum(["low", "medium", "high"]),
  note: z.string(),
});
export type Verdict = z.infer<typeof Verdict>;

const RUBRIC = `You check one frame from a bike/scooter/dash-mounted or handheld phone camera in New York City for road surface
hazards: anything in the pavement that could jolt or throw a bike, scooter or wheelchair.
Return ONLY a JSON object with exactly these keys:
pothole_present (bool: true when ANY such hazard is visible, not only a classic pothole),
hazard_type (pothole = a hole or missing chunk of the surface, including a missing or sunken brick or paver | bump = a raised or sunken spot such as a heave, ridge,
  sunken or raised utility cover, or a lip between slabs | rough = cracked, broken, crumbling or badly uneven pavement |
  none), repair_patch_visible (bool: a fresh asphalt patch where a pothole would be),
severity (int 1-5, or null if no hazard), size (small | medium | large | null),
lane (right lane | right lane, near curb | center lane | left lane | bike lane | crosswalk | intersection | sidewalk | unknown lane),
road_type (street | sidewalk_or_path = sidewalks, plazas, greenways, bike or foot paths, including brick and paver
  surfaces | highway_or_ramp | bridge_or_tunnel | not_a_road = indoors, grass, or no walkable/rideable surface),
people_or_plates (bool: identifiable faces or readable license plates in frame),
screen_or_print (bool: the camera is pointed at a picture rather than a real road: a phone, laptop, TV or monitor screen,
  a printed photo or poster. Clues: bezels or window chrome, pixel grid or moire, screen glare, a flat rectangle with the
  road inside it, UI elements, paper edges),
confidence (low | medium | high), note (one short lowercase sentence about what you see).

Severity (how hard it would hit a bike or scooter): 1 hairline cracks or a shallow dip. 2 small shallow hole or low bump,
under ~15 cm. 3 clear hole, ridge or broken patch 15-30 cm, a real jolt. 4 deep or wide, 30-60 cm, likely wheel damage,
riders swerve. 5 very large or deep, a serious hazard.
Not hazards: shadows, puddles, stains, painted markings, and flush, level manhole covers or drains.
If the surface looks smooth and rideable, pothole_present=false and hazard_type="none". If unsure, say false with confidence "low".
Still judge pothole_present for what the picture shows, even when screen_or_print is true.
A plain photo taken straight from a phone camera, looking down at the ground, is NOT a screen or print. Only say
screen_or_print=true when you can actually see the device, its bezel, on-screen interface, pixels or moire, or paper edges.`;

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
