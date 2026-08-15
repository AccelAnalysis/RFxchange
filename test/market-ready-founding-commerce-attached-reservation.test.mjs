import assert from "node:assert/strict";
import test from "node:test";
import { Timestamp } from "firebase-admin/firestore";

import { releaseExpiredAttachedFoundingReservation } from "../src/infrastructure/commercial/founding-runtime.ts";

function capacity(reservations, committedOrganizationIds = []) {
  return {
    limit: 250,
    committedOrganizationIds,
    reservations,
    schemaVersion: 1,
    createdAt: Timestamp.fromDate(new Date("2026-08-15T00:00:00.000Z")),
    updatedAt: Timestamp.fromDate(new Date("2026-08-15T00:00:00.000Z")),
  };
}

function fakeFirestore(initialCapacity) {
  let current = initialCapacity;
  const ref = { path: "commercialFoundingCapacity/current" };
  const db = {
    collection(collection) {
      assert.equal(collection, "commercialFoundingCapacity");
      return {
        doc(id) {
          assert.equal(id, "current");
          return ref;
        },
      };
    },
    async runTransaction(handler) {
      const transaction = {
        async get(requestedRef) {
          assert.equal(requestedRef, ref);
          return {
            exists: true,
            ref,
            data() { return current; },
            get(field) { return current[field]; },
          };
        },
        set(requestedRef, value) {
          assert.equal(requestedRef, ref);
          current = value;
        },
        create() {
          throw new Error("existing capacity document must not be created");
        },
      };
      return handler(transaction);
    },
  };
  return { db, read: () => current };
}

const attached = Object.freeze({
  reservationId: "reservation-current",
  organizationId: "org-founding",
  checkoutSessionId: "cs-current",
  checkoutUrl: "https://checkout.stripe.test/cs-current",
  reservedAt: "2026-08-15T00:00:00.000Z",
});

test("provider-confirmed expiry releases only the exact attached reservation", async () => {
  const store = fakeFirestore(capacity([attached]));
  const released = await releaseExpiredAttachedFoundingReservation(store.db, {
    organizationId: "org-founding",
    reservationId: "reservation-current",
    checkoutSessionId: "cs-current",
  });
  assert.equal(released, true);
  assert.deepEqual(store.read().reservations, []);
});

test("mismatched Checkout Session evidence cannot release an attached reservation", async () => {
  const store = fakeFirestore(capacity([attached]));
  const released = await releaseExpiredAttachedFoundingReservation(store.db, {
    organizationId: "org-founding",
    reservationId: "reservation-current",
    checkoutSessionId: "cs-old",
  });
  assert.equal(released, false);
  assert.deepEqual(store.read().reservations, [attached]);
});

test("stale old reservation evidence cannot release a replacement reservation and Session", async () => {
  const replacement = Object.freeze({
    reservationId: "reservation-new",
    organizationId: "org-founding",
    checkoutSessionId: "cs-new",
    checkoutUrl: "https://checkout.stripe.test/cs-new",
    reservedAt: "2026-08-15T03:00:00.000Z",
  });
  const store = fakeFirestore(capacity([replacement]));
  const released = await releaseExpiredAttachedFoundingReservation(store.db, {
    organizationId: "org-founding",
    reservationId: "reservation-old",
    checkoutSessionId: "cs-old",
  });
  assert.equal(released, false);
  assert.deepEqual(store.read().reservations, [replacement]);
});

test("attached reservation is never released while the organization is committed", async () => {
  const store = fakeFirestore(capacity([attached], ["org-founding"]));
  const released = await releaseExpiredAttachedFoundingReservation(store.db, {
    organizationId: "org-founding",
    reservationId: "reservation-current",
    checkoutSessionId: "cs-current",
  });
  assert.equal(released, false);
  assert.deepEqual(store.read().reservations, [attached]);
});