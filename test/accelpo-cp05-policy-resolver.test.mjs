import assert from "node:assert/strict";
import test from "node:test";

import { createAccelPOPartRegistry } from "../apps/accelpo/src/chassis/registry.ts";
import {
  ACCELPO_EVIDENCE_REQUIREMENTS,
  CP05_POLICY_RESOLVER_PART,
  PolicyResolver,
  PolicyResolverError,
  captureAuthorizationPolicySnapshot,
} from "../apps/accelpo/src/policy-resolver/index.ts";

const NOW = "2026-09-14T20:00:00.000Z";
const ORG_A = "org-alpha";
const ORG_B = "org-beta";

const noneApproval = () => ({ strategy: "none", stages: [] });
const sequential = (label = "Manager") => ({
  strategy: "sequential",
  stages: [{ stageId: "manager", label, approverKind: "role", approverId: "manager", minimumApprovals: 1 }],
});
const parallel = () => ({
  strategy: "parallel",
  stages: [
    { stageId: "finance", label: "Finance", approverKind: "capability", approverId: "purchase.budget.manage", minimumApprovals: 1 },
    { stageId: "owner", label: "Owner", approverKind: "role", approverId: "owner", minimumApprovals: 1 },
  ],
});

function defaults(overrides = {}) {
  return {
    departmentRouting: { departmentId: null, costAreaId: null, routeKey: null },
    approval: noneApproval(),
    delegation: { allowed: false, requiredDelegateCapabilities: [] },
    exceptions: { behavior: "deny", route: null },
    budget: { mode: "none", budgetKey: null, enforcement: "informational" },
    evidence: { requirement: "none" },
    sourcing: {
      allowedPurchasingModes: ["direct-provider", "source-first", "authorize-first"],
      orderByMode: {
        "direct-provider": ["award", "fulfill", "evidence"],
        "source-first": ["source", "authorize", "award", "fulfill", "evidence"],
        "authorize-first": ["authorize", "source", "award", "fulfill", "evidence"],
      },
      publishRequiredCapabilities: ["purchase.sourcing.publish"],
    },
    ...overrides,
  };
}

function policy(organizationId, rules = [], defaultOverrides = {}) {
  return {
    contractVersion: 1,
    policyId: `policy-${organizationId}`,
    organizationId,
    versionId: `version-${organizationId}-1`,
    version: 1,
    status: "active",
    effectiveAt: "2026-09-01T00:00:00.000Z",
    defaults: defaults(defaultOverrides),
    rules,
  };
}

function context(organizationId = ORG_A, overrides = {}) {
  return {
    organizationId,
    departmentId: "operations",
    costAreaId: "general",
    categoryId: "equipment",
    money: { amount: 750, currency: "USD" },
    provider: null,
    neededBy: "2026-10-01T00:00:00.000Z",
    requester: { userId: "user-requester", permissions: ["purchase.request"] },
    purchasingMode: "direct-provider",
    exceptionCodes: [],
    ...overrides,
  };
}

function resolverFor(source) {
  return new PolicyResolver({ source, now: () => new Date(NOW) });
}

function sourceFor(policies) {
  const calls = [];
  return {
    calls,
    async getActivePolicyVersion(input) {
      calls.push(input);
      return policies.get(input.organizationId) ?? null;
    },
  };
}

test("CP-05 registers only the identity and policy resolver connection points", () => {
  const registry = createAccelPOPartRegistry();
  const part = registry.get("CP-05-policy-resolver");
  assert.ok(part);
  assert.deepEqual(part, CP05_POLICY_RESOLVER_PART);
  assert.deepEqual(part.routes, []);
  assert.deepEqual(part.permissions, []);
  assert.deepEqual(part.connectionPoints, ["IdentityContext", "PolicyResolver"]);
});

test("CP-05 returns a safe not-configured result and scopes the source lookup to the active organization", async () => {
  const source = sourceFor(new Map());
  const result = await resolverFor(source).resolve(context());
  assert.deepEqual(
    { status: result.status, organizationId: result.organizationId, contractVersion: result.contractVersion },
    { status: "not-configured", organizationId: ORG_A, contractVersion: 1 },
  );
  assert.deepEqual(source.calls, [{ organizationId: ORG_A, at: NOW }]);
});

test("amount and category approval thresholds are organization policy, not universal code", async () => {
  const alpha = policy(ORG_A, [{
    ruleId: "alpha-equipment-500",
    priority: 10,
    condition: { categoryIds: ["equipment"], minAmountInclusive: 500, currency: "USD" },
    effect: { approval: sequential() },
  }]);
  const beta = policy(ORG_B, [{
    ruleId: "beta-equipment-5000",
    priority: 10,
    condition: { categoryIds: ["equipment"], minAmountInclusive: 5000, currency: "USD" },
    effect: { approval: parallel() },
  }]);
  const resolver = resolverFor(sourceFor(new Map([[ORG_A, alpha], [ORG_B, beta]])));

  const resultA = await resolver.resolve(context(ORG_A));
  const resultB = await resolver.resolve(context(ORG_B));
  assert.equal(resultA.status, "resolved");
  assert.equal(resultB.status, "resolved");
  assert.equal(resultA.approval.strategy, "sequential");
  assert.equal(resultB.approval.strategy, "none");
  assert.deepEqual(resultA.matchedRuleIds, ["alpha-equipment-500"]);
  assert.deepEqual(resultB.matchedRuleIds, []);
});

