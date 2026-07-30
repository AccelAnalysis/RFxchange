import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const model = await readFile(
  new URL("../src/domain/admin-configuration/model.ts", import.meta.url),
  "utf8",
);
const authorization = await readFile(
  new URL("../src/domain/admin-authorization/model.ts", import.meta.url),
  "utf8",
);
const presets = await readFile(
  new URL("../src/domain/admin-authorization/role-presets.ts", import.meta.url),
  "utf8",
);
const service = await readFile(
  new URL("../src/application/admin/governed-configuration-service.ts", import.meta.url),
  "utf8",
);
const correction = await readFile(
  new URL("../src/application/admin/administrative-audit-correction-service.ts", import.meta.url),
  "utf8",
);
const persistence = await readFile(
  new URL("../src/infrastructure/firestore/governed-configuration-repository.ts", import.meta.url),
  "utf8",
);
const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");
const documentation = await readFile(
  new URL("../docs/architecture/WAVE_1_SLICE_1_26.md", import.meta.url),
  "utf8",
);

for (const key of [
  "verification.evidence-types",
  "credibility.thresholds",
  "credibility.badge-expiration",
  "founding.capacity",
  "plans.limits",
  "referral.fee-rules",
  "referral.payout-thresholds",
  "providers.categories",
  "rfx.types",
  "capabilities.taxonomy",
  "notifications.defaults",
  "geography.release-states",
  "accounts.inactivity-windows",
  "admin.case-slas",
  "support.categories",
]) {
  assert.ok(model.includes(`\"${key}\"`), `ADM-083 missing governed configuration key ${key}.`);
}

assert.ok(
  authorization.includes('["config.value.manage", "config"'),
  "ADM-083 requires a catalogued config.value.manage permission.",
);
assert.ok(
  presets.includes('"config.value.read", "config.value.manage", "config.history.read"'),
  "Technical / System Administrator must receive configuration management authority while Analyst remains read-only.",
);
const analystStart = presets.indexOf('key: "analyst-auditor"');
assert.ok(analystStart >= 0, "Analyst / Auditor role preset is missing.");
const analystBlock = presets.slice(analystStart, presets.indexOf("] as const", analystStart));
assert.ok(!analystBlock.includes('"config.value.manage"'), "Analyst / Auditor must remain configuration read-only.");

assert.ok(service.includes('assertPermission(authority, "config.value.read")'));
assert.ok(
  service.includes('assertPermission(input.authority, "config.value.manage", "pre-resolved")'),
  "Configuration mutation must require both named permission and pre-resolved privileged conditions.",
);
assert.ok(service.includes('action: "config.value.changed"'));
assert.ok(service.includes('sensitivity: "sensitive"'));
assert.ok(service.includes("priorState: configurationAuditState(current)"));
assert.ok(service.includes("newState: configurationAuditState(next)"));
assert.ok(service.includes("commitChange"));

assert.ok(persistence.includes('GOVERNED_CONFIGURATION_COLLECTION = "governedConfigurationValues"'));
assert.ok(persistence.includes("runTransaction"));
assert.ok(persistence.includes("currentRevision !== input.expectedRevision"));
assert.ok(persistence.includes("input.state.revision !== currentRevision + 1"));
assert.ok(persistence.includes("PLATFORM_ADMIN_AUDIT_COLLECTION"));
assert.ok(persistence.includes("transaction.set(stateRef"));
assert.ok(persistence.includes("transaction.create(auditRef"));

assert.ok(rules.includes("match /governedConfigurationValues/{documentId}"));
const auditRules = rules.match(
  /match\s+\/platformAdministrativeAuditEvents\/\{documentId\}\s*\{([\s\S]*?)\n\s*\}/,
)?.[1];
assert.ok(auditRules, "ADM-085/086 administrative audit rules block is missing.");
assert.match(auditRules, /allow\s+read\s*,\s*create\s*:\s*if\s+serverManagedOnly\(\)\s*;/);
assert.match(auditRules, /allow\s+update\s*,\s*delete\s*:\s*if\s+false\s*;/);

assert.ok(correction.includes('assertPermission(input.authority, "audit.event.read")'));
assert.ok(
  correction.includes('assertPermission(input.authority, "audit.correction.append", "pre-resolved")'),
  "ADM-086 correction must require named correction authority plus privileged conditions.",
);
assert.ok(correction.includes("const original = await this.audit.getById"));
assert.ok(correction.includes('action: "audit.event.correction-appended"'));
assert.ok(correction.includes('objectType: "platform-administrative-audit-event"'));
assert.ok(correction.includes("correctionOfEventId: original.id"));
assert.ok(correction.includes("await this.audit.append(correction)"));
assert.ok(!correction.includes(".update(") && !correction.includes(".delete("), "ADM-086 must never rewrite or delete prior audit events.");

for (const source of [model, service, correction]) {
  assert.ok(
    !source.includes('from "firebase') && !source.includes("firebase-admin"),
    "ADM-083/086 domain and application contracts must remain provider independent.",
  );
}

for (const phrase of [
  "ADM-084",
  "versioned configuration history",
  "does not rewrite the original",
  "optimistic revision",
  "fifteen",
]) {
  assert.ok(
    documentation.toLowerCase().includes(phrase.toLowerCase()),
    `Slice 1.26 documentation is missing required policy: ${phrase}.`,
  );
}

console.log("Governed platform configuration and additive administrative audit corrections validated.");
