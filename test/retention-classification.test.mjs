import test from "node:test";
import assert from "node:assert/strict";

import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  RETENTION_PRESERVATION_REASONS,
  assertRetentionAllowsDisposition,
  createRecordRetentionAssignment,
  createRetentionPolicyClassification,
  evaluateRetentionDisposition,
} from "../src/domain/retention/model.ts";

const now = "2026-07-29T13:00:00.000Z";

function preservedPolicy(overrides = {}) {
  return createRetentionPolicyClassification({
    id: "retention-policy-legal-v1",
    policyKey: "transaction-evidence",
    version: "1.0",
    requirement: "preserve-required",
    reasons: ["legal", "audit", "dispute"],
    now,
    ...overrides,
  });
}

function assignment(policy, overrides = {}) {
  const organization = createOrganizationAccount({ id: "org-alpha", now });
  return createRecordRetentionAssignment(policy, {
    id: "retention-assignment-1",
    recordType: "rfx.response",
    recordId: "response-123",
    scope: { kind: "organization", organizationId: organization.id },
    now,
    ...overrides,
  });
}

test("defines the required preservation-reason taxonomy", () => {
  assert.deepEqual(RETENTION_PRESERVATION_REASONS, [
    "legal",
    "financial",
    "security",
    "audit",
    "dispute",
    "compliance",
  ]);
});

test("preserve-required policy must include at least one valid reason", () => {
  assert.throws(
    () =>
      createRetentionPolicyClassification({
        id: "policy-1",
        policyKey: "audit-records",
        version: "1.0",
        requirement: "preserve-required",
        reasons: [],
        now,
      }),
    /at least one preservation reason/,
  );
});

test("retention-not-required policy cannot carry preservation reasons", () => {
  assert.throws(
    () =>
      createRetentionPolicyClassification({
        id: "policy-2",
        policyKey: "ephemeral-ui-state",
        version: "1.0",
        requirement: "retention-not-required",
        reasons: ["audit"],
        now,
      }),
    /cannot carry preservation reasons/,
  );
});

test("assignment preserves exact policy version and organization record scope", () => {
  const policy = preservedPolicy();
  const record = assignment(policy);

  assert.equal(record.policyId, policy.id);
  assert.equal(record.policyKey, policy.policyKey);
  assert.equal(record.policyVersion, policy.version);
  assert.equal(record.record.recordType, "rfx.response");
  assert.equal(record.record.recordId, "response-123");
  assert.equal(record.record.scope.kind, "organization");
  assert.ok(Object.isFrozen(record));
  assert.ok(Object.isFrozen(record.record));
  assert.ok(Object.isFrozen(record.record.scope));
});

test("platform-scoped records can also be classified", () => {
  const policy = preservedPolicy({
    id: "platform-policy-v1",
    policyKey: "platform-governance-history",
    reasons: ["audit", "compliance"],
  });
  const record = createRecordRetentionAssignment(policy, {
    id: "assignment-platform-1",
    recordType: "platform.change-directive",
    recordId: "directive-42",
    scope: { kind: "platform" },
    now,
  });

  assert.deepEqual(record.record.scope, { kind: "platform" });
});

test("deletion and moderation removal are blocked by preserve-required classification", () => {
  const policy = preservedPolicy();
  const record = assignment(policy);

  assert.deepEqual(evaluateRetentionDisposition(record, policy, "delete"), {
    kind: "preserve",
    operation: "delete",
    reasons: ["legal", "audit", "dispute"],
    policyId: policy.id,
    policyVersion: policy.version,
  });
  assert.deepEqual(evaluateRetentionDisposition(record, policy, "moderation-remove"), {
    kind: "preserve",
    operation: "moderation-remove",
    reasons: ["legal", "audit", "dispute"],
    policyId: policy.id,
    policyVersion: policy.version,
  });
  assert.throws(
    () => assertRetentionAllowsDisposition(record, policy, "delete"),
    /requires preservation/,
  );
});

test("retention-not-required means only that retention does not block disposition", () => {
  const policy = createRetentionPolicyClassification({
    id: "policy-transient-v1",
    policyKey: "transient-derived-cache",
    version: "1.0",
    requirement: "retention-not-required",
    now,
  });
  const record = assignment(policy, {
    id: "assignment-transient-1",
    recordType: "derived.cache",
    recordId: "cache-1",
  });

  assert.deepEqual(evaluateRetentionDisposition(record, policy, "delete"), {
    kind: "not-retention-blocked",
    operation: "delete",
    policyId: policy.id,
    policyVersion: policy.version,
    note: "Retention classification alone does not authorize deletion or moderation.",
  });
  assert.doesNotThrow(() => assertRetentionAllowsDisposition(record, policy, "delete"));
});

test("a record assignment cannot be evaluated against another policy version", () => {
  const v1 = preservedPolicy();
  const record = assignment(v1);
  const v2 = preservedPolicy({
    id: "retention-policy-legal-v2",
    version: "2.0",
    reasons: ["legal", "audit", "dispute", "compliance"],
  });

  assert.throws(
    () => evaluateRetentionDisposition(record, v2, "delete"),
    /does not match the supplied policy classification\/version/,
  );
});

test("policy reasons are deduplicated and immutable", () => {
  const policy = preservedPolicy({ reasons: ["audit", "audit", "security"] });
  assert.deepEqual(policy.reasons, ["audit", "security"]);
  assert.ok(Object.isFrozen(policy));
  assert.ok(Object.isFrozen(policy.reasons));
});

test("invalid identifiers, timestamps and operations are rejected", () => {
  assert.throws(
    () =>
      createRetentionPolicyClassification({
        id: "",
        policyKey: "records",
        version: "1.0",
        requirement: "retention-not-required",
        now,
      }),
    /Retention policy id is required/,
  );

  assert.throws(
    () =>
      createRetentionPolicyClassification({
        id: "policy-x",
        policyKey: "records",
        version: "1.0",
        requirement: "retention-not-required",
        now: "not-a-date",
      }),
    /valid ISO-compatible date-time/,
  );

  const policy = preservedPolicy();
  const record = assignment(policy);
  assert.throws(
    () => evaluateRetentionDisposition(record, policy, "purge"),
    /Unsupported retention operation/,
  );
});
