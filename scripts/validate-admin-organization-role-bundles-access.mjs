import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const bundles = await readFile(
  new URL("../src/domain/authorization/organization-role-bundles.ts", import.meta.url),
  "utf8",
);
const service = await readFile(
  new URL("../src/application/admin/organization-access-administration.ts", import.meta.url),
  "utf8",
);
const unitOfWork = await readFile(
  new URL("../src/infrastructure/firestore/organization-access-admin-unit-of-work.ts", import.meta.url),
  "utf8",
);
const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");

for (const key of [
  "primary-admin-owner",
  "organization-admin",
  "power-user-manager",
  "contributor",
  "viewer",
  "billing-manager",
  "rfx-issuer-manager",
  "rfx-evaluator",
  "response-manager",
  "resource-manager",
]) {
  assert.ok(bundles.includes(`\"${key}\"`), `Missing organization role bundle ${key}.`);
}
assert.ok(
  bundles.includes("createOrganizationRoleBundle") && bundles.includes("permissions: readonly OrganizationPermission[]"),
  "ADM-055 role bundles must remain configurable permission data.",
);
assert.ok(
  service.includes('permission: "user.access.manage"') || service.includes('"user.access.manage"'),
  "ADM-056 mutations must require the named user.access.manage capability.",
);
assert.ok(
  service.includes('"user.access.read"'),
  "ADM-056 access inspection must require user.access.read.",
);
assert.ok(
  service.includes("planAdministrativeMembershipDeactivation"),
  "ADM-056 must preserve ADM-069 orphan-user prevention.",
);
assert.ok(
  service.includes("createPlatformAdministrativeAuditEvent") &&
    service.includes("priorState") &&
    service.includes("newState") &&
    service.includes('sensitivity: "sensitive"'),
  "Every ADM-056 access mutation must use canonical before/after sensitive audit evidence.",
);
assert.ok(
  unitOfWork.includes("runTransaction") &&
    unitOfWork.includes("PLATFORM_ADMIN_AUDIT_COLLECTION") &&
    unitOfWork.includes("organizationMemberships") &&
    unitOfWork.includes("organizationAuthorizations"),
  "Access state changes and ADM-085 evidence must commit atomically.",
);
assert.ok(
  rules.includes("match /organizationRoleBundles/{documentId}") &&
    rules.includes("serverManagedOnly"),
  "Organization role bundle configuration must remain server managed.",
);
assert.ok(
  !bundles.includes('from "firebase') && !service.includes('from "firebase'),
  "ADM-055/056 domain and application contracts must remain provider independent.",
);

console.log("Organization role bundles and audited access administration validated.");
