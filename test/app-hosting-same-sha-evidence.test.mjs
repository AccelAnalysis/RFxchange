import assert from "node:assert/strict";
import test from "node:test";

import { verifyAppHostingSameShaEvidence } from "../scripts/verify-app-hosting-same-sha-evidence.mjs";

const SHA = "5f0272c3e0d7172792eeee3b1792bbf934375783";
const BACKEND = "projects/rfxchange/locations/us-east4/backends/rfxchange";

function evidence(overrides = {}) {
  return {
    expectedSha: SHA,
    ci: {
      sourceSha: SHA,
      conclusion: "success",
      runUrl: "https://github.com/AccelAnalysis/RFxchange/actions/runs/123",
    },
    backend: { name: BACKEND },
    build: {
      name: `${BACKEND}/builds/build-${SHA.slice(0, 12)}`,
      state: "READY",
      source: { codebase: { hash: SHA } },
      config: {
        effectiveEnv: [{
          variable: "RFXCHANGE_BUILD_SHA",
          value: SHA,
          origin: "BACKEND_OVERRIDES",
          availability: ["BUILD", "RUNTIME"],
        }],
      },
    },
    rollout: {
      name: `${BACKEND}/rollouts/rollout-${SHA.slice(0, 12)}`,
      state: "SUCCEEDED",
      build: `${BACKEND}/builds/build-${SHA.slice(0, 12)}`,
    },
    hosted: {
      origin: "https://rfxchange--rfxchange.us-east4.hosted.app",
      observedAt: "2026-09-05T20:00:00Z",
      reachable: true,
    },
    rollback: {
      build: `${BACKEND}/builds/build-prior-good`,
    },
    ...overrides,
  };
}

test("accepts exact source, environment, build and rollout identity", () => {
  const result = verifyAppHostingSameShaEvidence(evidence());
  assert.equal(result.status, "same-sha-evidence-accepted");
  assert.equal(result.expectedSha, SHA);
});

test("rejects source/build SHA mismatch", () => {
  assert.throws(
    () => verifyAppHostingSameShaEvidence(evidence({
      build: {
        ...evidence().build,
        source: { codebase: { hash: "a".repeat(40) } },
      },
    })),
    /source hash must equal expectedSha/,
  );
});

test("rejects an environment value not bound from backend overrides", () => {
  assert.throws(
    () => verifyAppHostingSameShaEvidence(evidence({
      build: {
        ...evidence().build,
        config: {
          effectiveEnv: [{
            variable: "RFXCHANGE_BUILD_SHA",
            value: SHA,
            origin: "APPHOSTING_YAML",
            availability: ["BUILD", "RUNTIME"],
          }],
        },
      },
    })),
    /documented backend override boundary/,
  );
});

test("rejects a rollout that does not point to the verified build", () => {
  assert.throws(
    () => verifyAppHostingSameShaEvidence(evidence({
      rollout: {
        ...evidence().rollout,
        build: `${BACKEND}/builds/other-build`,
      },
    })),
    /exact verified build/,
  );
});
