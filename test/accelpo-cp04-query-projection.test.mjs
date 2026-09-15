import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCELPO_PROJECTION_NAMES,
  QueryProjectionService,
} from "../apps/accelpo/src/query-projection/index.ts";
import { createAccelPOPartRegistry } from "../apps/accelpo/src/chassis/registry.ts";

const ORG_A = "org-alpha";
const ORG_B = "org-beta";
const ACTOR = Object.freeze({
  userId: "user-requester",
  organizationId: ORG_A,
  membershipId: "membership-alpha",
  permissions: Object.freeze(["purchase.request", "purchase.offers.view"]),
});

function record(id, organizationId, data, collection = "accelpoPurchaseCases") {
  return Object.freeze({ id, organizationId, data: Object.freeze(data), collection });
}

class MemoryProjectionSource {
  constructor(records) {
    this.records = records;
    this.calls = [];
  }

  async getOne(input) {
    this.calls.push({ kind: "getOne", ...input });
    return this.records.find(
      (candidate) => candidate.collection === input.collection && candidate.id === input.recordId && candidate.organizationId === input.organizationId,
    ) ?? null;
  }

  async list(input) {
    this.calls.push({ kind: "list", ...input });
    const records = this.records
      .filter((candidate) => candidate.collection === input.collection)
      .filter((candidate) => candidate.organizationId === input.organizationId)
      .filter((candidate) => input.filters.every((filter) => {
        const actual = candidate.data[filter.field];
        return filter.operator === "=="
          ? actual === filter.value
          : filter.value.includes(actual);
      }));
    return { records: records.slice(0, input.limit), nextCursor: records.length > input.limit ? "next" : null };
  }
}

function serviceFor(records, actor = ACTOR) {
  const source = new MemoryProjectionSource(records);
  const access = {
    async resolve() {
      return { kind: "authorized", actor };
    },
  };
  return { source, service: new QueryProjectionService({ source, access }) };
}

const purchaseCase = record("case-1", ORG_A, {
  title: "Replacement laptops",
  description: "Three standard laptops",
  purpose: "Replace aging equipment",
  quantity: 3,
  neededBy: "2026-10-01T00:00:00Z",
  fulfillmentMethod: "delivery",
  departmentName: "Operations",
  estimatedAmount: 2400,
  currency: "USD",
  requesterUserId: ACTOR.userId,
  requesterDisplayName: "Requester",
  authorizationStatus: "pending",
  sourcingStatus: "not-needed",
  nextAction: "Waiting for approval",
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-02T00:00:00Z",
  approvalComments: "Private approval note",
  budgetAmount: 999999,
  receiptUrl: "https://private.example/receipt",
  storagePath: "organizations/org-alpha/private/receipt.pdf",
});

test("CP-04 registers with the chassis registry and declares all role-safe projections", () => {
  const registry = createAccelPOPartRegistry();
  const part = registry.get("CP-04-query-projection");

  assert.ok(part);
  assert.deepEqual(part.routes, []);
  assert.deepEqual(part.connectionPoints, ["IdentityContext", "QueryProjection"]);
  assert.deepEqual(ACCELPO_PROJECTION_NAMES, [
    "organization-context",
    "people-invitations",
    "purchase-case-summary",
    "purchase-case-detail",
    "task-summary",
    "notification-summary",
    "provider-summary",
    "offer-summary",
    "budget-summary",
    "evidence-metadata",
    "fulfillment-summary",
  ]);
});

