import assert from "node:assert/strict";
import test from "node:test";

import {
  reconcileCurrentFoundingSubscription,
  reconcileExpiredFoundingCheckout,
} from "../lib/runtime/market-ready-founding-commerce-store.js";

function snapshot(value) {
  return {
    exists: value !== undefined,
    data() { return value; },
  };
}

function fakeFirestore(initialEntries) {
  const documents = new Map(initialEntries);
  const sets = [];
  const creates = [];
  const db = {
    collection(collection) {
      return {
        doc(id) {
          return { path: `${collection}/${id}` };
        },
      };
    },
    async runTransaction(handler) {
      const transaction = {
        async get(ref) { return snapshot(documents.get(ref.path)); },
        set(ref, value) {
          sets.push({ path: ref.path, value });
          documents.set(ref.path, value);
        },
        create(ref, value) {
          if (documents.has(ref.path)) throw new Error(`document already exists: ${ref.path}`);
          creates.push({ path: ref.path, value });
          documents.set(ref.path, value);
        },
      };
      return handler(transaction);
    },
  };
  return { db, documents, sets, creates };
}

function commercialAccount(organizationId, customerId) {
  return {
    id: organizationId,
    organizationId,
    schemaVersion: 1,
    providerReferences: [{ providerKey: "stripe", kind: "customer", externalReference: customerId }],
    subscription: { status: "not-subscribed", providerSubscriptionReference: null },
  };
}

function subscriptionCommercialAccount(organizationId, customerId, subscriptionId, status) {
  const subscriptionReference = { providerKey: "stripe", kind: "subscription", externalReference: subscriptionId };
  return {
    ...commercialAccount(organizationId, customerId),
    providerReferences: [
      { providerKey: "stripe", kind: "customer", externalReference: customerId },
      subscriptionReference,
    ],
    subscription: { status, providerSubscriptionReference: subscriptionReference },
  };
}

function canceledCommercialAccount(organizationId, customerId, subscriptionId) {
  return subscriptionCommercialAccount(organizationId, customerId, subscriptionId, "canceled");
}

function capacity(reservations, committedOrganizationIds = []) {
  return {
    id: "current",
    limit: 250,
    committedOrganizationIds,
    reservations,
    schemaVersion: 1,
    createdAt: "server-created-at",
    updatedAt: "server-updated-at",
  };
}

function reconciliation(organizationId, customerId, subscriptionId, status, createdAt) {
  const recognized = status === "active" || status === "trialing";
  const retainsCapacity = status !== "canceled" && status !== "incomplete_expired";
  return {
    id: organizationId,
    organizationId,
    providerKey: "stripe",
    providerCustomerId: customerId,
    providerSubscriptionId: subscriptionId,
    observedStatus: status,
    activeRecognition: recognized,
    retainsCapacity,
    lastProviderEventId: `evt-${subscriptionId}-${status}`,
    lastProviderEventCreatedAt: createdAt,
    schemaVersion: 1,
    createdAt: "server-created-at",
    updatedAt: "server-updated-at",
  };
}

test("Functions expiry mutation preserves other organizations' ambiguous reservation lease timestamps", async () => {
  const otherReservedAt = "2026-08-15T01:02:03.000Z";
  const store = fakeFirestore([
    ["organizationCommercialAccounts/org-expire", commercialAccount("org-expire", "cus-expire")],
    ["commercialFoundingCapacity/current", capacity([
      {
        reservationId: "reservation-expire",
        organizationId: "org-expire",
        checkoutSessionId: "cs-expire",
        checkoutUrl: "https://checkout.stripe.test/cs-expire",
        reservedAt: "2026-08-15T01:00:00.000Z",
      },
      {
        reservationId: "reservation-ambiguous-other",
        organizationId: "org-other",
        checkoutSessionId: null,
        checkoutUrl: null,
        reservedAt: otherReservedAt,
      },
    ])],
  ]);

  const result = await reconcileExpiredFoundingCheckout({
    db: store.db,
    eventId: "evt-expire-current",
    organizationId: "org-expire",
    customerId: "cus-expire",
    reservationId: "reservation-expire",
    eventCreatedAt: "2026-08-15T02:00:00.000Z",
    providerHasNonTerminalFoundingSubscription: false,
  });

  assert.equal(result.duplicate, false);
  assert.equal(result.reservationCorrelationMatched, true);
  const capacityWrite = store.sets.find((write) => write.path === "commercialFoundingCapacity/current");
  assert.ok(capacityWrite, "exact expiry must write authoritative capacity state");
  assert.equal(capacityWrite.value.reservations.length, 1);
  assert.equal(capacityWrite.value.reservations[0].organizationId, "org-other");
  assert.equal(capacityWrite.value.reservations[0].reservationId, "reservation-ambiguous-other");
  assert.equal(capacityWrite.value.reservations[0].reservedAt, otherReservedAt);
});

