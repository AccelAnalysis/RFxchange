import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { isPersistentParticipantPath } from "../src/application/participant/participant-lens-registry.ts";
import {
  getFoundingCapacitySnapshot,
  reserveFoundingCheckout,
} from "../src/infrastructure/commercial/founding-runtime.ts";

function readOnlyCapacityDb(data) {
  return {
    collection() {
      return {
        doc() {
          return {
            async get() {
              return { data: () => data };
            },
          };
        },
      };
    },
  };
}

function freshReservationDb() {
  let created = null;
  const ref = { path: "commercialFoundingCapacity/current" };
  const snapshot = {
    exists: false,
    ref,
    data: () => undefined,
    get: () => undefined,
  };
  const db = {
    collection() {
      return { doc: () => ref };
    },
    async runTransaction(handler) {
      return handler({
        async get() { return snapshot; },
        create(_target, value) { created = value; },
        set() { throw new Error("new capacity must be created, not replaced"); },
      });
    },
  };
  return { db, created: () => created };
}

const validCapacity = Object.freeze({
  schemaVersion: 1,
  limit: 250,
  committedOrganizationIds: Object.freeze([]),
  reservations: Object.freeze([]),
});

function validReservation(overrides = {}) {
  return {
    reservationId: "reservation-1",
    organizationId: "org-1",
    checkoutSessionId: null,
    checkoutUrl: null,
    reservedAt: "2026-08-15T00:00:00.000Z",
    ...overrides,
  };
}

test("existing authoritative capacity arrays and entries fail closed instead of being filtered", async () => {
  const malformed = [
    { ...validCapacity, committedOrganizationIds: undefined },
    { ...validCapacity, committedOrganizationIds: {} },
    { ...validCapacity, committedOrganizationIds: ["org-1", 7] },
    { ...validCapacity, committedOrganizationIds: ["org-1", "org-1"] },
    { ...validCapacity, reservations: undefined },
    { ...validCapacity, reservations: {} },
    { ...validCapacity, reservations: [null] },
    { ...validCapacity, reservations: [validReservation({ reservationId: " " })] },
    { ...validCapacity, reservations: [validReservation({ organizationId: 7 })] },
    { ...validCapacity, reservations: [validReservation({ checkoutSessionId: undefined })] },
    { ...validCapacity, reservations: [validReservation({ checkoutUrl: " " })] },
    { ...validCapacity, reservations: [validReservation({ reservedAt: "not-a-date" })] },
    {
      ...validCapacity,
      reservations: [
        validReservation(),
        validReservation({ organizationId: "org-2" }),
      ],
    },
  ];

  for (const value of malformed) {
    await assert.rejects(
      getFoundingCapacitySnapshot(readOnlyCapacityDb(value)),
      (error) => error?.code === "capacity-state-invalid",
    );
  }
});

test("an absent capacity document still initializes the approved empty cap", async () => {
  const snapshot = await getFoundingCapacitySnapshot(readOnlyCapacityDb(undefined), "org-1");
  assert.deepEqual(snapshot, {
    limit: 250,
    committed: 0,
    reserved: 0,
    remaining: 250,
    currentOrganizationReserved: false,
  });
});

test("Checkout reservation identity is stable across reclamation for the same command", async () => {
  const firstStore = freshReservationDb();
  const replayStore = freshReservationDb();
  const otherCommandStore = freshReservationDb();

  const first = await reserveFoundingCheckout(firstStore.db, "org-command", "command-replay-0001");
  const replayAfterReclamation = await reserveFoundingCheckout(
    replayStore.db,
    "org-command",
    "command-replay-0001",
  );
  const otherCommand = await reserveFoundingCheckout(
    otherCommandStore.db,
    "org-command",
    "command-replay-0002",
  );

  assert.equal(first.kind, "reserved");
  assert.equal(replayAfterReclamation.kind, "reserved");
  assert.equal(first.reservationId, replayAfterReclamation.reservationId);
  assert.notEqual(first.reservationId, otherCommand.reservationId);
  assert.match(first.reservationId, /^founding-command-[a-f0-9]{64}$/);
  assert.equal(firstStore.created().reservations[0].reservationId, first.reservationId);
});

test("provider idempotency is bound to the validated command-derived reservation", async () => {
  const runtime = await readFile(
    new URL("../src/infrastructure/commercial/founding-runtime.ts", import.meta.url),
    "utf8",
  );
  assert.match(runtime, /function foundingCheckoutReservationId\(organizationId: string, commandId: string\)/);
  assert.match(runtime, /createHash\("sha256"\)/);
  assert.match(runtime, /reserveFoundingCheckout\(input\.context\.db, organizationId, commandId\)/);
  assert.match(runtime, /idempotencyKey: `founding:\$\{organizationId\}:\$\{reservation\.reservationId\}`/);
  assert.match(runtime, /checkoutCorrelationId: reservation\.reservationId/);
});

test("the protected Founding commerce destination remains inside the participant shell", async () => {
  assert.equal(isPersistentParticipantPath("/commercial/founding"), true);
  assert.equal(isPersistentParticipantPath("/commercial/founding/return"), true);
  assert.equal(isPersistentParticipantPath("/commercial"), false);

  const card = await readFile(
    new URL("../src/components/commercial/FoundingMembershipCard.tsx", import.meta.url),
    "utf8",
  );
  assert.match(card, /usePersistentParticipantShellContext\(\)/);
  assert.match(card, /if \(persistent && payload\) reportAuthorizedParticipant\(\)/);
  assert.doesNotMatch(card, /if \(persistent\) reportAuthorizedParticipant\(\)/);
});
