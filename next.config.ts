import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["47.102.148.221"],
  experimental: {
    cpus: 1,
    memoryBasedWorkersCount: false,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
    staticGenerationRetryCount: 1,
    webpackMemoryOptimizations: true,
    webpackBuildWorker: false
  },
  typescript: {
    ignoreBuildErrors: true
  }
};

export default nextConfig;
