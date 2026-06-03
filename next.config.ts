import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["47.102.148.221"],
  typescript: {
    ignoreBuildErrors: true
  }
};

export default nextConfig;
