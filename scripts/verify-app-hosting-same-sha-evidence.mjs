import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import process from "node:process";

const FULL_SHA = /^[0-9a-f]{40}$/i;
const EXPECTED_BACKEND = "projects/rfxchange/locations/us-east4/backends/rfxchange";
const EXPECTED_ORIGIN = "https://rfxchange--rfxchange.us-east4.hosted.app";

function requiredString(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string.`);
  const normalized = value.trim();
  assert.ok(normalized, `${label} must not be empty.`);
  return normalized;
}

function requiredSha(value, label) {
  const normalized = requiredString(value, label).toLowerCase();
  assert.match(normalized, FULL_SHA, `${label} must be a complete 40-character Git SHA.`);
  return normalized;
}

function variableByName(build, variableName) {
  const effective = build?.config?.effectiveEnv;
  assert.ok(Array.isArray(effective), "App Hosting build.config.effectiveEnv must be present in captured evidence.");
  return effective.find((entry) => entry?.variable === variableName) ?? null;
}

export function verifyAppHostingSameShaEvidence(evidence) {
  assert.ok(evidence && typeof evidence === "object" && !Array.isArray(evidence), "Evidence must be a JSON object.");

  const expectedSha = requiredSha(evidence.expectedSha, "expectedSha");
  const ciSha = requiredSha(evidence?.ci?.sourceSha, "ci.sourceSha");
  assert.equal(ciSha, expectedSha, "Exact-head CI source SHA must equal expectedSha.");
  assert.equal(evidence?.ci?.conclusion, "success", "Exact-head CI must have succeeded.");
  requiredString(evidence?.ci?.runUrl, "ci.runUrl");

  const backendName = requiredString(evidence?.backend?.name, "backend.name");
  assert.equal(backendName, EXPECTED_BACKEND, "Evidence must target the existing production App Hosting backend.");

  const buildName = requiredString(evidence?.build?.name, "build.name");
  assert.ok(buildName.startsWith(`${EXPECTED_BACKEND}/builds/`), "Build must belong to the production backend.");
  const sourceHash = requiredSha(evidence?.build?.source?.codebase?.hash, "build.source.codebase.hash");
  assert.equal(sourceHash, expectedSha, "Firebase-resolved immutable source hash must equal expectedSha.");
  assert.equal(evidence?.build?.state, "READY", "App Hosting build must be READY.");

  const boundSha = variableByName(evidence.build, "RFXCHANGE_BUILD_SHA");
  assert.ok(boundSha, "Resolved build environment must contain RFXCHANGE_BUILD_SHA.");
  assert.equal(requiredSha(boundSha.value, "RFXCHANGE_BUILD_SHA value"), expectedSha, "Resolved RFXCHANGE_BUILD_SHA must equal source hash.");
  assert.equal(boundSha.origin, "BACKEND_OVERRIDES", "RFXCHANGE_BUILD_SHA must come from the documented backend override boundary.");
  assert.ok(Array.isArray(boundSha.availability), "RFXCHANGE_BUILD_SHA availability must be captured.");
  assert.ok(boundSha.availability.includes("BUILD"), "RFXCHANGE_BUILD_SHA must be available during BUILD.");
  assert.ok(boundSha.availability.includes("RUNTIME"), "RFXCHANGE_BUILD_SHA must be available during RUNTIME.");

  const rolloutName = requiredString(evidence?.rollout?.name, "rollout.name");
  assert.ok(rolloutName.startsWith(`${EXPECTED_BACKEND}/rollouts/`), "Rollout must belong to the production backend.");
  assert.equal(evidence?.rollout?.state, "SUCCEEDED", "App Hosting rollout must have succeeded.");
  assert.equal(evidence?.rollout?.build, buildName, "Rollout must point to the exact verified build.");

  const hostedOrigin = requiredString(evidence?.hosted?.origin, "hosted.origin");
  assert.equal(hostedOrigin, EXPECTED_ORIGIN, "Hosted evidence must target the reserved production origin.");
  requiredString(evidence?.hosted?.observedAt, "hosted.observedAt");
  assert.ok(Number.isFinite(Date.parse(evidence.hosted.observedAt)), "hosted.observedAt must be an RFC 3339-compatible timestamp.");
  assert.equal(evidence?.hosted?.reachable, true, "Production origin must be reachable after rollout.");

  const rollbackBuild = requiredString(evidence?.rollback?.build, "rollback.build");
  assert.ok(rollbackBuild.startsWith(`${EXPECTED_BACKEND}/builds/`), "Rollback build must belong to the same backend.");
  assert.notEqual(rollbackBuild, buildName, "Rollback target must be distinct from the new build.");

  return Object.freeze({
    status: "same-sha-evidence-accepted",
    expectedSha,
    backend: backendName,
    build: buildName,
    rollout: rolloutName,
    hostedOrigin,
    rollbackBuild,
  });
}

async function main() {
  const evidencePath = process.argv[2];
  if (!evidencePath) {
    throw new Error("Usage: node scripts/verify-app-hosting-same-sha-evidence.mjs <evidence.json>");
  }
  const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
  const result = verifyAppHostingSameShaEvidence(evidence);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.endsWith("verify-app-hosting-same-sha-evidence.mjs")) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
