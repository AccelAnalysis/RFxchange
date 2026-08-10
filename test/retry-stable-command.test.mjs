import assert from "node:assert/strict";
import test from "node:test";

import {
  clearRetryStableCommand,
  resolveRetryStableCommand,
} from "../src/components/referrals/retry-stable-command.ts";

function storage() {
  const values = new Map();
  return {
    values,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
}

test("same reviewed input recovers the original command after component memory is lost", () => {
  const store = storage();
  const first = resolveRetryStableCommand({
    storage: store,
    storageKey: "referral:org-a:membership-a",
    fingerprint: "exact-input-a",
    prefix: "ref-create-send",
    randomId: () => "first",
    now: () => 1_000,
  });
  const afterReload = resolveRetryStableCommand({
    storage: store,
    storageKey: "referral:org-a:membership-a",
    fingerprint: "exact-input-a",
    prefix: "ref-create-send",
    randomId: () => "must-not-run",
    now: () => 2_000,
  });

  assert.equal(first, "ref-create-send-first");
  assert.equal(afterReload, first);
});

test("actor-scoped storage keys cannot transfer a pending command to another membership", () => {
  const store = storage();
  const first = resolveRetryStableCommand({
    storage: store,
    storageKey: "referral:org-a:membership-a",
    fingerprint: "same-business-input",
    prefix: "ref-create-send",
    randomId: () => "actor-a",
    now: () => 1_000,
  });
  const secondActor = resolveRetryStableCommand({
    storage: store,
    storageKey: "referral:org-b:membership-b",
    fingerprint: "same-business-input",
    prefix: "ref-create-send",
    randomId: () => "actor-b",
    now: () => 2_000,
  });

  assert.equal(first, "ref-create-send-actor-a");
  assert.equal(secondActor, "ref-create-send-actor-b");
  assert.notEqual(secondActor, first);
});

test("changed or expired reviewed input receives a different command", () => {
  const store = storage();
  const first = resolveRetryStableCommand({
    storage: store,
    storageKey: "provider",
    fingerprint: "provider-a",
    prefix: "provider-create-send",
    randomId: () => "first",
    now: () => 1_000,
    maximumAgeMs: 10_000,
  });
  const changed = resolveRetryStableCommand({
    storage: store,
    storageKey: "provider",
    fingerprint: "provider-b",
    prefix: "provider-create-send",
    randomId: () => "changed",
    now: () => 2_000,
    maximumAgeMs: 10_000,
  });
  const expired = resolveRetryStableCommand({
    storage: store,
    storageKey: "provider",
    fingerprint: "provider-b",
    prefix: "provider-create-send",
    randomId: () => "expired",
    now: () => 20_001,
    maximumAgeMs: 10_000,
  });

  assert.equal(first, "provider-create-send-first");
  assert.equal(changed, "provider-create-send-changed");
  assert.equal(expired, "provider-create-send-expired");
});

test("clear removes only the matching pending command", () => {
  const store = storage();
  const commandId = resolveRetryStableCommand({
    storage: store,
    storageKey: "referral",
    fingerprint: "exact-input",
    prefix: "ref-create-send",
    randomId: () => "retained",
    now: () => 1_000,
  });

  clearRetryStableCommand({
    storage: store,
    storageKey: "referral",
    commandId: "ref-create-send-another",
  });
  assert.equal(store.values.has("referral"), true);

  clearRetryStableCommand({
    storage: store,
    storageKey: "referral",
    commandId,
  });
  assert.equal(store.values.has("referral"), false);
});

test("malformed optional storage is replaced and storage failure does not block the action", () => {
  const malformed = storage();
  malformed.setItem("referral", "not-json");
  assert.equal(resolveRetryStableCommand({
    storage: malformed,
    storageKey: "referral",
    fingerprint: "input",
    prefix: "ref-create-send",
    randomId: () => "replacement",
    now: () => 1_000,
  }), "ref-create-send-replacement");

  const unavailable = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  assert.equal(resolveRetryStableCommand({
    storage: unavailable,
    storageKey: "referral",
    fingerprint: "input",
    prefix: "ref-create-send",
    randomId: () => "memory-only",
    now: () => 1_000,
  }), "ref-create-send-memory-only");
  assert.doesNotThrow(() => clearRetryStableCommand({
    storage: unavailable,
    storageKey: "referral",
    commandId: "ref-create-send-memory-only",
  }));
});
