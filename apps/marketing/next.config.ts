import path from "node:path";
import type { NextConfig } from "next";
import exchangeConfig from "../../src/config/next-config.ts";

const repositoryRoot = path.resolve(__dirname, "../..");

const config: NextConfig = {
  ...exchangeConfig,
  outputFileTracingRoot: repositoryRoot,
  turbopack: { root: repositoryRoot },
};

export default config;
