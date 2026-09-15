import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("P1/P2 organization surfaces are registered on the existing chassis ports", async () => {
  const part = await read("apps/accelpo/src/organization-settings/part.ts");
  const registry = await read("apps/accelpo/src/chassis/registry.ts");

  assert.match(part, /P1_ORGANIZATION_PEOPLE_SEATS_PART/);
  assert.match(part, /P2_PURCHASING_CONFIGURATION_PART/);
  for (const connectionPoint of [
    "CP_01_IDENTITY_CONTEXT",
    "CP_02_ROUTE_SURFACE",
    "CP_03_COMMAND_PORT",
    "CP_04_QUERY_PROJECTION",
    "CP_05_POLICY_RESOLVER",
    "CP_06_TASK_NOTIFICATION",
    "CP_10_ENTITLEMENT_BILLING",
  ]) {
    assert.match(part, new RegExp(connectionPoint));
  }
  assert.match(registry, /registry\.register\(P1_ORGANIZATION_PEOPLE_SEATS_PART\)/);
  assert.match(registry, /registry\.register\(P2_PURCHASING_CONFIGURATION_PART\)/);
});

test("Organization controls no longer use the generic preview placeholder", async () => {
  const app = await read("apps/accelpo/app.js");
  const surfaces = await read("apps/accelpo/src/organization-settings/surfaces.js");
  const index = await read("apps/accelpo/index.html");

  const placeholder = app.match(/if \(\[(.*?)\]\.includes\(action\)\) return showNotice\("This preview is ready for the next connected step\."\);/s);
  assert.ok(placeholder, "generic placeholder guard should remain bounded to unrelated preview actions");
  for (const action of ["edit-org", "people", "policy", "providers", "billing"]) {
    assert.doesNotMatch(placeholder[1], new RegExp(`"${action}"`));
    assert.match(surfaces, new RegExp(`"${action}"`));
  }

  assert.match(index, /organization-settings\/surfaces\.js/);
  assert.match(index, /organization-settings\/surfaces\.css/);
  assert.match(surfaces, /event\.stopImmediatePropagation\(\)/);
});

test("People & seats uses CP-04 reads and CP-03/CP-10 seat commands", async () => {
  const runtime = await read("apps/accelpo/src/organization-settings/runtime.js");

  assert.match(runtime, /\/api\/accelpo\/query/);
  assert.match(runtime, /\/api\/accelpo\/commands/);
  assert.match(runtime, /"organization-context"/);
  assert.match(runtime, /"people-invitations"/);
  assert.match(runtime, /"entitlement\.invitation\.create"/);
  assert.match(runtime, /"entitlement\.invitation\.revoke"/);
  assert.match(runtime, /"entitlement\.membership\.deactivate"/);
  assert.match(runtime, /ownerCountsAsSeat: true/);
  assert.match(runtime, /addSeatActionAllowed/);
  assert.match(runtime, /does not charge a card|does not implement payment processing/i);
});

test("Purchasing configuration stays data-driven and does not invent a universal threshold", async () => {
  const runtime = await read("apps/accelpo/src/organization-settings/runtime.js");
  const surfaces = await read("apps/accelpo/src/organization-settings/surfaces.js");

  assert.match(runtime, /"budget-summary"/);
  assert.match(runtime, /"provider-summary"/);
  assert.match(surfaces, /does not impose universal dollar thresholds/i);
  assert.doesNotMatch(`${runtime}\n${surfaces}`, /\$\s?5000|\$\s?10,000|threshold:\s*\d+/i);
  assert.match(surfaces, /P2 server command definitions/);
});
