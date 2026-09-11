import path from "node:path";
import type { NextConfig } from "next";
import exchangeConfig from "../../next.config.ts";

const repositoryRoot = path.resolve(__dirname, "../..");

const config: NextConfig = {
  ...exchangeConfig,
  outputFileTracingRoot: repositoryRoot,
  turbopack: { root: repositoryRoot },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
        { key: "Cache-Control", value: "private, no-store" },
        { key: "Referrer-Policy", value: "same-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    }];
  },
};

export default config;