test("matched policy rules resolve routing, budget, delegation, exception routes, and higher-priority evidence", async () => {
  const rules = [
    {
      ruleId: "operations-base",
      priority: 10,
      condition: { departmentIds: ["operations"] },
      effect: {
        departmentRouting: { departmentId: "operations", costAreaId: "general", routeKey: "ops" },
        budget: { mode: "organization-entered", budgetKey: "ops-general", enforcement: "approval-required" },
        delegation: { allowed: true, requiredDelegateCapabilities: ["purchase.approve"] },
        exceptions: { behavior: "route", route: parallel() },
        evidence: { requirement: "receipt-or-photo" },
      },
    },
    {
      ruleId: "urgent-evidence",
      priority: 20,
      condition: { exceptionCodesAny: ["urgent"] },
      effect: { evidence: { requirement: "receipt-and-photo" } },
    },
  ];
  const result = await resolverFor(sourceFor(new Map([[ORG_A, policy(ORG_A, rules)]]))).resolve(
    context(ORG_A, { exceptionCodes: ["urgent"] }),
  );
  assert.equal(result.status, "resolved");
  assert.equal(result.departmentRouting.routeKey, "ops");
  assert.deepEqual(result.budget, { mode: "organization-entered", budgetKey: "ops-general", enforcement: "approval-required" });
  assert.deepEqual(result.delegation, { allowed: true, requiredDelegateCapabilities: ["purchase.approve"] });
  assert.equal(result.exceptions.behavior, "route");
  assert.equal(result.exceptions.route.strategy, "parallel");
  assert.equal(result.evidence.requirement, "receipt-and-photo");
  assert.deepEqual(result.matchedRuleIds, ["operations-base", "urgent-evidence"]);
  assert.equal(result.amountCategoryConditions.length, 2);
});

test("all supported evidence requirements are data-driven policy values", async () => {
  for (const requirement of ACCELPO_EVIDENCE_REQUIREMENTS) {
    const configured = policy(ORG_A, [], { evidence: { requirement } });
    const result = await resolverFor(sourceFor(new Map([[ORG_A, configured]]))).resolve(context());
    assert.equal(result.status, "resolved");
    assert.equal(result.evidence.requirement, requirement);
  }
});

test("client-selected sourcing cannot enable a disallowed path", async () => {
  const configured = policy(ORG_A, [], {
    sourcing: {
      allowedPurchasingModes: ["authorize-first"],
      orderByMode: { "authorize-first": ["authorize", "source", "award", "fulfill", "evidence"] },
      publishRequiredCapabilities: ["purchase.sourcing.publish"],
    },
  });
  const resolver = resolverFor(sourceFor(new Map([[ORG_A, configured]])));

  const denied = await resolver.resolve(context(ORG_A, { purchasingMode: "source-first" }));
  assert.equal(denied.status, "resolved");
  assert.equal(denied.sourcing.allowed, false);
  assert.deepEqual(denied.sourcing.order, []);
  assert.equal(denied.sourcing.requesterMayPublish, false);

  const allowed = await resolver.resolve(context(ORG_A, { purchasingMode: "authorize-first" }));
  assert.equal(allowed.status, "resolved");
  assert.equal(allowed.sourcing.allowed, true);
  assert.deepEqual(allowed.sourcing.order, ["authorize", "source", "award", "fulfill", "evidence"]);
  assert.equal(allowed.sourcing.requesterMayPublish, false);
});

test("authority to publish sourcing is resolved from trusted requester capabilities", async () => {
  const configured = policy(ORG_A);
  const resolver = resolverFor(sourceFor(new Map([[ORG_A, configured]])));
  const withoutCapability = await resolver.resolve(context(ORG_A, { purchasingMode: "source-first" }));
  const withCapability = await resolver.resolve(context(ORG_A, {
    purchasingMode: "source-first",
    requester: { userId: "user-requester", permissions: ["purchase.request", "purchase.sourcing.publish"] },
  }));
  assert.equal(withoutCapability.status, "resolved");
  assert.equal(withCapability.status, "resolved");
  assert.equal(withoutCapability.sourcing.requesterMayPublish, false);
  assert.equal(withCapability.sourcing.requesterMayPublish, true);
});

test("a policy source cannot cross organization boundaries", async () => {
  const source = { async getActivePolicyVersion() { return policy(ORG_B); } };
  await assert.rejects(
    () => resolverFor(source).resolve(context(ORG_A)),
    (error) => error instanceof PolicyResolverError && error.code === "tenant-mismatch",
  );
});

test("authorization snapshots retain the exact policy version and decision after policy changes", async () => {
  const configured = policy(ORG_A, [{
    ruleId: "approval",
    priority: 10,
    condition: { minAmountInclusive: 500 },
    effect: { approval: sequential("Manager") },
  }]);
  const result = await resolverFor(sourceFor(new Map([[ORG_A, configured]]))).resolve(context());
  assert.equal(result.status, "resolved");
  const snapshot = captureAuthorizationPolicySnapshot(result, "2026-09-14T20:01:00.000Z");

  configured.version = 99;
  configured.versionId = "changed-later";
  configured.rules[0].effect.approval.stages[0].label = "Changed later";

  assert.equal(snapshot.applicablePolicy.version, 1);
  assert.equal(snapshot.applicablePolicy.versionId, `version-${ORG_A}-1`);
  assert.equal(snapshot.approval.stages[0].label, "Manager");
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.approval), true);
});
