import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const model = await readFile(
  new URL("../src/domain/admin-authorization/model.ts", import.meta.url),
  "utf8",
);
const repository = await readFile(
  new URL("../src/domain/admin-authorization/repository.ts", import.meta.url),
  "utf8",
);

for (const namespace of [
  "platform",
  "admin",
  "config",
  "organization",
  "user",
  "rfx",
  "credibility",
  "provider",
  "referral",
  "commerce",
  "geography",
  "support",
  "trust",
  "analytics",
  "audit",
  "system",
]) {
  assert.ok(model.includes(`"${namespace}"`), `Missing admin permission namespace: ${namespace}`);
}

assert.ok(
  model.includes("ADMIN_PERMISSION_CATALOG"),
  "ADM-092 requires an explicit namespaced administrative permission catalog.",
);
assert.ok(
  model.includes("authorizeAdministrativeAction"),
  "ADM-001/ADM-011 require a central administrative authorization evaluator.",
);
assert.ok(
  model.includes("effectivePermissions.includes(requirement.permission)"),
  "Protected actions must authorize against the named permission.",
);
assert.ok(
  model.includes('required: "GLOBAL"') && model.includes('resolved: "GLOBAL"'),
  "Authorization decisions must carry explicit scope resolution evidence.",
);
assert.ok(
  model.includes('requirement: "pre-resolved"') && model.includes('status: "unsatisfied"'),
  "Authorization must carry condition-resolution evidence without implementing later condition policy configuration.",
);
assert.ok(
  !/\bisAdmin\b/.test(model) && !/\badminFlag\b/.test(model),
  "Administrative authorization must not rely on a binary admin flag.",
);
assert.ok(
  !model.includes('rolePresetKeys.includes("super-admin")') &&
    !model.includes('rolePresetKeys.includes("platform-administrator")'),
  "Authorization must not depend on broad role-name conditionals.",
);

for (const permission of [
  "credibility.organization.verify",
  "credibility.organization.deny-verification",
  "credibility.badge.award",
  "credibility.endorsement.issue",
  "credibility.badge.suspend",
  "credibility.badge.restore",
  "credibility.badge.revoke",
  "credibility.record.correct",
  "credibility.appeal.review",
  "credibility.activity.invalidate",
  "credibility.transaction.invalidate",
  "credibility.endorsement-authority.suspend",
  "credibility.endorsement-authority.restore",
]) {
  assert.ok(model.includes(`"${permission}"`), `Missing granular credibility permission: ${permission}`);
}

assert.ok(
  repository.includes("AdminPermissionCatalogRepository"),
  "Administrative permission catalog requires a repository/read boundary.",
);
assert.ok(
  repository.includes("PlatformAdministratorAuthorityContextRepository"),
  "Administrative authorization requires an authority-context read boundary.",
);
assert.ok(!/\bisAdmin\b/.test(repository), "Repository contracts must not introduce an admin boolean.");

console.log("Administrative authorization architecture guardrails passed.");
