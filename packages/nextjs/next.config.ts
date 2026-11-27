import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep verification builds separate from the app currently serving the user.
  distDir: process.env.BQS_NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
};

module.exports = nextConfig;
