import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import process from "node:process";
import { promisify } from "node:util";

import { verifyAppHostingSameShaEvidence } from "./verify-app-hosting-same-sha-evidence.mjs";

const execFileAsync = promisify(execFile);
const API = "https://firebaseapphosting.googleapis.com/v1";
const BACKEND = "projects/rfxchange/locations/us-east4/backends/rfxchange";
const ORIGIN = "https://rfxchange--rfxchange.us-east4.hosted.app";
const FULL_SHA = /^[0-9a-f]{40}$/i;

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function accessToken() {
  const configured = process.env.RFXCHANGE_APPHOSTING_ACCESS_TOKEN?.trim();
  if (configured) return configured;
  const { stdout } = await execFileAsync("gcloud", ["auth", "print-access-token"], { encoding: "utf8" });
  const token = stdout.trim();
  if (!token) throw new Error("gcloud did not return an access token.");
  return token;
}

async function getJson(token, resourceName) {
  const response = await fetch(`${API}/${resourceName}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Firebase App Hosting GET ${resourceName} failed with HTTP ${response.status}.`);
  }
  return response.json();
}

async function main() {
  const expectedSha = required("RFXCHANGE_BUILD_SHA").toLowerCase();
  if (!FULL_SHA.test(expectedSha)) throw new Error("RFXCHANGE_BUILD_SHA must be a full 40-character Git SHA.");
  const rolloutName = required("RFXCHANGE_APPHOSTING_ROLLOUT_NAME");
  const rollbackBuild = required("RFXCHANGE_APPHOSTING_ROLLBACK_BUILD");
  const ciRunUrl = required("RFXCHANGE_CI_RUN_URL");
  const outputPath = process.env.RFXCHANGE_APPHOSTING_EVIDENCE_OUTPUT?.trim() || "artifacts/app-hosting-same-sha-evidence.json";

  if (!rolloutName.startsWith(`${BACKEND}/rollouts/`)) throw new Error("RFXCHANGE_APPHOSTING_ROLLOUT_NAME must identify the production backend.");
  if (!rollbackBuild.startsWith(`${BACKEND}/builds/`)) throw new Error("RFXCHANGE_APPHOSTING_ROLLBACK_BUILD must identify a build on the production backend.");

  const token = await accessToken();
  const [backend, rollout] = await Promise.all([
    getJson(token, BACKEND),
    getJson(token, rolloutName),
  ]);
  if (typeof rollout.build !== "string" || !rollout.build.startsWith(`${BACKEND}/builds/`)) {
    throw new Error("Rollout does not reference a build on the production backend.");
  }
  const build = await getJson(token, rollout.build);

  const hostedResponse = await fetch(ORIGIN, { method: "GET", cache: "no-store", redirect: "follow" });
  const evidence = {
    expectedSha,
    ci: {
      sourceSha: expectedSha,
      conclusion: "success",
      runUrl: ciRunUrl,
    },
    backend: { name: backend.name },
    build,
    rollout,
    hosted: {
      origin: ORIGIN,
      observedAt: new Date().toISOString(),
      reachable: hostedResponse.ok,
      status: hostedResponse.status,
    },
    rollback: { build: rollbackBuild },
  };

  const verified = verifyAppHostingSameShaEvidence(evidence);
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ evidencePath: outputPath, ...verified }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
