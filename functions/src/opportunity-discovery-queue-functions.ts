import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

import { RFXCHANGE_FUNCTIONS_REGION } from "./runtime/environment.js";
import { getFunctionsFirestore } from "./runtime/firebase-admin.js";

const EVALUATIONS = "opportunityDiscoveryEvaluations";

interface Projection {
  readonly reference: string;
  readonly aggregateVersion: number;
  readonly digest: string;
  readonly mode: string;
  readonly audience: string;
  readonly publishedAt: string | null;
}

function evaluationId(projection: Projection): string {
  return `oppeval_${createHash("sha256")
    .update(`${projection.reference}:${projection.aggregateVersion}:${projection.digest}`)
    .digest("hex")
    .slice(0, 40)}`;
}

function permitted(projection: Projection): boolean {
  return projection.mode === "published" &&
    Boolean(projection.publishedAt) &&
    (projection.audience === "public" || projection.audience === "authenticated-participants");
}

/**
 * DSC-006 durable handoff. The queue is created from the committed Firestore
 * projection rather than from request-process memory, so a crash after the
 * publication transaction cannot turn discovery evaluation into a log-only loss.
 */
export const queueOpportunityDiscoveryEvaluationOnPublication = onDocumentCreated(
  {
    document: "rfxOpportunityProjections/{reference}",
    region: RFXCHANGE_FUNCTIONS_REGION,
    retry: true,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot?.exists) return;
    const projection = snapshot.data() as Projection;
    if (!permitted(projection)) return;
    if (
      projection.reference !== snapshot.id ||
      !projection.publishedAt ||
      !Number.isFinite(Date.parse(projection.publishedAt))
    ) {
      throw new Error("Opportunity publication projection is invalid for durable evaluation.");
    }

    const db = getFunctionsFirestore();
    const id = evaluationId(projection);
    const ref = db.collection(EVALUATIONS).doc(id);
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      if (current.exists) {
        const data = current.data() as {
          reference?: string;
          projectionVersion?: number;
          projectionDigest?: string;
        };
        if (
          data.reference !== projection.reference ||
          data.projectionVersion !== projection.aggregateVersion ||
          data.projectionDigest !== projection.digest
        ) {
          throw new Error("Opportunity discovery evaluation identity collision.");
        }
        return;
      }
      transaction.create(ref, {
        schemaVersion: 1,
        id,
        reference: projection.reference,
        projectionVersion: projection.aggregateVersion,
        projectionDigest: projection.digest,
        projection,
        evaluationAt: new Date(Date.parse(projection.publishedAt)).toISOString(),
        status: "queued",
        attemptCount: 0,
        claimId: null,
        leaseUntil: null,
        nextAttemptAt: null,
        savedSearchCursorId: null,
        lastErrorCode: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        completedAt: null,
      });
    });
  },
);
