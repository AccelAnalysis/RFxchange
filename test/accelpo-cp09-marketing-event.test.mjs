import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCELPO_MARKETING_LIFECYCLE_EVENT_TYPES,
  parseAccelPoMarketingLifecycleEventInput,
} from "../apps/accelpo/src/marketing-event/contracts.ts";
import {
  CP09_MARKETING_EVENT_PART,
  CP09_MARKETING_EVENT_REGISTRATION,
} from "../apps/accelpo/src/marketing-event/part.ts";
import { createAccelPOPartRegistry } from "../apps/accelpo/src/chassis/registry.ts";
import {
  createAccelPoMarketingLifecycleSignal,
  createAccelPoMarketingOutboxRecord,
  marketingDeliveryFailed,
  marketingDeliverySucceeded,
  stageAccelPoMarketingLifecycleEvent,
} from "../src/application/accelpo/marketing-event.ts";

const baseEvent = {
  eventType: "purchase-request.first",
  sourceEventId: "purchase-event-001",
  purchaseCaseId: "case-001",
  occurredAt: "2026-09-14T18:00:00.000Z",
  facts: { purchasingMode: "source-first", communitySourcingEligible: true },
};

const actor = {
  userId: "user-001",
  membershipId: "membership-001",
  organizationId: "org-001",
};

test("CP-09 exposes every required lifecycle milestone", () => {
  assert.deepEqual([...ACCELPO_MARKETING_LIFECYCLE_EVENT_TYPES], [
    "account.created",
    "organization.configured",
    "team.invited",
    "purchasing-policy.configured",
    "purchase-request.first",
    "approval.first",
    "community-sourcing.first",
    "award.first",
    "purchase.completed.first",
    "purchase.repeat-use",
    "seat.expanded",
  ]);
});

test("CP-09 rejects private or free-form purchasing payloads", () => {
  assert.throws(
    () => parseAccelPoMarketingLifecycleEventInput({ ...baseEvent, budget: 1000 }),
    /unsupported field/,
  );
  assert.throws(
    () => parseAccelPoMarketingLifecycleEventInput({
      ...baseEvent,
      facts: { budget: 1000 },
    }),
    /unsupported field/,
  );
  assert.throws(
    () => parseAccelPoMarketingLifecycleEventInput({
      ...baseEvent,
      facts: { receiptUrl: "https://private.example/receipt" },
    }),
    /unsupported field/,
  );
  assert.throws(
    () => parseAccelPoMarketingLifecycleEventInput({
      eventType: "seat.expanded",
      sourceEventId: "seat-event-001",
      purchaseCaseId: "case-001",
      occurredAt: baseEvent.occurredAt,
    }),
    /not applicable/,
  );
});

test("organization and actor identity come from trusted context", () => {
  const signal = createAccelPoMarketingLifecycleSignal({
    trusted: { organizationId: actor.organizationId, actorAccountId: actor.userId },
    event: baseEvent,
  });
  assert.equal(signal.organizationId, actor.organizationId);
  assert.equal(signal.actorAccountId, actor.userId);
  assert.equal(signal.productSource, "accelpo");
  assert.equal(signal.purchaseCaseId, "case-001");
  assert.match(signal.deduplicationKey, /^accelpo:[a-f0-9]{64}$/);
  assert.equal("budget" in signal.facts, false);
});

test("replaying the same source event produces the same outbox identity", () => {
  const first = createAccelPoMarketingOutboxRecord({
    trusted: { organizationId: actor.organizationId, actorAccountId: actor.userId },
    event: baseEvent,
  });
  const replay = createAccelPoMarketingOutboxRecord({
    trusted: { organizationId: actor.organizationId, actorAccountId: actor.userId },
    event: { ...baseEvent },
  });
  assert.equal(first.id, replay.id);
  assert.equal(first.signal.deduplicationKey, replay.signal.deduplicationKey);
});

test("CP-03 staging writes only one deterministic server outbox path", () => {
  const writes = [];
  const transaction = {
    get: async () => ({ path: "unused", exists: false, data: null }),
    create: (path, data) => writes.push({ path, data }),
    set: () => assert.fail("set should not be used"),
    update: () => assert.fail("update should not be used"),
  };
  const record = stageAccelPoMarketingLifecycleEvent(
    transaction,
    actor,
    baseEvent,
    "2026-09-14T18:00:01.000Z",
  );
  assert.equal(writes.length, 1);
  assert.equal(writes[0].path, `accelPoMarketingEventOutbox/${record.id}`);
  assert.equal(writes[0].data.signal.organizationId, actor.organizationId);
  assert.equal(writes[0].data.signal.actorAccountId, actor.userId);
});

test("delivery retry state is isolated from the lifecycle signal", () => {
  const pending = createAccelPoMarketingOutboxRecord({
    trusted: { organizationId: actor.organizationId, actorAccountId: actor.userId },
    event: baseEvent,
  });
  const failed = marketingDeliveryFailed(
    pending,
    "marketing-sink-unavailable",
    "2026-09-14T18:01:00.000Z",
  );
  assert.equal(failed.status, "retryable-failure");
  assert.equal(failed.attemptCount, 1);
  assert.deepEqual(failed.signal, pending.signal);

  const delivered = marketingDeliverySucceeded(
    failed,
    "2026-09-14T18:02:00.000Z",
  );
  assert.equal(delivered.status, "delivered");
  assert.equal(delivered.attemptCount, 2);
  assert.equal(delivered.lastErrorCode, null);
  assert.deepEqual(delivered.signal, pending.signal);
});

test("CP-09 part declares no client route or standalone permission", () => {
  assert.deepEqual(CP09_MARKETING_EVENT_PART.routes, []);
  assert.deepEqual(CP09_MARKETING_EVENT_PART.permissions, []);
  assert.equal(CP09_MARKETING_EVENT_REGISTRATION.clientEndpoint, null);
  assert.equal(CP09_MARKETING_EVENT_REGISTRATION.outboxCollection, "accelPoMarketingEventOutbox");
  assert.equal(CP09_MARKETING_EVENT_REGISTRATION.marketingSignalCollection, "marketingLifecycleSignals");
  assert.deepEqual(
    createAccelPOPartRegistry().get(CP09_MARKETING_EVENT_PART.id),
    CP09_MARKETING_EVENT_PART,
  );
});

test("the Functions delivery projection stays synchronized with the CP-09 event contract", async () => {
  const source = await readFile(
    new URL("../functions/src/accelpo-marketing-event-functions.ts", import.meta.url),
    "utf8",
  );
  for (const eventType of ACCELPO_MARKETING_LIFECYCLE_EVENT_TYPES) {
    assert.match(source, new RegExp(`\\"${eventType.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\"`));
  }
  for (const privateField of [
    "budget",
    "receipt",
    "approvalNote",
    "privateFile",
    "competingOffer",
    "internalComment",
  ]) {
    assert.doesNotMatch(source, new RegExp(privateField, "i"));
  }
  assert.match(source, /retry: true/);
  assert.match(source, /transaction\.create\(signalRef/);
  assert.match(source, /status: "retryable-failure"/);
});
