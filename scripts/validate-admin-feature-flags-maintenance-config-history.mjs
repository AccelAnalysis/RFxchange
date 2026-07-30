import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const history = await readFile(new URL("../src/domain/admin-configuration/history.ts", import.meta.url), "utf8");
const configService = await readFile(new URL("../src/application/admin/governed-configuration-service.ts", import.meta.url), "utf8");
const configRepo = await readFile(new URL("../src/infrastructure/firestore/governed-configuration-repository.ts", import.meta.url), "utf8");
const flags = await readFile(new URL("../src/domain/admin-system/feature-flags.ts", import.meta.url), "utf8");
const flagService = await readFile(new URL("../src/application/admin/feature-flag-administration.ts", import.meta.url), "utf8");
const maintenanceModel = await readFile(new URL("../src/domain/admin-system/maintenance-operations.ts", import.meta.url), "utf8");
const maintenance = await readFile(new URL("../src/application/admin/system-maintenance-operations.ts", import.meta.url), "utf8");
const dispatcher = await readFile(new URL("../src/infrastructure/system/controlled-maintenance-executor.ts", import.meta.url), "utf8");
const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");

assert.ok(
  history.includes("previousValue") && history.includes("newValue") && history.includes("effectiveAt") &&
    history.includes("actorAdministratorId") && history.includes("reason") && history.includes("policyVersion"),
  "ADM-084 history must preserve before/after, effective date, actor, reason and policy version.",
);
assert.ok(
  configService.includes('"config.history.read"') && configService.includes("valueEffectiveAt") &&
    configService.includes("createGovernedConfigurationChangeRecord"),
  "ADM-084 must provide permission-gated historical reconstruction and create a record per change.",
);
assert.ok(
  configRepo.includes("GOVERNED_CONFIGURATION_HISTORY_COLLECTION") &&
    configRepo.includes("transaction.create(historyRef") && configRepo.includes("transaction.create(auditRef"),
  "Configuration value, immutable version record and audit evidence must share one transaction boundary.",
);

for (const flag of [
  "founding-membership-checkout",
  "rfx-publishing",
  "rfx-response-submission",
  "referrals",
  "teaming",
  "resource-provider-applications",
  "sam-gov-ingestion",
]) {
  assert.ok(flags.includes(`"${flag}"`), `Approved feature flag catalog is missing ${flag}.`);
}
assert.ok(
  flagService.includes('"config.value.manage"') && flagService.includes('"pre-resolved"') &&
    flagService.includes("environment mismatch") && flagService.includes("FeatureFlagChangeRecord") &&
    flagService.includes("createPlatformAdministrativeAuditEvent"),
  "ADM-047 flag changes must be privileged, environment-bound, versioned and audited.",
);

for (const action of [
  "retry-background-job",
  "disable-failing-integration",
  "reindex",
  "background-repair",
  "maintenance-mode",
]) {
  assert.ok(maintenanceModel.includes(`"${action}"`), `ADM-048 maintenance controls are missing ${action}.`);
}
assert.ok(
  maintenance.includes('permission: "system.maintenance.request"') && maintenance.includes('conditions: "pre-resolved"') &&
    maintenance.includes("confirmation token") && maintenance.includes("validatedDryRunReference") &&
    maintenance.includes("durationMinutes") && maintenance.includes("SystemMaintenanceExecutor"),
  "ADM-048 must enforce named permission, privileged conditions and action-specific guardrails.",
);
assert.ok(
  dispatcher.includes("explicitly registered handlers") && !dispatcher.includes("child_process") && !dispatcher.includes("exec("),
  "Maintenance UI requests must dispatch only to explicit server handlers and never arbitrary shell execution.",
);

for (const collection of [
  "governedConfigurationChanges",
  "featureFlagStates",
  "featureFlagChanges",
  "systemMaintenanceOperations",
]) {
  assert.ok(rules.includes(`match /${collection}/{documentId}`), `Firestore Rules are missing ${collection}.`);
}
assert.ok(
  rules.includes("match /governedConfigurationChanges/{documentId}") &&
    rules.includes("allow update, delete: if false") &&
    rules.includes("match /featureFlagChanges/{documentId}"),
  "Configuration and feature-flag change evidence must remain append-only to direct clients.",
);

for (const source of [history, configService, flags, flagService, maintenanceModel, maintenance]) {
  assert.equal(source.includes('from "firebase'), false, "Slice 1.27 domain/application contracts must remain Firebase-independent.");
}

console.log("Slice 1.27 feature flags, maintenance controls and configuration history validated.");
