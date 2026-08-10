import type { NextConfig } from "next";

const FULL_GIT_SHA = /^[0-9a-f]{40}$/i;
const buildSha = process.env.RFXCHANGE_BUILD_SHA?.trim() || process.env.GITHUB_SHA?.trim() || "";
const hasBuildSha = FULL_GIT_SHA.test(buildSha);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(hasBuildSha ? { generateBuildId: async () => buildSha.toLowerCase() } : {}),
  env: {
    // Freeze the release identity into the compiled application artifact. Runtime environment
    // changes cannot relabel an already-built deployment; deployment automation must supply the
    // exact source commit before `next build` begins.
    RFXCHANGE_BUILD_SHA: hasBuildSha ? buildSha.toLowerCase() : "",
  },
  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
