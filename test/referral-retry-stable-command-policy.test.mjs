import assert from "node:assert/strict";
import test from "node:test";

import {
  markRetryStableCommandAttempted,
  resolveRetryStableCommand,
  retryStableCommandWasAttempted,
  shouldClearRetryStableCommandOnReviewBack,
} from "../src/components/referrals/retry-stable-command.ts";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
}

test("review Back retains an uncertain create-and-send command for replay", () => {
  assert.equal(shouldClearRetryStableCommandOnReviewBack({ submissionAttempted: true }), false);
});

test("review Back clears an unsubmitted or replaced command", () => {
  assert.equal(shouldClearRetryStableCommandOnReviewBack({ submissionAttempted: false }), true);
});

test("attempt metadata survives reload without adding reviewed business fields", () => {
  const storage = memoryStorage();
  const commandId = resolveRetryStableCommand({
    storage,
    storageKey: "actor-scoped-command",
    fingerprint: "opaque-fingerprint",
    prefix: "ref-create-send",
    randomId: () => "reload-recovery",
    now: () => 100,
  });
  markRetryStableCommandAttempted({
    storage,
    storageKey: "actor-scoped-command",
    commandId,
    now: () => 200,
  });

  const recoveredCommandId = resolveRetryStableCommand({
    storage,
    storageKey: "actor-scoped-command",
    fingerprint: "opaque-fingerprint",
    prefix: "ref-create-send",
    randomId: () => "must-not-replace",
    now: () => 300,
  });

  assert.equal(recoveredCommandId, commandId);
  assert.equal(retryStableCommandWasAttempted({
    storage,
    storageKey: "actor-scoped-command",
    commandId,
  }), true);
  assert.deepEqual(
    Object.keys(JSON.parse(storage.getItem("actor-scoped-command"))).sort(),
    ["attemptedAt", "commandId", "createdAt", "fingerprint", "version"],
  );
});
