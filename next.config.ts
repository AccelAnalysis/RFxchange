import type { NextConfig } from "next";

const buildSha = process.env.RFXCHANGE_BUILD_SHA?.trim() || process.env.GITHUB_SHA?.trim() || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    // Freeze the release identity into the compiled application artifact. Runtime environment
    // changes cannot relabel an already-built deployment; deployment automation must supply the
    // exact source commit before `next build` begins.
    RFXCHANGE_BUILD_SHA: buildSha,
  },
  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
