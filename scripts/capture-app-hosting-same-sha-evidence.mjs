import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
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

  // Resolve the supplied URL through GitHub; a URL is not evidence of a passing run.
  const ciMatch = /^https:\/\/github\.com\/AccelAnalysis\/RFxchange\/actions\/runs\/(\d+)$/.exec(ciRunUrl);
  if (!ciMatch) throw new Error("CI URL must identify an RFxchange GitHub Actions run.");
  const ciResponse = await fetch(`https://api.github.com/repos/AccelAnalysis/RFxchange/actions/runs/${ciMatch[1]}`, {
    headers: { Accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
    redirect: "error",
  });
  if (!ciResponse.ok) throw new Error(`GitHub CI lookup failed with HTTP ${ciResponse.status}.`);
  const ciRun = await ciResponse.json();
  if (ciRun.head_sha !== expectedSha || ciRun.status !== "completed" || ciRun.conclusion !== "success" ||
      ciRun.name !== "production-ci" || ciRun.head_branch !== "main" || ciRun.event !== "push" ||
      ciRun.repository?.full_name !== "AccelAnalysis/RFxchange") {
    throw new Error("CI must be a successful production-ci push run for the exact merged main SHA.");
  }
  const token = await accessToken();
  const [backend, rollout] = await Promise.all([
    getJson(token, BACKEND),
    getJson(token, rolloutName),
  ]);
  if (typeof rollout.build !== "string" || !rollout.build.startsWith(`${BACKEND}/builds/`)) {
    throw new Error("Rollout does not reference a build on the production backend.");
  }
  const [build, rollback] = await Promise.all([
    getJson(token, rollout.build), getJson(token, rollbackBuild),
  ]);
  if (rollback.state !== "READY") throw new Error("Rollback build is not READY.");

  const hostedResponse = await fetch(ORIGIN, { method: "GET", cache: "no-store", redirect: "follow" });
  const evidence = {
    expectedSha,
    ci: {
      sourceSha: ciRun.head_sha,
      conclusion: ciRun.conclusion,
      status: ciRun.status,
      workflow: ciRun.name,
      branch: ciRun.head_branch,
      event: ciRun.event,
      repository: ciRun.repository.full_name,
      runUrl: ciRun.html_url,
    },
    backend: { name: backend.name },
    // Never persist the complete resolved environment: unrelated plaintext values may be secrets.
    build: {
      name: build.name, state: build.state, source: { codebase: { hash: build.source?.codebase?.hash } },
      config: { effectiveEnv: (build.config?.effectiveEnv ?? []).filter(entry => entry.variable === "RFXCHANGE_BUILD_SHA") },
    },
    rollout: { name: rollout.name, state: rollout.state, build: rollout.build },
    hosted: {
      origin: ORIGIN,
      observedAt: new Date().toISOString(),
      reachable: hostedResponse.ok,
      status: hostedResponse.status,
    },
    rollback: { build: rollback.name, state: rollback.state },
  };

  const verified = verifyAppHostingSameShaEvidence(evidence);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ evidencePath: outputPath, ...verified }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