test("late expiry for an old Checkout reservation cannot release a newer live reservation", async () => {
  const newReservation = {
    reservationId: "reservation-new",
    organizationId: "org-expire",
    checkoutSessionId: "cs-new",
    checkoutUrl: "https://checkout.stripe.test/cs-new",
    reservedAt: "2026-08-15T03:00:00.000Z",
  };
  const store = fakeFirestore([
    ["organizationCommercialAccounts/org-expire", commercialAccount("org-expire", "cus-expire")],
    ["commercialFoundingCapacity/current", capacity([newReservation])],
  ]);

  const result = await reconcileExpiredFoundingCheckout({
    db: store.db,
    eventId: "evt-expire-old-session",
    organizationId: "org-expire",
    customerId: "cus-expire",
    reservationId: "reservation-old",
    eventCreatedAt: "2026-08-15T03:05:00.000Z",
    providerHasNonTerminalFoundingSubscription: false,
  });

  assert.equal(result.duplicate, false);
  assert.equal(result.reservationCorrelationMatched, false);
  assert.equal(
    store.sets.some((write) => write.path === "commercialFoundingCapacity/current"),
    false,
    "mismatched old expiry must not mutate capacity",
  );
  assert.deepEqual(store.documents.get("commercialFoundingCapacity/current").reservations, [newReservation]);
  const recordedEvent = store.creates.find((write) => write.path === "commercialProviderEvents/evt-expire-old-session");
  assert.ok(recordedEvent, "late expiry must still be durably recorded for replay safety");
  assert.equal(recordedEvent.value.checkoutReservationId, "reservation-old");
  assert.equal(recordedEvent.value.reservationCorrelationMatched, false);
});

test("later terminal lifecycle for an old subscription preserves a newer Checkout reservation", async () => {
  const organizationId = "org-replacement";
  const customerId = "cus-replacement";
  const oldSubscriptionId = "sub-old";
  const newReservation = {
    reservationId: "reservation-new",
    organizationId,
    checkoutSessionId: "cs-new",
    checkoutUrl: "https://checkout.stripe.test/cs-new",
    reservedAt: "2026-08-15T04:00:00.000Z",
  };
  const store = fakeFirestore([
    [`organizationCommercialAccounts/${organizationId}`, canceledCommercialAccount(organizationId, customerId, oldSubscriptionId)],
    ["commercialFoundingCapacity/current", capacity([newReservation])],
    [`commercialSubscriptionReconciliations/${organizationId}`, reconciliation(organizationId, customerId, oldSubscriptionId, "canceled", "2026-08-15T03:55:00.000Z")],
  ]);

  const result = await reconcileCurrentFoundingSubscription({
    db: store.db,
    eventId: "evt-old-deleted-late",
    eventType: "customer.subscription.deleted",
    eventCreatedAt: "2026-08-15T04:05:00.000Z",
    snapshot: {
      id: oldSubscriptionId,
      customerId,
      organizationId,
      status: "canceled",
      priceId: "price_test_founding",
      quantity: 1,
      currentPeriodEndsAt: null,
      cancelAtPeriodEnd: false,
      checkoutReservationId: "reservation-old",
    },
  });

  assert.equal(result.recognized, false);
  assert.equal(result.retainsCapacity, false);
  const capacityWrite = store.sets.find((write) => write.path === "commercialFoundingCapacity/current");
  assert.ok(capacityWrite, "terminal lifecycle should still persist committed-capacity release");
  assert.deepEqual(capacityWrite.value.committedOrganizationIds, []);
  assert.deepEqual(capacityWrite.value.reservations, [newReservation]);
  const recordedEvent = store.creates.find((write) => write.path === "commercialProviderEvents/evt-old-deleted-late");
  assert.ok(recordedEvent, "late terminal lifecycle must remain replay-safe");
  assert.equal(recordedEvent.value.checkoutReservationId, "reservation-old");
});