test("CP-04 can return the already-authorized organization context without a duplicate broad read", async () => {
  const source = new MemoryProjectionSource([]);
  const service = new QueryProjectionService({
    source,
    access: {
      async resolve() {
        return {
          kind: "authorized",
          actor: {
            ...ACTOR,
            organizationDisplayName: "Alpha Organization",
            planName: "Growth",
            billingPeriod: "2026-10-01T00:00:00.000Z",
            includedSeats: 3,
            activeSeats: 2,
            reservedSeats: 1,
            availableSeats: 0,
            addOnSeatAllowance: 0,
            addOnSeatPriceMinor: 1095,
            addOnSeatCurrency: "USD",
            addSeatActionAllowed: true,
            entitlementVersion: "2026-09-14T19:00:00.000Z",
            ownerCountsAsSeat: true,
          },
        };
      },
    },
  });

  const result = await service.read({
    query: { projection: "organization-context", scope: "record" },
  });

  assert.equal(result.outcome, "success");
  assert.equal(result.items[0].displayName, "Alpha Organization");
  assert.equal(result.items[0].plan.name, "Growth");
  assert.deepEqual(result.items[0].seats, {
    included: 3,
    active: 2,
    reserved: 1,
    available: 0,
    addOnAllowance: 0,
    addOnPricing: { amountMinor: 1095, currency: "USD" },
    addSeatActionAllowed: true,
    entitlementVersion: "2026-09-14T19:00:00.000Z",
    ownerCountsAsSeat: true,
  });
  assert.deepEqual(source.calls, []);
});

test("CP-04 binds every source read to the resolved organization and filters records again before projection", async () => {
  const otherTenantCase = record("case-other", ORG_B, {
    title: "Other organization case",
    requesterUserId: ACTOR.userId,
    estimatedAmount: 1,
    currency: "USD",
  });
  const { service, source } = serviceFor([purchaseCase, otherTenantCase]);

  const result = await service.read({
    requestedOrganizationId: ORG_A,
    query: { projection: "purchase-case-summary", scope: "list", limit: 25 },
  });

  assert.equal(result.outcome, "success");
  assert.deepEqual(result.items.map((item) => item.id), ["case-1"]);
  assert.equal(source.calls[0].organizationId, ORG_A);
  assert.equal(JSON.stringify(result).includes("Other organization case"), false);
});

test("CP-04 lets an explicitly configured administrator see permitted organization cases", async () => {
  const admin = Object.freeze({
    ...ACTOR,
    userId: "user-admin",
    permissions: Object.freeze(["purchase.request", "purchase.configure"]),
  });
  const { service } = serviceFor([
    record("case-1", ORG_A, { title: "A case", requesterUserId: "user-requester" }),
    record("case-2", ORG_A, { title: "Another case", requesterUserId: "user-other" }),
  ], admin);

  const result = await service.read({
    query: { projection: "purchase-case-summary", scope: "list" },
  });

  assert.equal(result.outcome, "success");
  assert.deepEqual(result.items.map((item) => item.id), ["case-1", "case-2"]);
});

test("CP-04 rejects organization-scope filters and does not let a client expand tenant scope", async () => {
  const { service } = serviceFor([purchaseCase]);

  const result = await service.read({
    requestedOrganizationId: ORG_A,
    query: {
      projection: "purchase-case-summary",
      scope: "list",
      filters: [{ field: "organizationId", operator: "==", value: ORG_B }],
    },
  });

  assert.deepEqual(
    { outcome: result.outcome, code: result.code },
    { outcome: "failure", code: "validation-failure" },
  );
});

test("CP-04 returns only explicit allowlisted case fields", async () => {
  const { service } = serviceFor([purchaseCase]);

  const result = await service.read({
    query: { projection: "purchase-case-detail", scope: "record", recordId: purchaseCase.id },
  });

  assert.equal(result.outcome, "success");
  const item = result.items[0];
  assert.equal(item.title, "Replacement laptops");
  assert.equal(item.estimatedAmount, 2400);
  assert.equal("approvalComments" in item, false);
  assert.equal("budgetAmount" in item, false);
  assert.equal("receiptUrl" in item, false);
  assert.equal("storagePath" in item, false);
});

