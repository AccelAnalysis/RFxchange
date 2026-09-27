import { spawnSync } from "node:child_process";

// One emulator process; keep authorization, tenant, transaction and provider smoke coverage.
const scripts = [
  "scripts/smoke-firebase-auth-emulator.mjs",
  "scripts/smoke-firebase-user-resolution-emulator.mjs",
  "scripts/smoke-firebase-server-session-emulator.mjs",
  "scripts/smoke-firebase-authentication-lifecycle-emulator.mjs",
  "scripts/smoke-firebase-auth-firestore-security-emulator.mjs",
  "scripts/smoke-first-persisted-authenticated-vertical-slice-emulator.mjs",
  "scripts/smoke-geography-authority-emulator.mjs",
  "scripts/smoke-organization-resolution-emulator.mjs",
  "scripts/smoke-organization-authority-claims-emulator.mjs",
  "scripts/smoke-organization-location-emulator.mjs",
  "scripts/smoke-essential-organization-profile-emulator.mjs",
  "scripts/smoke-marker-activation-emulator.mjs",
  "scripts/smoke-controlled-network-discovery-emulator.mjs",
  "scripts/smoke-acquisition-continuity-emulator.mjs",
  "scripts/smoke-orientation-discovery-team-emulator.mjs",
  "scripts/smoke-first-value-open-emulator.mjs",
  "scripts/smoke-ai-amacs-interpretation-emulator.mjs",
  "scripts/smoke-market-profile-enrichment-emulator.mjs",
  "scripts/smoke-organization-enrichment-emulator.mjs",
  "scripts/smoke-referral-network-emulator.mjs",
  "scripts/smoke-resource-provider-foundation-emulator.mjs",
  "scripts/smoke-resource-network-emulator.mjs",
  "scripts/smoke-network-education-emulator.mjs",
  "scripts/smoke-rfx-kernel-emulator.mjs",
  "scripts/smoke-admin-domain-operations-emulator.mjs",
  "scripts/smoke-firebase-functions-runtime-emulator.mjs",
  "scripts/smoke-firebase-background-jobs-emulator.mjs",
  "scripts/smoke-transactional-email-reliability-emulator.mjs",
  "scripts/smoke-firebase-storage-emulator.mjs",
  "scripts/smoke-sad-runtime-emulator.mjs",
  "scripts/validate-market-ready-founding-commerce-firestore-emulator.mjs"
];
for (const script of scripts) {
  const result = spawnSync(process.execPath, ["--experimental-transform-types", "--experimental-loader", "./scripts/node-typescript-source-loader.mjs", script], { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
