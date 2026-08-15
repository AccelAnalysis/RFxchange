import assert from "node:assert/strict";
import test from "node:test";

import {
  FOUNDING_CAP,
  FOUNDING_PRICE_ID,
  assertFoundingSubscriptionCorrelation,
  commercialProjectionStatus,
  foundingPriceIdForMode,
  hasActiveFoundingRecognition,
  reconcileFoundingCapacity,
  releaseExpiredCheckoutReservation,
  reserveFoundingCapacity,
  subscriptionRetainsCapacity,
} from "../lib/application/market-ready-founding-commerce-reconcile.js";

function capacity(committed = [], reserved = []) {
  return { cap: FOUNDING_CAP, committedOrganizationIds: committed, reservedOrganizationIds: reserved };
}

function subscription(overrides = {}) {
  return {
    id: "sub_founding",
    customerId: "cus_founding",
    organizationId: "org-founding",
    status: "active",
    priceId: FOUNDING_PRICE_ID,
    quantity: 1,
    currentPeriodEndsAt: "2026-09-13T00:00:00.000Z",
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

test("recognition and capacity are intentionally separate", () => {
  for (const status of ["active", "trialing"]) {
    assert.equal(hasActiveFoundingRecognition(status), true);
    assert.equal(subscriptionRetainsCapacity(status), true);
  }
  for (const status of ["past_due", "unpaid", "paused", "incomplete"]) {
    assert.equal(hasActiveFoundingRecognition(status), false);
    assert.equal(subscriptionRetainsCapacity(status), true);
  }
  for (const status of ["canceled", "incomplete_expired"]) {
    assert.equal(hasActiveFoundingRecognition(status), false);
    assert.equal(subscriptionRetainsCapacity(status), false);
  }
  assert.equal(commercialProjectionStatus("past_due"), "past-due");
  assert.equal(commercialProjectionStatus("unpaid"), "suspended");
});

test("reserved organization first observed delinquent becomes committed and later active consumes no second slot", () => {
  const reserved = reserveFoundingCapacity(capacity(), "org-founding");
  const delinquent = reconcileFoundingCapacity(reserved, "org-founding", "past_due");
  assert.deepEqual(delinquent.committedOrganizationIds, ["org-founding"]);
  assert.deepEqual(delinquent.reservedOrganizationIds, []);
  const active = reconcileFoundingCapacity(delinquent, "org-founding", "active");
  assert.deepEqual(active, delinquent);
});

test("suspended-equivalent first provider state retains the reserved Founding slot", () => {
  for (const status of ["unpaid", "paused", "incomplete"]) {
    const reserved = reserveFoundingCapacity(capacity(), "org-founding");
    const reconciled = reconcileFoundingCapacity(reserved, "org-founding", status);
    assert.deepEqual(reconciled.committedOrganizationIds, ["org-founding"]);
    assert.deepEqual(reconciled.reservedOrganizationIds, []);
  }
});

test("checkout expiry cannot free capacity when provider truth contains a non-terminal subscription", () => {
  const reserved = reserveFoundingCapacity(capacity(), "org-founding");
  const retained = releaseExpiredCheckoutReservation({
    current: reserved,
    organizationId: "org-founding",
    providerHasNonTerminalFoundingSubscription: true,
  });
  assert.deepEqual(retained.committedOrganizationIds, ["org-founding"]);
  assert.deepEqual(retained.reservedOrganizationIds, []);
});

test("authenticated checkout expiry may release an uncommitted reservation only when provider truth confirms no subscription", () => {
  const reserved = reserveFoundingCapacity(capacity(), "org-founding");
  const released = releaseExpiredCheckoutReservation({
    current: reserved,
    organizationId: "org-founding",
    providerHasNonTerminalFoundingSubscription: false,
  });
  assert.deepEqual(released.committedOrganizationIds, []);
  assert.deepEqual(released.reservedOrganizationIds, []);
});

test("terminal cancellation releases the committed position", () => {
  const current = capacity(["org-founding"], []);
  assert.deepEqual(
    reconcileFoundingCapacity(current, "org-founding", "canceled"),
    capacity([], []),
  );
});

test("organization 250 can commit its own reservation while unrelated organization 251 fails", () => {
  const committed = Array.from({ length: 249 }, (_, index) => `org-${index + 1}`);
  const reserved250 = reserveFoundingCapacity(capacity(committed), "org-250");
  const committed250 = reconcileFoundingCapacity(reserved250, "org-250", "past_due");
  assert.equal(committed250.committedOrganizationIds.length, 250);
  assert.throws(() => reserveFoundingCapacity(committed250, "org-251"), /capacity is full/);
  assert.throws(
    () => reconcileFoundingCapacity(committed250, "org-251", "active"),
    /cannot be admitted beyond/,
  );
});

test("live and test modes bind reconciliation to server-approved Price identity", () => {
  const testPrice = "price_test_founding";
  assert.equal(foundingPriceIdForMode("live", "price_attacker"), FOUNDING_PRICE_ID);
  assert.equal(foundingPriceIdForMode("test", testPrice), testPrice);
  assert.throws(() => foundingPriceIdForMode("test", ""), /Test Founding Price id/);

  assert.doesNotThrow(() => assertFoundingSubscriptionCorrelation({
    snapshot: subscription(),
    organizationId: "org-founding",
    customerId: "cus_founding",
    expectedPriceId: foundingPriceIdForMode("live"),
  }));
  assert.doesNotThrow(() => assertFoundingSubscriptionCorrelation({
    snapshot: subscription({ priceId: testPrice }),
    organizationId: "org-founding",
    customerId: "cus_founding",
    expectedPriceId: foundingPriceIdForMode("test", testPrice),
  }));
  assert.throws(() => assertFoundingSubscriptionCorrelation({
    snapshot: subscription({ priceId: testPrice }),
    organizationId: "org-founding",
    customerId: "cus_founding",
    expectedPriceId: FOUNDING_PRICE_ID,
  }), /Price/);
});

test("exact Customer, organization, Price and quantity correlation fails closed", () => {
  assert.doesNotThrow(() => assertFoundingSubscriptionCorrelation({
    snapshot: subscription(), organizationId: "org-founding", customerId: "cus_founding", expectedPriceId: FOUNDING_PRICE_ID,
  }));
  for (const [field, value, pattern] of [
    ["organizationId", "org-wrong", /organization metadata/],
    ["customerId", "cus-wrong", /Customer/],
    ["priceId", "price_wrong", /Price/],
    ["quantity", 2, /quantity/],
  ]) {
    const snapshot = subscription({ [field]: value });
    assert.throws(() => assertFoundingSubscriptionCorrelation({
      snapshot, organizationId: "org-founding", customerId: "cus_founding", expectedPriceId: FOUNDING_PRICE_ID,
    }), pattern);
  }
});