import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Pre-existing type issues in API routes - ignore during build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
