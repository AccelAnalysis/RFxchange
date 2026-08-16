import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const runtime = await readFile(
  new URL("../src/infrastructure/commercial/founding-runtime.ts", import.meta.url),
  "utf8",
);

test("existing authoritative capacity arrays and entries fail closed instead of being filtered", () => {
  assert.match(
    runtime,
    /if \(!Array\.isArray\(data\.committedOrganizationIds\) \|\| !Array\.isArray\(data\.reservations\)\)/,
  );
  assert.match(runtime, /function exactCapacityString\(value: unknown, label: string\): string/);
  assert.match(runtime, /capacity-state-invalid/);
  assert.match(runtime, /new Set\(committed\)\.size !== committed\.length/);
  assert.match(
    runtime,
    /new Set\(reservations\.map\(\(reservation\) => reservation\.organizationId\)\)\.size !== reservations\.length/,
  );
  assert.match(
    runtime,
    /new Set\(reservations\.map\(\(reservation\) => reservation\.reservationId\)\)\.size !== reservations\.length/,
  );
  assert.doesNotMatch(
    runtime,
    /data\.committedOrganizationIds\.filter\(\(v\): v is string/,
    "authoritative committed identities must not be silently filtered",
  );
});

test("an absent capacity document still initializes the approved empty cap", () => {
  assert.match(runtime, /function defaultCapacity\(\): CapacityDocument/);
  assert.match(runtime, /limit: RFXCHANGE_FOUNDING_CAP/);
  assert.match(runtime, /committedOrganizationIds: Object\.freeze\(\[\]\)/);
  assert.match(runtime, /reservations: Object\.freeze\(\[\]\)/);
  assert.match(runtime, /if \(!data\) return defaultCapacity\(\)/);
  assert.match(runtime, /remaining: Math\.max\(0, capacity\.limit - committed - reserved\)/);
});

test("Checkout reservation identity is stable across reclamation for the same command", () => {
  assert.match(
    runtime,
    /function foundingCheckoutReservationId\(organizationId: string, commandId: string\): string/,
  );
  assert.match(runtime, /createHash\("sha256"\)/);
  assert.match(runtime, /update\(`\$\{organizationId\}\\u0000\$\{commandId\}`/);
  assert.match(runtime, /return `founding-command-\$\{commandFingerprint\}`/);
  assert.match(
    runtime,
    /reserveFoundingCheckout\(db: Firestore, organizationId: string, commandId: string\)/,
  );
  assert.match(runtime, /const commandReservationId = foundingCheckoutReservationId\(organizationId, commandId\)/);
  assert.match(runtime, /reservationId: commandReservationId/);
});

test("provider idempotency is bound to the validated command-derived reservation", () => {
  assert.match(runtime, /reserveFoundingCheckout\(input\.context\.db, organizationId, commandId\)/);
  assert.match(runtime, /idempotencyKey: `founding:\$\{organizationId\}:\$\{reservation\.reservationId\}`/);
  assert.match(runtime, /checkoutCorrelationId: reservation\.reservationId/);
});

test("the protected Founding commerce destination remains inside the participant shell", async () => {
  const registry = await readFile(
    new URL("../src/application/participant/participant-lens-registry.ts", import.meta.url),
    "utf8",
  );
  const persistentStart = registry.indexOf("const PERSISTENT_PARTICIPANT_PATH_PREFIXES");
  const persistentEnd = registry.indexOf("]);", persistentStart);
  assert.ok(persistentStart >= 0 && persistentEnd > persistentStart);
  const persistentBlock = registry.slice(persistentStart, persistentEnd);
  assert.match(persistentBlock, /["']\/commercial\/founding["']/);
  assert.doesNotMatch(persistentBlock, /["']\/commercial["']/);

  const card = await readFile(
    new URL("../src/components/commercial/FoundingMembershipCard.tsx", import.meta.url),
    "utf8",
  );
  assert.match(card, /usePersistentParticipantShellContext\(\)/);
  assert.match(card, /if \(persistent && payload\) reportAuthorizedParticipant\(\)/);
  assert.doesNotMatch(card, /if \(persistent\) reportAuthorizedParticipant\(\)/);
});
