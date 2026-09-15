import type { Firestore } from "firebase-admin/firestore";

import {
  ACCELPO_MARKETING_EVENT_OUTBOX_COLLECTION,
  createAccelPoMarketingOutboxRecord,
} from "../../application/accelpo/marketing-event";
import type {
  AccelPoMarketingEnqueueResult,
  AccelPoMarketingLifecycleEventInput,
  TrustedMarketingLifecycleContext,
} from "../../../apps/accelpo/src/marketing-event/contracts.ts";
import { getServerFirestore } from "../firestore/runtime";

export interface EnqueueCommittedMarketingLifecycleEventInput {
  readonly trusted: TrustedMarketingLifecycleContext;
  readonly event: AccelPoMarketingLifecycleEventInput | unknown;
  readonly committedAt?: string;
}

/**
 * Server-only adapter for committed lifecycle sources that do not run inside CP-03 (for example,
 * identity/bootstrap events). Domain code running inside CP-03 should use stageMarketingEventFromCommand
 * so the outbox insert commits atomically with the purchasing state change.
 */
export async function enqueueCommittedMarketingLifecycleEvent(
  input: EnqueueCommittedMarketingLifecycleEventInput,
  db: Firestore = getServerFirestore(),
): Promise<AccelPoMarketingEnqueueResult> {
  const record = createAccelPoMarketingOutboxRecord({
    trusted: input.trusted,
    event: input.event,
    ...(input.committedAt === undefined ? {} : { createdAt: input.committedAt }),
  });
  const ref = db.collection(ACCELPO_MARKETING_EVENT_OUTBOX_COLLECTION).doc(record.id);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists) {
      const existing = snapshot.data();
      const existingKey = existing?.signal?.deduplicationKey;
      if (existingKey !== record.signal.deduplicationKey) {
        throw new Error("marketing-event-deduplication-conflict");
      }
      return Object.freeze({
        outboxId: record.id,
        deduplicationKey: record.signal.deduplicationKey,
        duplicate: true as const,
      });
    }
    transaction.create(ref, record);
    return Object.freeze({
      outboxId: record.id,
      deduplicationKey: record.signal.deduplicationKey,
      duplicate: false as const,
    });
  });
}
