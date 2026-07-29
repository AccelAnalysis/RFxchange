import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const grants = await readFile(
  new URL("../src/domain/admin-authorization/grants.ts", import.meta.url),
  "utf8",
);
const repository = await readFile(
  new URL("../src/domain/admin-authorization/repository.ts", import.meta.url),
  "utf8",
);

for (const scope of ["GLOBAL", "GEOGRAPHY", "ORGANIZATION", "CASE"]) {
  assert.ok(grants.includes(`\"${scope}\"`), `Missing administrative scope kind: ${scope}`);
}

assert.ok(
  grants.includes("AdminPermissionGrant"),
  "ADM-093 requires a first-class administrative permission grant object.",
);
for (const field of [
  "administratorId",
  "permission",
  "scope",
  "conditionKeys",
  "createdAt",
  "expiresAt",
]) {
  assert.ok(grants.includes(`readonly ${field}`), `Permission grant must preserve ${field}.`);
}

assert.ok(
  grants.includes("authorizeScopedAdministrativeAction"),
  "Scoped server-side authorization evaluator is required.",
);
assert.ok(
  grants.includes("context.effectivePermissions.includes(requirement.permission)"),
  "Scoped authorization must still require the named effective permission.",
);
assert.ok(
  grants.includes("grant.administratorId === context.administratorId"),
  "Scoped grants must be isolated to the owning administrator.",
);
assert.ok(
  grants.includes('grantScope.kind === "GLOBAL"'),
  "GLOBAL grants must be explicitly recognized as platform-wide scope.",
);
assert.ok(
  grants.includes("grantScope.value === actionScope.value"),
  "Non-global scope enforcement must require exact resolved scope match.",
);
assert.ok(
  grants.includes("isAdminPermissionGrantExpired"),
  "Optional permission-grant expiry must participate in authorization.",
);
assert.ok(
  grants.includes("grant.conditionKeys.every"),
  "Stored grant conditions must participate in authorization evaluation.",
);
assert.ok(
  grants.includes('readonly access: "read" | "write"'),
  "Scoped actions must explicitly preserve read/write access mode evidence.",
);

assert.ok(
  repository.includes("AdminPermissionGrantRepository"),
  "Missing scoped permission grant repository port.",
);
assert.match(repository, /listByAdministratorId\(/);
assert.match(repository, /append\(grant: AdminPermissionGrant\)/);
assert.ok(!/\bdelete\s*\(/.test(repository), "Slice 1.11 grant repository must not expose deletion.");
assert.ok(!/\bupdate\s*\(/.test(repository), "Slice 1.11 grant repository must not expose mutation-in-place.");

console.log("Scoped administrator permission grant architecture guardrails passed.");
