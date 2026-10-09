import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Loaded from node_modules at runtime (wasm files resolved relative to the package).
  serverExternalPackages: ["@electric-sql/pglite", "pg", "onnxruntime-web"],
  // Bundle the detector model and the ONNX runtime's wasm into the functions that scan frames.
  outputFileTracingIncludes: {
    "/api/scan": ["./models/*.onnx", "./node_modules/onnxruntime-web/dist/*.wasm", "./node_modules/onnxruntime-web/dist/*.mjs", "./src/lib/server/schema.sql"],
    "/api/pass": ["./models/*.onnx", "./node_modules/onnxruntime-web/dist/*.wasm", "./node_modules/onnxruntime-web/dist/*.mjs", "./src/lib/server/schema.sql"],
    "/**": ["./src/lib/server/schema.sql"],
  },
};

export default nextConfig;
