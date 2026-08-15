import { createHash } from "node:crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { ResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

export const OPPORTUNITY_DISCOVERY_EVALUATIONS_COLLECTION =
  "opportunityDiscoveryEvaluations" as const;

interface OpportunityDiscoveryEvaluationQueueRecord {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly reference: string;
  readonly projectionVersion: number;
  readonly projectionDigest: string;
  readonly projection: ResponderOpportunityProjection;
  readonly evaluationAt: string;
  readonly status: "queued" | "completed";
  readonly attemptCount: number;
  readonly lastErrorCode: string | null;
  readonly createdAt: unknown;
  readonly updatedAt: unknown;
  readonly completedAt: unknown | null;
}

function evaluationId(projection: ResponderOpportunityProjection): string {
  return `oppeval_${createHash("sha256")
    .update(`${projection.reference}:${projection.aggregateVersion}:${projection.digest}`)
    .digest("hex")
    .slice(0, 40)}`;
}

function errorCode(error: unknown): string {
  const value = error instanceof Error ? error.name : "unknown";
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 96) || "unknown";
}

function evaluationTimestamp(projection: ResponderOpportunityProjection): string {
  if (projection.publishedAt) return new Date(projection.publishedAt).toISOString();
  return new Date().toISOString();
}

export async function queueOpportunityDiscoveryEvaluation(
  projection: ResponderOpportunityProjection,
  error: unknown = null,
  db: Firestore = getServerFirestore(),
): Promise<string> {
  const id = evaluationId(projection);
  const evaluationAt = evaluationTimestamp(projection);
  const ref = db.collection(OPPORTUNITY_DISCOVERY_EVALUATIONS_COLLECTION).doc(id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists) {
      const current = snapshot.data() as OpportunityDiscoveryEvaluationQueueRecord & {
        evaluationAt?: string;
      };
      if (
        current.reference !== projection.reference ||
        current.projectionVersion !== projection.aggregateVersion ||
        current.projectionDigest !== projection.digest
      ) {
        throw new Error("Opportunity discovery evaluation identity collision.");
      }
      if (current.status === "completed") return;
      transaction.set(ref, {
        ...current,
        projection,
        evaluationAt: current.evaluationAt ?? evaluationAt,
        lastErrorCode: error ? errorCode(error) : current.lastErrorCode,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }
    transaction.create(ref, {
      schemaVersion: 1,
      id,
      reference: projection.reference,
      projectionVersion: projection.aggregateVersion,
      projectionDigest: projection.digest,
      projection,
      evaluationAt,
      status: "queued",
      attemptCount: 0,
      lastErrorCode: error ? errorCode(error) : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      completedAt: null,
    });
  });
  return id;
}

export async function completeOpportunityDiscoveryEvaluation(
  projection: ResponderOpportunityProjection,
  db: Firestore = getServerFirestore(),
): Promise<void> {
  const ref = db
    .collection(OPPORTUNITY_DISCOVERY_EVALUATIONS_COLLECTION)
    .doc(evaluationId(projection));
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    const current = snapshot.data() as OpportunityDiscoveryEvaluationQueueRecord;
    if (
      current.reference !== projection.reference ||
      current.projectionVersion !== projection.aggregateVersion ||
      current.projectionDigest !== projection.digest
    ) {
      throw new Error("Opportunity discovery evaluation identity collision.");
    }
    transaction.set(ref, {
      ...current,
      status: "completed",
      lastErrorCode: null,
      updatedAt: FieldValue.serverTimestamp(),
      completedAt: FieldValue.serverTimestamp(),
    });
  });
}
