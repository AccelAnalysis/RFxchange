import { readFile } from "node:fs/promises";

const model = await readFile("src/domain/lifecycle/model.ts", "utf8");
const repository = await readFile("src/domain/lifecycle/repository.ts", "utf8");
const documentation = await readFile("docs/architecture/WAVE_1_SLICE_1_6.md", "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Access lifecycle validation failed: ${message}`);
  }
}

for (const state of [
  "visitor",
  "account-started",
  "account-activated",
  "geography-selected",
  "organization-resolved",
  "organization-registered",
  "organization-activated",
  "controlled-platform",
  "open-platform",
]) {
  assert(model.includes(`"${state}"`), `missing ARC-007 lifecycle state: ${state}`);
}

for (const state of ["restricted", "suspended", "integrity-hold", "terminated"]) {
  assert(model.includes(`"${state}"`), `missing ARC-008 restriction state: ${state}`);
}

assert(
  model.includes("export interface AccessLifecycleRecord") &&
    model.includes("export interface AccessRestrictionRecord"),
  "lifecycle progress and restriction state must remain separate records",
);
assert(
  model.includes("nextAccessLifecycleState(current)") ||
    model.includes("nextAccessLifecycleState(record.state"),
  "lifecycle transition logic must use the canonical next-state rule",
);
assert(
  model.includes('if (current === "terminated")') && model.includes('return next === "terminated"'),
  "termination must be irreversible in the foundation state model",
);
assert(
  model.includes('kind: "organization"') && model.includes('kind: "membership"'),
  "restriction targets must support both organization and membership/user scope",
);
assert(
  model.includes('restriction.state !== "none"') &&
    model.indexOf('restriction.state !== "none"') < model.indexOf('lifecycle.state === "controlled-platform"'),
  "restriction overlay must be resolved before normal controlled/open platform access",
);

const lifecycleBlock = model.match(/export interface AccessLifecycleRecord \{([\s\S]*?)\n\}/)?.[1] ?? "";
assert(
  !lifecycleBlock.includes("organizationId") && !lifecycleBlock.includes("membershipId") && !lifecycleBlock.includes("userId"),
  "early lifecycle progress must not require organization/user binding before those entities exist",
);

assert(
  repository.includes("export interface AccessLifecycleRepository") &&
    repository.includes("export interface AccessRestrictionRepository"),
  "lifecycle and restriction persistence ports must remain explicit",
);
assert(
  repository.includes("getForOrganization(organizationId: OrganizationId)") &&
    repository.includes("getForMembership(membershipId: OrganizationMembershipId)"),
  "restriction persistence must support organization and membership scopes",
);

assert(documentation.includes("ARC-007"), "architecture evidence must map ARC-007");
assert(documentation.includes("ARC-008"), "architecture evidence must map ARC-008");
assert(
  documentation.includes("Geographic availability states are separate"),
  "geography release availability must not be conflated with access restriction state",
);
assert(documentation.includes("Explicitly deferred"), "slice boundary must be documented");

console.log("Wave 1 Slice 1.6 access lifecycle validation passed.");
