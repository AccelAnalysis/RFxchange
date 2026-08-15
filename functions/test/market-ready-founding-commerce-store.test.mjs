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

function canceledCommercialAccount(organizationId, customerId, subscriptionId) {
  const subscriptionReference = { providerKey: "stripe", kind: "subscription", externalReference: subscriptionId };
  return {
    ...commercialAccount(organizationId, customerId),
    providerReferences: [
      { providerKey: "stripe", kind: "customer", externalReference: customerId },
      subscriptionReference,
    ],
    subscription: { status: "canceled", providerSubscriptionReference: subscriptionReference },
  };
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
    [
      `organizationCommercialAccounts/${organizationId}`,
      canceledCommercialAccount(organizationId, customerId, oldSubscriptionId),
    ],
    ["commercialFoundingCapacity/current", capacity([newReservation])],
    [
      `commercialSubscriptionReconciliations/${organizationId}`,
      {
        id: organizationId,
        organizationId,
        providerKey: "stripe",
        providerCustomerId: customerId,
        providerSubscriptionId: oldSubscriptionId,
        observedStatus: "canceled",
        activeRecognition: false,
        retainsCapacity: false,
        lastProviderEventId: "evt-old-canceled",
        lastProviderEventCreatedAt: "2026-08-15T03:55:00.000Z",
        schemaVersion: 1,
        createdAt: "server-created-at",
        updatedAt: "server-updated-at",
      },
    ],
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