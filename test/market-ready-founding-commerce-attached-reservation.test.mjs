import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const runtime = await readFile(
  new URL("../src/infrastructure/commercial/founding-runtime.ts", import.meta.url),
  "utf8",
);

const helperStart = runtime.indexOf("export async function releaseExpiredAttachedFoundingReservation");
const helperEnd = runtime.indexOf("function stripeCustomerId", helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "attached-reservation release helper must remain present");
const releaseHelper = runtime.slice(helperStart, helperEnd);

const reconcileStart = runtime.indexOf("async function reconcileAmbiguousFoundingReservations");
const reconcileEnd = runtime.indexOf("export async function attachFoundingCheckout", reconcileStart);
assert.ok(reconcileStart >= 0 && reconcileEnd > reconcileStart, "stale-reservation reconciler must remain present");
const reconciler = runtime.slice(reconcileStart, reconcileEnd);

test("attached reservation release is atomic and requires exact organization, reservation, and Checkout Session correlation", () => {
  assert.match(releaseHelper, /db\.runTransaction\(/);
  assert.match(releaseHelper, /state\.committedOrganizationIds\.includes\(input\.organizationId\)\) return false/);
  assert.match(releaseHelper, /reservation\.organizationId === input\.organizationId/);
  assert.match(releaseHelper, /reservation\.reservationId === input\.reservationId/);
  assert.match(releaseHelper, /reservation\.checkoutSessionId === input\.checkoutSessionId/);
  assert.match(releaseHelper, /if \(index < 0\) return false/);
  assert.match(releaseHelper, /writeCapacity\(transaction, snap/);
});

test("stale attached reservations are inspected instead of being excluded from reconciliation", () => {
  assert.doesNotMatch(
    reconciler,
    /!reservation\.checkoutSessionId\s*&&\s*!reservation\.checkoutUrl/,
    "attached stale reservations must not be filtered out before provider reconciliation",
  );
  assert.match(reconciler, /inspectAmbiguousFoundingReservation\(/);
  assert.match(reconciler, /const attached = Boolean\(reservation\.checkoutSessionId \|\| reservation\.checkoutUrl\)/);
});

test("attached capacity is released only from provider-confirmed expiry of the exact stored Session", () => {
  assert.match(reconciler, /providerState\.matchingCheckoutStatus === "expired"/);
  assert.match(reconciler, /providerState\.matchingCheckoutSessionId === reservation\.checkoutSessionId/);
  assert.match(reconciler, /releaseExpiredAttachedFoundingReservation\(db/);
  assert.match(reconciler, /reservationId: reservation\.reservationId/);
  assert.match(reconciler, /checkoutSessionId: reservation\.checkoutSessionId!/);
});

test("missing or mismatched attached provider truth fails closed instead of releasing capacity", () => {
  assert.match(reconciler, /if \(!exactExpiredAttachedSession\)/);
  assert.match(reconciler, /provider-state-unavailable/);
  assert.match(reconciler, /Other organizations retain their reservation when provider truth cannot be established/);
});
