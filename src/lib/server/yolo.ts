import "server-only";
import path from "node:path";
import jpeg from "jpeg-js";

// YOLOv8s road-damage detector (Apache-2.0, vinothvikas1987/pothole-detection-yolov8), run with onnxruntime-web's
// WASM backend so it fits in a serverless function. Classes: 0-2 cracks, 3 pothole, 4 other.
const MODEL_PATH = path.join(process.cwd(), "models", "pothole-yolov8s.onnx");
const SIZE = 640;
// Classes 0-3 are surface damage (three kinds of crack, then pothole). Class 4 is "other" (manhole covers,
// patches, road markings), which we ignore.
const DAMAGE_CLASSES = [0, 1, 2, 3];

type Ort = typeof import("onnxruntime-web");
const g = globalThis as unknown as { __yolo?: Promise<{ ort: Ort; session: import("onnxruntime-web").InferenceSession }> };

function session() {
  return (g.__yolo ??= (async () => {
    const ort: Ort = await import("onnxruntime-web");
    ort.env.wasm.numThreads = 1;
    return { ort, session: await ort.InferenceSession.create(MODEL_PATH, { executionProviders: ["wasm"] }) };
  })().catch((e) => { g.__yolo = undefined; throw e; }));
}

// The client sends a 640x640 letterboxed JPEG, so this only decodes and runs the model.
// Returns the best surface-damage confidence in the frame (0 when nothing is found).
export async function damageConfidence(frame: Buffer): Promise<number> {
  const img = jpeg.decode(frame, { useTArray: true, formatAsRGBA: true });
  if (img.width !== SIZE || img.height !== SIZE) throw new Error(`frame must be ${SIZE}x${SIZE}`);
  const plane = SIZE * SIZE;
  const data = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    data[i] = img.data[i * 4] / 255;
    data[plane + i] = img.data[i * 4 + 1] / 255;
    data[2 * plane + i] = img.data[i * 4 + 2] / 255;
  }
  const { ort, session: s } = await session();
  const res = await s.run({ [s.inputNames[0]]: new ort.Tensor("float32", data, [1, 3, SIZE, SIZE]) });
  const out = res[s.outputNames[0]];
  const n = out.dims[2];
  const all = out.data as Float32Array;
  let max = 0;
  for (const c of DAMAGE_CLASSES) {
    const scores = all.subarray((4 + c) * n, (5 + c) * n);
    for (let i = 0; i < n; i++) if (scores[i] > max) max = scores[i];
  }
  return max;
}

// The detector needs a square frame, so the phone pads the camera image with flat gray bars. Those bars make a real
// photo look like a picture-in-a-frame to Gemini, so they are cut off again before Gemini sees it.
const PAD = 0x72, PAD_TOLERANCE = 10;
export function stripPadding(frame: Buffer): Buffer {
  const img = jpeg.decode(frame, { useTArray: true, formatAsRGBA: true });
  const { width: w, height: h, data } = img;
  const isPad = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return Math.abs(data[i] - PAD) <= PAD_TOLERANCE && Math.abs(data[i + 1] - PAD) <= PAD_TOLERANCE && Math.abs(data[i + 2] - PAD) <= PAD_TOLERANCE;
  };
  // a row or column counts as padding when (nearly) every sampled pixel on it is the padding gray
  const colPad = (x: number) => { let n = 0; for (let y = 4; y < h; y += 16) if (isPad(x, y)) n++; return n >= Math.floor((h - 4) / 16) * 0.97; };
  const rowPad = (y: number) => { let n = 0; for (let x = 4; x < w; x += 16) if (isPad(x, y)) n++; return n >= Math.floor((w - 4) / 16) * 0.97; };
  let left = 0, right = w - 1, top = 0, bottom = h - 1;
  while (left < right && colPad(left)) left++;
  while (right > left && colPad(right)) right--;
  while (top < bottom && rowPad(top)) top++;
  while (bottom > top && rowPad(bottom)) bottom--;
  // JPEG blurs the edge of the bars a little, so shave a few more pixels
  if (left > 0) left = Math.min(right, left + 3);
  if (right < w - 1) right = Math.max(left, right - 3);
  if (top > 0) top = Math.min(bottom, top + 3);
  if (bottom < h - 1) bottom = Math.max(top, bottom - 3);
  const cw = right - left + 1, ch = bottom - top + 1;
  if (cw === w && ch === h) return frame; // nothing to cut
  if (cw < 64 || ch < 64) return frame; // a nearly all-gray scene: leave it alone
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) out.set(data.subarray(((y + top) * w + left) * 4, ((y + top) * w + left + cw) * 4), y * cw * 4);
  return Buffer.from(jpeg.encode({ data: out, width: cw, height: ch }, 85).data);
}
