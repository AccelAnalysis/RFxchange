import { onDocumentCreated } from "firebase-functions/v2/firestore";

import { getFunctionsFirestore } from "./runtime/firebase-admin.js";
import { RFXCHANGE_FUNCTIONS_REGION } from "./runtime/environment.js";

const OUTBOX_COLLECTION = "accelPoMarketingEventOutbox";
const SIGNAL_COLLECTION = "marketingLifecycleSignals";
const CONTRACT_VERSION = 1;
const EVENT_TYPES = new Set([
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
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/;

function requiredIdentifier(value: unknown): string {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) throw new Error("marketing-event-invalid");
  return value;
}

function optionalIdentifier(value: unknown): string | null {
  if (value == null) return null;
  return requiredIdentifier(value);
}

function timestamp(value: unknown): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) throw new Error("marketing-event-invalid");
  return new Date(value).toISOString();
}

function lifecycleFacts(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return Object.freeze({});
  const input = value as Record<string, unknown>;
  const output: Record<string, string | boolean> = {};

  if (input.purchasingMode !== undefined) {
    if (!["direct-provider", "source-first", "authorize-first"].includes(String(input.purchasingMode))) {
      throw new Error("marketing-event-invalid");
    }
    output.purchasingMode = String(input.purchasingMode);
  }
  for (const key of ["invitedTeamBand", "seatExpansionBand"] as const) {
    const entry = input[key];
    if (entry === undefined) continue;
    if (!["one", "2-5", "6-plus"].includes(String(entry))) throw new Error("marketing-event-invalid");
    output[key] = String(entry);
  }
  if (input.repeatUseBand !== undefined) {
    if (!["second", "3-5", "6-plus"].includes(String(input.repeatUseBand))) throw new Error("marketing-event-invalid");
    output.repeatUseBand = String(input.repeatUseBand);
  }
  if (input.communitySourcingEligible !== undefined) {
    if (typeof input.communitySourcingEligible !== "boolean") throw new Error("marketing-event-invalid");
    output.communitySourcingEligible = input.communitySourcingEligible;
  }
  return Object.freeze(output);
}

function safeSignal(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("marketing-event-invalid");
  const input = value as Record<string, unknown>;
  const eventType = String(input.eventType ?? "");
  if (!EVENT_TYPES.has(eventType)) throw new Error("marketing-event-invalid");
  if (input.contractVersion !== CONTRACT_VERSION || input.productSource !== "accelpo") {
    throw new Error("marketing-event-invalid");
  }
  const deduplicationKey = String(input.deduplicationKey ?? "");
  if (!/^accelpo:[a-f0-9]{64}$/.test(deduplicationKey)) throw new Error("marketing-event-invalid");
  return Object.freeze({
    contractVersion: CONTRACT_VERSION,
    eventType,
    organizationId: requiredIdentifier(input.organizationId),
    actorAccountId: optionalIdentifier(input.actorAccountId),
    purchaseCaseId: optionalIdentifier(input.purchaseCaseId),
    productSource: "accelpo" as const,
    occurredAt: timestamp(input.occurredAt),
    facts: lifecycleFacts(input.facts),
    sourceEventId: requiredIdentifier(input.sourceEventId),
    deduplicationKey,
  });
}

function safeErrorCode(error: unknown): string {
  if (error instanceof Error && error.message === "marketing-event-invalid") return "marketing-event-invalid";
  return "marketing-signal-delivery-failed";
}

/**
 * CP-09 delivery is intentionally one-way. The trigger copies only the allowlisted lifecycle signal
 * into Marketing's durable signal stream; a retry never re-runs the purchasing command or mutates
 * the Purchase Case that caused the event.
 */
export const deliverAccelPoMarketingLifecycleSignal = onDocumentCreated(
  {
    document: `${OUTBOX_COLLECTION}/{outboxId}`,
    region: RFXCHANGE_FUNCTIONS_REGION,
    retry: true,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot?.exists) return;
    const outboxId = event.params.outboxId;
    const signal = safeSignal(snapshot.get("signal"));
    const db = getFunctionsFirestore();
    const outboxRef = db.collection(OUTBOX_COLLECTION).doc(outboxId);
    const signalRef = db.collection(SIGNAL_COLLECTION).doc(outboxId);
    const deliveredAt = new Date().toISOString();

    try {
      await db.runTransaction(async (transaction) => {
        const [currentOutbox, currentSignal] = await Promise.all([
          transaction.get(outboxRef),
          transaction.get(signalRef),
        ]);
        if (!currentOutbox.exists) return;
        const outbox = currentOutbox.data() ?? {};
        if (outbox.status === "delivered") return;

        if (currentSignal.exists) {
          if (currentSignal.get("deduplicationKey") !== signal.deduplicationKey) {
            throw new Error("marketing-event-deduplication-conflict");
          }
        } else {
          transaction.create(signalRef, { ...signal, receivedAt: deliveredAt });
        }
        transaction.update(outboxRef, {
          status: "delivered",
          attemptCount: Number(outbox.attemptCount ?? 0) + 1,
          lastErrorCode: null,
          updatedAt: deliveredAt,
          deliveredAt,
        });
      });
    } catch (error) {
      const failedAt = new Date().toISOString();
      await db.runTransaction(async (transaction) => {
        const current = await transaction.get(outboxRef);
        if (!current.exists || current.get("status") === "delivered") return;
        transaction.update(outboxRef, {
          status: "retryable-failure",
          attemptCount: Number(current.get("attemptCount") ?? 0) + 1,
          lastErrorCode: safeErrorCode(error),
          updatedAt: failedAt,
          deliveredAt: null,
        });
      });
      throw error;
    }
  },
);