test("replacement subscription establishes its own lifecycle ordering baseline", async () => {
  const organizationId = "org-order-replacement";
  const customerId = "cus-order-replacement";
  const oldSubscriptionId = "sub-order-old";
  const newSubscriptionId = "sub-order-new";
  const newReservation = {
    reservationId: "reservation-order-new",
    organizationId,
    checkoutSessionId: "cs-order-new",
    checkoutUrl: "https://checkout.stripe.test/cs-order-new",
    reservedAt: "2026-08-15T04:00:00.000Z",
  };
  const store = fakeFirestore([
    [`organizationCommercialAccounts/${organizationId}`, canceledCommercialAccount(organizationId, customerId, oldSubscriptionId)],
    ["commercialFoundingCapacity/current", capacity([newReservation])],
    [`commercialSubscriptionReconciliations/${organizationId}`, reconciliation(organizationId, customerId, oldSubscriptionId, "canceled", "2026-08-15T04:05:00.000Z")],
  ]);

  const result = await reconcileCurrentFoundingSubscription({
    db: store.db,
    eventId: "evt-new-active-created-earlier",
    eventType: "customer.subscription.updated",
    eventCreatedAt: "2026-08-15T04:03:00.000Z",
    snapshot: {
      id: newSubscriptionId,
      customerId,
      organizationId,
      status: "active",
      priceId: "price_test_founding",
      quantity: 1,
      currentPeriodEndsAt: "2026-09-15T04:03:00.000Z",
      cancelAtPeriodEnd: false,
      checkoutReservationId: "reservation-order-new",
    },
  });

  assert.equal(result.recognized, true);
  assert.equal(result.retainsCapacity, true);
  const capacityWrite = store.sets.find((write) => write.path === "commercialFoundingCapacity/current");
  assert.ok(capacityWrite, "replacement subscription must reconcile capacity despite the old subscription's later event timestamp");
  assert.deepEqual(capacityWrite.value.committedOrganizationIds, [organizationId]);
  assert.deepEqual(capacityWrite.value.reservations, []);
  const accountWrite = store.sets.find((write) => write.path === `organizationCommercialAccounts/${organizationId}`);
  assert.equal(accountWrite.value.subscription.status, "active");
  assert.equal(accountWrite.value.subscription.providerSubscriptionReference.externalReference, newSubscriptionId);
  const reconciliationWrite = store.sets.find((write) => write.path === `commercialSubscriptionReconciliations/${organizationId}`);
  assert.equal(reconciliationWrite.value.providerSubscriptionId, newSubscriptionId);
  assert.equal(reconciliationWrite.value.lastProviderEventCreatedAt, "2026-08-15T04:03:00.000Z");
});

test("superseded old subscription cannot overwrite an active replacement", async () => {
  const organizationId = "org-order-current";
  const customerId = "cus-order-current";
  const oldSubscriptionId = "sub-order-old-current";
  const newSubscriptionId = "sub-order-new-current";
  const store = fakeFirestore([
    [`organizationCommercialAccounts/${organizationId}`, subscriptionCommercialAccount(organizationId, customerId, newSubscriptionId, "active")],
    ["commercialFoundingCapacity/current", capacity([], [organizationId])],
    [`commercialSubscriptionReconciliations/${organizationId}`, reconciliation(organizationId, customerId, newSubscriptionId, "active", "2026-08-15T04:03:00.000Z")],
  ]);

  const result = await reconcileCurrentFoundingSubscription({
    db: store.db,
    eventId: "evt-old-terminal-after-replacement",
    eventType: "customer.subscription.deleted",
    eventCreatedAt: "2026-08-15T04:06:00.000Z",
    snapshot: {
      id: oldSubscriptionId,
      customerId,
      organizationId,
      status: "canceled",
      priceId: "price_test_founding",
      quantity: 1,
      currentPeriodEndsAt: null,
      cancelAtPeriodEnd: false,
      checkoutReservationId: "reservation-order-old",
    },
  });

  assert.equal(result.recognized, true);
  assert.equal(result.retainsCapacity, true);
  assert.equal(store.sets.length, 0, "superseded lifecycle must not rewrite account, capacity, or reconciliation state");
  assert.deepEqual(store.documents.get("commercialFoundingCapacity/current").committedOrganizationIds, [organizationId]);
  const recordedEvent = store.creates.find((write) => write.path === "commercialProviderEvents/evt-old-terminal-after-replacement");
  assert.ok(recordedEvent, "superseded lifecycle must still be durably recorded for replay safety");
  assert.equal(recordedEvent.value.ignoredAsStale, true);
  assert.equal(recordedEvent.value.ignoredReason, "superseded-subscription");
});