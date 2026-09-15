import { createHash } from "node:crypto";

import type {
  CommandHandlerContext,
  CommandTransaction,
  TrustedCommandActor,
} from "./command-port";
import {
  ACCELPO_MARKETING_PRODUCT_SOURCE,
  CP09_MARKETING_EVENT_PORT_VERSION,
  parseAccelPoMarketingLifecycleEventInput,
  parseTrustedMarketingLifecycleContext,
  type AccelPoMarketingEventOutboxRecord,
  type AccelPoMarketingLifecycleEventInput,
  type AccelPoMarketingLifecycleSignal,
  type TrustedMarketingLifecycleContext,
} from "../../../apps/accelpo/src/marketing-event/contracts.ts";

export const ACCELPO_MARKETING_EVENT_OUTBOX_COLLECTION = "accelPoMarketingEventOutbox" as const;
export const MARKETING_LIFECYCLE_SIGNALS_COLLECTION = "marketingLifecycleSignals" as const;

const DELIVERY_ERROR_PATTERN = /^[a-z0-9][a-z0-9._:-]{1,95}$/;

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function marketingLifecycleDeduplicationKey(input: Readonly<{
  organizationId: string;
  eventType: string;
  sourceEventId: string;
}>): string {
  return `accelpo:${digest(`${input.organizationId}\u0000${input.eventType}\u0000${input.sourceEventId}`)}`;
}

export function marketingOutboxRecordId(deduplicationKey: string): string {
  return `accelpo_mkt_${digest(deduplicationKey).slice(0, 48)}`;
}

export function createAccelPoMarketingLifecycleSignal(input: Readonly<{
  trusted: TrustedMarketingLifecycleContext;
  event: AccelPoMarketingLifecycleEventInput | unknown;
}>): AccelPoMarketingLifecycleSignal {
  const trusted = parseTrustedMarketingLifecycleContext(input.trusted);
  const event = parseAccelPoMarketingLifecycleEventInput(input.event);
  const deduplicationKey = marketingLifecycleDeduplicationKey({
    organizationId: trusted.organizationId,
    eventType: event.eventType,
    sourceEventId: event.sourceEventId,
  });
  return Object.freeze({
    contractVersion: CP09_MARKETING_EVENT_PORT_VERSION,
    eventType: event.eventType,
    organizationId: trusted.organizationId,
    actorAccountId: trusted.actorAccountId,
    purchaseCaseId: event.purchaseCaseId ?? null,
    productSource: ACCELPO_MARKETING_PRODUCT_SOURCE,
    occurredAt: event.occurredAt,
    facts: event.facts ?? Object.freeze({}),
    sourceEventId: event.sourceEventId,
    deduplicationKey,
  });
}

export function createAccelPoMarketingOutboxRecord(input: Readonly<{
  trusted: TrustedMarketingLifecycleContext;
  event: AccelPoMarketingLifecycleEventInput | unknown;
  createdAt?: string;
}>): AccelPoMarketingEventOutboxRecord {
  const signal = createAccelPoMarketingLifecycleSignal(input);
  const createdAt = new Date(input.createdAt ?? signal.occurredAt).toISOString();
  return Object.freeze({
    id: marketingOutboxRecordId(signal.deduplicationKey),
    signal,
    status: "pending" as const,
    attemptCount: 0,
    lastErrorCode: null,
    createdAt,
    updatedAt: createdAt,
    deliveredAt: null,
  });
}

export function stageAccelPoMarketingLifecycleEvent(
  transaction: CommandTransaction,
  actor: TrustedCommandActor,
  input: AccelPoMarketingLifecycleEventInput | unknown,
  now?: string,
): AccelPoMarketingEventOutboxRecord {
  const record = createAccelPoMarketingOutboxRecord({
    trusted: {
      organizationId: actor.organizationId,
      actorAccountId: actor.userId,
    },
    event: input,
    ...(now === undefined ? {} : { createdAt: now }),
  });
  transaction.create(
    `${ACCELPO_MARKETING_EVENT_OUTBOX_COLLECTION}/${record.id}`,
    record as unknown as Readonly<Record<string, unknown>>,
  );
  return record;
}

/** Convenience adapter for CP-03 handlers; actor/org are always taken from the trusted command context. */
export function stageMarketingEventFromCommand(
  context: Pick<CommandHandlerContext, "transaction" | "actor" | "now">,
  input: AccelPoMarketingLifecycleEventInput | unknown,
): AccelPoMarketingEventOutboxRecord {
  return stageAccelPoMarketingLifecycleEvent(
    context.transaction,
    context.actor,
    input,
    context.now,
  );
}

export function marketingDeliverySucceeded(
  record: AccelPoMarketingEventOutboxRecord,
  deliveredAt: string,
): AccelPoMarketingEventOutboxRecord {
  if (record.status === "delivered") return record;
  const timestamp = new Date(deliveredAt).toISOString();
  return Object.freeze({
    ...record,
    status: "delivered" as const,
    attemptCount: record.attemptCount + 1,
    lastErrorCode: null,
    updatedAt: timestamp,
    deliveredAt: timestamp,
  });
}

export function marketingDeliveryFailed(
  record: AccelPoMarketingEventOutboxRecord,
  errorCode: string,
  failedAt: string,
): AccelPoMarketingEventOutboxRecord {
  if (record.status === "delivered") return record;
  if (!DELIVERY_ERROR_PATTERN.test(errorCode)) {
    throw new Error("Marketing delivery error code is invalid.");
  }
  const timestamp = new Date(failedAt).toISOString();
  return Object.freeze({
    ...record,
    status: "retryable-failure" as const,
    attemptCount: record.attemptCount + 1,
    lastErrorCode: errorCode,
    updatedAt: timestamp,
    deliveredAt: null,
  });
}
