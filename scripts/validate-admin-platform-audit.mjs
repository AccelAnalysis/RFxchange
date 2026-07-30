import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const model = await readFile("src/domain/admin-authorization/admin-audit.ts", "utf8");
for (const field of [
  "actorAdministratorId",
  "actorRolePresetKeys",
  "permissionsExercised",
  "organizationId",
  "userId",
  "objectType",
  "objectId",
  "priorState",
  "newState",
  "reason",
  "relatedCaseId",
  "securityContext",
  "justification",
  "evidenceReferences",
  "approvalReferences",
]) assert.match(model, new RegExp(field));
assert.match(model, /Sensitive administrative audit events require recent re-authentication context/);
assert.equal(/firebase-admin|firebase\//.test(model), false, "canonical audit domain must remain provider-independent");

const repository = await readFile("src/infrastructure/firestore/platform-admin-audit-repository.ts", "utf8");
assert.match(repository, /platformAdministrativeAuditEvents/);
assert.match(repository, /transaction\.create/);
assert.equal(/\.update\(|\.delete\(/.test(repository), false, "platform admin audit repository must be append-only");

const lifecycle = await readFile("src/application/admin/administrator-lifecycle-service.ts", "utf8");
assert.match(lifecycle, /PlatformAdministrativeAuditRepository/);
assert.match(lifecycle, /createLifecyclePlatformAdministrativeAuditEvent/);
assert.match(lifecycle, /await this\.audit\.append/);
assert.ok(
  lifecycle.indexOf("createLifecyclePlatformAdministrativeAuditEvent") < lifecycle.indexOf("providerEffect"),
  "canonical audit validation must be prepared before provider side effects",
);

console.log("ADM-085 platform-wide immutable administrative audit guardrails validated.");