test("CP-04 protects budget and offer projections with capability checks", async () => {
  const { service } = serviceFor([
    record("budget-1", ORG_A, { budgetAmount: 100, currency: "USD", updatedAt: "2026-09-01" }, "accelpoBudgets"),
    record("offer-1", ORG_A, { purchaseCaseId: purchaseCase.id, allInAmount: 75, currency: "USD", requesterUserId: ACTOR.userId }, "accelpoOffers"),
  ]);

  const budget = await service.read({ query: { projection: "budget-summary", scope: "list" } });
  assert.deepEqual(
    { outcome: budget.outcome, code: budget.code },
    { outcome: "failure", code: "forbidden" },
  );

  const offer = await service.read({ query: { projection: "offer-summary", scope: "list" } });
  assert.equal(offer.outcome, "success");
  assert.equal(offer.items[0].allInAmount, 75);
  assert.equal("approvalComments" in offer.items[0], false);
});

test("CP-04 scopes tasks and notifications to the current recipient without exposing private payloads", async () => {
  const { service } = serviceFor([
    record("task-1", ORG_A, {
      type: "approval",
      title: "Review request",
      status: "open",
      assignedToUserId: ACTOR.userId,
      permittedAction: "review",
      deepLink: "/purchases/case-1",
      privatePayload: { budget: 500 },
    }, "accelpoTasks"),
    record("task-2", ORG_A, { type: "approval", title: "Someone else's task", status: "open", assignedToUserId: "user-other" }, "accelpoTasks"),
    record("notice-1", ORG_A, {
      type: "approval-decision",
      title: "A decision is ready",
      body: "Open the request to see the next step.",
      recipientUserIds: [ACTOR.userId],
      safeDisplayFacts: { budget: 500 },
    }, "accelpoNotifications"),
  ]);

  const tasks = await service.read({ query: { projection: "task-summary", scope: "list" } });
  assert.equal(tasks.outcome, "success");
  assert.deepEqual(tasks.items.map((item) => item.id), ["task-1"]);
  assert.equal("privatePayload" in tasks.items[0], false);

  const notices = await service.read({ query: { projection: "notification-summary", scope: "list" } });
  assert.equal(notices.outcome, "success");
  assert.equal(notices.items[0].body, "Open the request to see the next step.");
  assert.equal("safeDisplayFacts" in notices.items[0], false);
});

test("CP-04 preserves empty, not-found, and unauthenticated distinctions without revealing records", async () => {
  const { service } = serviceFor([purchaseCase]);

  const empty = await service.read({ query: { projection: "task-summary", scope: "list" } });
  assert.deepEqual(
    { outcome: empty.outcome, items: empty.items },
    { outcome: "empty", items: [] },
  );

  const missing = await service.read({ query: { projection: "purchase-case-detail", scope: "record", recordId: "case-other" } });
  assert.deepEqual(
    { outcome: missing.outcome, code: missing.code },
    { outcome: "failure", code: "not-found" },
  );

  const unauthenticated = new QueryProjectionService({
    source: new MemoryProjectionSource([purchaseCase]),
    access: { async resolve() { return { kind: "unauthenticated" }; } },
  });
  const denied = await unauthenticated.read({ query: { projection: "purchase-case-summary", scope: "list" } });
  assert.deepEqual(
    { outcome: denied.outcome, code: denied.code },
    { outcome: "failure", code: "unauthenticated" },
  );
});

test("CP-04 passes stable pagination and only approved filters to the source", async () => {
  const { service, source } = serviceFor([purchaseCase]);
  await service.read({
    query: {
      projection: "purchase-case-summary",
      scope: "list",
      filters: [{ field: "status", operator: "==", value: "pending" }],
      cursor: "cursor-1",
      limit: 10,
    },
  });

  assert.deepEqual(source.calls[0], {
    kind: "list",
    collection: "accelpoPurchaseCases",
    organizationId: ORG_A,
    filters: [{ field: "status", operator: "==", value: "pending" }],
    sortField: "updatedAt",
    cursor: "cursor-1",
    limit: 10,
  });
});
