import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-tools badge (the round "N") is for developers, not for people trying the app on a phone.
  devIndicators: false,
  // The camera screen used to live at /ride; this is not a riding app.
  async redirects() {
    return [{ source: "/ride", destination: "/capture", permanent: true }];
  },
  // Loaded from node_modules at runtime (wasm files resolved relative to the package).
  serverExternalPackages: ["@electric-sql/pglite", "pg", "onnxruntime-web"],
  // Bundle the detector model and the ONNX runtime's wasm into the functions that scan frames.
  outputFileTracingIncludes: {
    "/api/scan": ["./models/*.onnx", "./node_modules/onnxruntime-web/dist/*.wasm", "./node_modules/onnxruntime-web/dist/*.mjs", "./src/lib/server/schema.sql"],
    "/**": ["./src/lib/server/schema.sql"],
  },
};

export default nextConfig;
