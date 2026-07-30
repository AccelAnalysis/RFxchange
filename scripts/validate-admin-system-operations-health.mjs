import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  SYSTEM_OPERATIONS_HEALTH_SURFACES,
  buildSystemOperationsHealthSnapshot,
} from "../src/application/admin/system-operations-health.ts";
import {
  defaultAdminRolePreset,
  resolveAuthorityContextFromAdminRolePreset,
} from "../src/domain/admin-authorization/role-presets.ts";

assert.equal(SYSTEM_OPERATIONS_HEALTH_SURFACES.length, 18);
for (const required of [
  "feature-flags", "environment", "firebase-functions", "scheduled-jobs", "failed-jobs",
  "webhooks", "apis", "sam-gov", "geocoding", "maps", "email-delivery", "file-storage",
  "search-index", "deployment", "data-migrations", "backups", "error-monitoring", "rate-limits",
]) assert.ok(SYSTEM_OPERATIONS_HEALTH_SURFACES.includes(required));

const technical = resolveAuthorityContextFromAdminRolePreset("guard-tech", defaultAdminRolePreset("technical-system-administrator"));
const support = resolveAuthorityContextFromAdminRolePreset("guard-support", defaultAdminRolePreset("member-success-support-administrator"));
assert.equal(buildSystemOperationsHealthSnapshot(technical, "2026-07-30T17:00:00.000Z", {}).measurements.length, 18);
assert.throws(() => buildSystemOperationsHealthSnapshot(support, "2026-07-30T17:00:00.000Z", {}), /permission-not-granted/);

const model = await readFile("src/application/admin/system-operations-health.ts", "utf8");
assert.match(model, /system\.health\.read/);
assert.match(model, /No health probe result is currently available/);
assert.match(model, /Duplicate system health probe/);
assert.equal(/firebase-admin|firebase\//.test(model), false, "health aggregation must remain provider-independent");

const probes = await readFile("src/infrastructure/system/runtime-health-probes.ts", "utf8");
assert.match(probes, /firebase-project-mismatch/);
assert.match(probes, /deployment/);

const component = await readFile("src/components/admin/SystemOperationsHealthDashboard.tsx", "utf8");
assert.match(component, /System Operations Health/);
assert.match(component, /measurement\.state/);

console.log("ADM-046 system operations health dashboard guardrails validated.");
