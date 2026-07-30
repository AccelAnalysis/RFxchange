import test from "node:test";
import assert from "node:assert/strict";

import {
  SYSTEM_OPERATIONS_HEALTH_SURFACES,
  buildSystemOperationsHealthSnapshot,
  collectSystemOperationsHealth,
} from "../src/application/admin/system-operations-health.ts";
import {
  createDeploymentStatusProbe,
  createEnvironmentStatusProbe,
  createStaticSystemHealthProbe,
} from "../src/infrastructure/system/runtime-health-probes.ts";
import {
  defaultAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";

const now = "2026-07-30T17:00:00.000Z";
const root = resolveAuthorityContextFromAdminRolePreset("admin-root", defaultAdminRolePreset("super-admin"));
const technical = resolveAuthorityContextFromAdminRolePreset("admin-tech", defaultAdminRolePreset("technical-system-administrator"));
const support = resolveAuthorityContextFromAdminRolePreset("admin-support", defaultAdminRolePreset("member-success-support-administrator"));

function healthy(surface, overrides = {}) {
  return {
    state: "operational",
    summary: `${surface} operational`,
    checkedAt: now,
    source: `test:${surface}`,
    version: null,
    metrics: {},
    diagnosticReference: null,
    ...overrides,
  };
}

test("ADM-046 defines every required technical operations health surface", () => {
  assert.deepEqual(SYSTEM_OPERATIONS_HEALTH_SURFACES, [
    "feature-flags",
    "environment",
    "firebase-functions",
    "scheduled-jobs",
    "failed-jobs",
    "webhooks",
    "apis",
    "sam-gov",
    "geocoding",
    "maps",
    "email-delivery",
    "file-storage",
    "search-index",
    "deployment",
    "data-migrations",
    "backups",
    "error-monitoring",
    "rate-limits",
  ]);
});

test("Technical/System Administrator and Super Admin can read health while support cannot", () => {
  assert.equal(buildSystemOperationsHealthSnapshot(technical, now, {}).measurements.length, 18);
  assert.equal(buildSystemOperationsHealthSnapshot(root, now, {}).measurements.length, 18);
  assert.throws(() => buildSystemOperationsHealthSnapshot(support, now, {}), /permission-not-granted/);
});

test("dashboard never omits an unprobed required surface", () => {
  const snapshot = buildSystemOperationsHealthSnapshot(technical, now, {
    "file-storage": healthy("file-storage"),
  });
  assert.equal(snapshot.measurements.length, SYSTEM_OPERATIONS_HEALTH_SURFACES.length);
  assert.equal(snapshot.measurements.find((item) => item.surface === "file-storage").state, "operational");
  assert.equal(snapshot.measurements.find((item) => item.surface === "sam-gov").state, "unknown");
  assert.equal(snapshot.unknownCount, 17);
  assert.equal(snapshot.overall, "unknown");
});

test("overall state prioritizes outage then degradation then unknown", () => {
  const allHealthy = Object.fromEntries(SYSTEM_OPERATIONS_HEALTH_SURFACES.map((surface) => [surface, healthy(surface)]));
  assert.equal(buildSystemOperationsHealthSnapshot(technical, now, allHealthy).overall, "operational");
  assert.equal(buildSystemOperationsHealthSnapshot(technical, now, { ...allHealthy, webhooks: healthy("webhooks", { state: "degraded" }) }).overall, "degraded");
  assert.equal(buildSystemOperationsHealthSnapshot(technical, now, { ...allHealthy, backups: healthy("backups", { state: "outage" }) }).overall, "outage");
});

test("probe collection converts probe failures to visible unknown status", async () => {
  const probes = [
    createStaticSystemHealthProbe({ surface: "file-storage", state: "operational", summary: "Storage responding", checkedAt: () => now, source: "storage-probe" }),
    { surface: "webhooks", async check() { throw new Error("provider timeout"); } },
  ];
  const snapshot = await collectSystemOperationsHealth(technical, now, probes);
  assert.equal(snapshot.measurements.find((item) => item.surface === "file-storage").state, "operational");
  const webhooks = snapshot.measurements.find((item) => item.surface === "webhooks");
  assert.equal(webhooks.state, "unknown");
  assert.equal(webhooks.diagnosticReference, "Error");
});

test("duplicate probes fail rather than producing ambiguous health", async () => {
  const probe = createStaticSystemHealthProbe({ surface: "maps", state: "operational", summary: "Map healthy", checkedAt: () => now, source: "map-probe" });
  await assert.rejects(() => collectSystemOperationsHealth(technical, now, [probe, probe]), /Duplicate system health probe/);
});

test("environment probe detects Firebase project mismatch", async () => {
  const good = createEnvironmentStatusProbe({ environment: "staging", projectId: "rfx-staging", expectedProjectId: "rfx-staging", region: "us-east1" }, () => now);
  const bad = createEnvironmentStatusProbe({ environment: "staging", projectId: "rfx-production", expectedProjectId: "rfx-staging", region: "us-east1" }, () => now);
  assert.equal((await good.check()).state, "operational");
  assert.equal((await bad.check()).state, "outage");
  assert.equal((await bad.check()).diagnosticReference, "firebase-project-mismatch");
});

test("deployment probe surfaces missing deployment identity instead of hiding it", async () => {
  const configured = createDeploymentStatusProbe({ version: "2026.07.30", commitSha: "abc123", environment: "staging" }, () => now);
  const absent = createDeploymentStatusProbe({ version: null, commitSha: null, environment: "staging" }, () => now);
  assert.equal((await configured.check()).state, "operational");
  assert.equal((await absent.check()).state, "not-configured");
});
