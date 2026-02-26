import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build a standalone server output so Docker image can copy only
  // the minimal runtime files.
  output: "standalone",
};

export default nextConfig;
