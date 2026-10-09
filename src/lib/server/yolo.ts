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
