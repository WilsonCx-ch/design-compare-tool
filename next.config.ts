import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname,
  serverExternalPackages: ["sharp", "pixelmatch"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
