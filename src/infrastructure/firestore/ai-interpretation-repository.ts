import { FieldValue, type DocumentData, type Firestore, type Transaction } from "firebase-admin/firestore";

import type { AiInterpretationRepository, InterpretationQuotaPort } from "../../domain/ai-interpretation/repository.ts";
import type { AiInterpretationCandidateEnvelope, AiInterpretationRecordEnvelope, InterpretationAuthorityScope, InterpretationQuotaPolicy } from "../../domain/ai-interpretation/model.ts";
import { FIRESTORE_SCHEMA_VERSION, firestoreDocumentPath } from "./schema.ts";
import { getFirestoreRecordById } from "./support.ts";

function mutable(record: object, createdAt: unknown = FieldValue.serverTimestamp()): DocumentData {
  return { ...record, schemaVersion: FIRESTORE_SCHEMA_VERSION, createdAt, updatedAt: FieldValue.serverTimestamp() };
}

function immutable(record: object): DocumentData {
  return { ...record, schemaVersion: FIRESTORE_SCHEMA_VERSION, createdAt: FieldValue.serverTimestamp() };
}

function requireScope(record: Readonly<{ organizationId: string }>, scope: InterpretationAuthorityScope): void {
  if (record.organizationId !== scope.organizationId) throw new Error("Interpretation tenant isolation failed.");
}

function deriveStatus(dispositions: readonly string[], noneOfThese = false): AiInterpretationRecordEnvelope["record"]["record_status"] {
  if (noneOfThese) return "closed";
  const confirmed = dispositions.filter((value) => value === "accepted" || value === "edited").length;
  const pending = dispositions.filter((value) => value === "suggested" || value === "unresolved").length;
  if (confirmed > 0 && pending === 0) return "confirmed";
  if (confirmed > 0) return "partially_confirmed";
  if (pending === 0) return "closed";
  return "awaiting_confirmation";
}

export class FirestoreAiInterpretationRepository implements AiInterpretationRepository, InterpretationQuotaPort {
  private readonly db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  getRecord(id: string) { return getFirestoreRecordById<AiInterpretationRecordEnvelope>(this.db, "aiInterpretationRecords", id); }
  getCandidate(id: string) { return getFirestoreRecordById<AiInterpretationCandidateEnvelope>(this.db, "aiInterpretationCandidates", id); }

  async saveCompleted(input: Parameters<AiInterpretationRepository["saveCompleted"]>[0]): Promise<void> {
    const entries = [
      { path: firestoreDocumentPath("aiInterpretationRecords", input.record.id), data: mutable(input.record) },
      ...input.candidates.map((candidate) => ({ path: firestoreDocumentPath("aiInterpretationCandidates", candidate.id), data: mutable(candidate) })),
      { path: firestoreDocumentPath("aiInterpretationProvenance", input.provenance.id), data: immutable(input.provenance) },
      { path: firestoreDocumentPath("aiInterpretationUsageEvents", input.usage.id), data: immutable(input.usage) },
    ];
    await this.db.runTransaction(async (transaction) => {
      const refs = entries.map((entry) => this.db.doc(entry.path));
      const existing = await transaction.getAll(...refs);
      if (existing.some((snapshot) => snapshot.exists)) throw new Error("Interpretation persistence identifier collision.");
      entries.forEach((entry, index) => transaction.set(refs[index]!, entry.data));
    });
  }

  async saveFailureEvidence(input: Parameters<AiInterpretationRepository["saveFailureEvidence"]>[0]): Promise<void> {
    const batch = this.db.batch();
    batch.create(this.db.doc(firestoreDocumentPath("aiInterpretationProvenance", input.provenance.id)), immutable(input.provenance));
    batch.create(this.db.doc(firestoreDocumentPath("aiInterpretationUsageEvents", input.usage.id)), immutable(input.usage));
    await batch.commit();
  }

  async applyCandidateDisposition(input: Parameters<AiInterpretationRepository["applyCandidateDisposition"]>[0]): Promise<AiInterpretationRecordEnvelope> {
    const candidateRef = this.db.doc(firestoreDocumentPath("aiInterpretationCandidates", input.candidate.id));
    const recordRef = this.db.doc(firestoreDocumentPath("aiInterpretationRecords", input.candidate.interpretationRecordId));
    const eventRef = this.db.doc(firestoreDocumentPath("aiInterpretationEvents", input.event.id));
    await this.db.runTransaction(async (transaction) => {
      const [candidateSnapshot, recordSnapshot, eventSnapshot] = await transaction.getAll(candidateRef, recordRef, eventRef);
      if (!candidateSnapshot.exists || !recordSnapshot.exists) throw new Error("Interpretation disposition target no longer exists.");
      if (eventSnapshot.exists) throw new Error("Interpretation disposition event already exists.");
      const currentCandidate = candidateSnapshot.data() as unknown as AiInterpretationCandidateEnvelope;
      const currentRecord = recordSnapshot.data() as unknown as AiInterpretationRecordEnvelope;
      requireScope(currentCandidate, input.scope); requireScope(currentRecord, input.scope);
      const rawUpdatedAt = currentCandidate.updatedAt as unknown;
      const currentUpdatedAt = rawUpdatedAt !== null && typeof rawUpdatedAt === "object" && "toDate" in rawUpdatedAt
        ? (rawUpdatedAt as { toDate(): Date }).toDate().toISOString()
        : String(rawUpdatedAt);
      if (currentUpdatedAt !== input.expectedUpdatedAt) throw new Error("Interpretation candidate changed; refresh before deciding.");
      const candidateValue = input.editedTextValue ? Object.freeze({ text_value: input.editedTextValue }) : currentCandidate.candidate.candidate_value;
      const nextCandidate = { ...currentCandidate, candidate: { ...currentCandidate.candidate, candidate_value: candidateValue, disposition: input.disposition, disposition_by_user_id: input.scope.userId, disposition_at: input.now, authoritative_effect: "none" as const }, updatedAt: input.now };
      const refs = currentRecord.record.candidate_ids.map((id) => this.db.doc(firestoreDocumentPath("aiInterpretationCandidates", id)));
      const snapshots = refs.length ? await transaction.getAll(...refs) : [];
      const dispositions = snapshots.map((snapshot) => snapshot.id === input.candidate.id ? input.disposition : String((snapshot.data() as unknown as AiInterpretationCandidateEnvelope).candidate.disposition));
      const nextRecord = { ...currentRecord, record: { ...currentRecord.record, record_status: deriveStatus(dispositions), updated_at: input.now }, updatedAt: input.now };
      transaction.set(candidateRef, mutable(nextCandidate, candidateSnapshot.data()?.createdAt));
      transaction.set(recordRef, mutable(nextRecord, recordSnapshot.data()?.createdAt));
      transaction.create(eventRef, immutable(input.event));
    });
    const result = await this.getRecord(input.candidate.interpretationRecordId);
    if (!result) throw new Error("Updated interpretation record was unavailable.");
    return result;
  }

  async applyNoneOfThese(input: Parameters<AiInterpretationRepository["applyNoneOfThese"]>[0]): Promise<AiInterpretationRecordEnvelope> {
    const recordRef = this.db.doc(firestoreDocumentPath("aiInterpretationRecords", input.recordId));
    const eventRef = this.db.doc(firestoreDocumentPath("aiInterpretationEvents", input.event.id));
    await this.db.runTransaction(async (transaction: Transaction) => {
      const [recordSnapshot, eventSnapshot] = await transaction.getAll(recordRef, eventRef);
      if (!recordSnapshot.exists) throw new Error("Interpretation record no longer exists.");
      if (eventSnapshot.exists) throw new Error("Interpretation disposition event already exists.");
      const record = recordSnapshot.data() as unknown as AiInterpretationRecordEnvelope;
      requireScope(record, input.scope);
      const candidateRefs = record.record.candidate_ids.map((id) => this.db.doc(firestoreDocumentPath("aiInterpretationCandidates", id)));
      const candidates = candidateRefs.length ? await transaction.getAll(...candidateRefs) : [];
      candidates.forEach((snapshot) => {
        if (!snapshot.exists) throw new Error("Interpretation candidate is missing.");
        const candidate = snapshot.data() as unknown as AiInterpretationCandidateEnvelope;
        requireScope(candidate, input.scope);
        if (candidate.candidate.disposition === "suggested" || candidate.candidate.disposition === "unresolved") {
          transaction.set(snapshot.ref, mutable({ ...candidate, candidate: { ...candidate.candidate, disposition: "rejected", disposition_by_user_id: input.scope.userId, disposition_at: input.now, authoritative_effect: "none" }, updatedAt: input.now }, snapshot.data()?.createdAt));
        }
      });
      transaction.set(recordRef, mutable({ ...record, record: { ...record.record, record_status: deriveStatus([], true), updated_at: input.now }, updatedAt: input.now }, recordSnapshot.data()?.createdAt));
      transaction.create(eventRef, immutable(input.event));
    });
    const result = await this.getRecord(input.recordId);
    if (!result) throw new Error("Updated interpretation record was unavailable.");
    return result;
  }

  async reserve(input: Readonly<{ scope: InterpretationAuthorityScope; policy: InterpretationQuotaPolicy; estimatedInputTokens: number; now: string }>) {
    const day = input.now.slice(0, 10);
    const dimensions = [
      { kind: "user", id: input.scope.userId, maxRequests: input.policy.maxRequestsPerUserPerDay, maxTokens: input.policy.maxInputTokensPerUserPerDay },
      { kind: "organization", id: input.scope.organizationId, maxRequests: input.policy.maxRequestsPerOrganizationPerDay, maxTokens: input.policy.maxInputTokensPerOrganizationPerDay },
      { kind: "tenant", id: input.scope.tenantId, maxRequests: input.policy.maxRequestsPerTenantPerDay, maxTokens: input.policy.maxInputTokensPerTenantPerDay },
    ] as const;
    const reservationId = `quota_${day}_${input.scope.userId}_${input.scope.organizationId}`.replace(/[^A-Za-z0-9_.-]/g, "_");
    await this.db.runTransaction(async (transaction) => {
      const entries = dimensions.map((dimension) => ({ dimension, bucketId: `${day}:${dimension.kind}:${dimension.id}`.replace(/[^A-Za-z0-9_.:-]/g, "_"), ref: this.db.doc(firestoreDocumentPath("aiInterpretationQuotaBuckets", `${day}:${dimension.kind}:${dimension.id}`.replace(/[^A-Za-z0-9_.:-]/g, "_"))) }));
      const snapshots = await transaction.getAll(...entries.map((entry) => entry.ref));
      snapshots.forEach((snapshot, index) => {
        const entry = entries[index]!;
        const current = snapshot.data() ?? {};
        const requests = Number(current.requests ?? 0) + 1;
        const inputTokens = Number(current.inputTokens ?? 0) + input.estimatedInputTokens;
        if (requests > entry.dimension.maxRequests || inputTokens > entry.dimension.maxTokens) throw new Error(`Daily ${entry.dimension.kind} AI interpretation quota is exhausted.`);
        transaction.set(entry.ref, mutable({ id: entry.bucketId, scopeKind: entry.dimension.kind, scopeId: entry.dimension.id, organizationId: input.scope.organizationId, day, requests, inputTokens, policyVersion: input.policy.version }, current.createdAt ?? FieldValue.serverTimestamp()));
      });
    });
    return Object.freeze({ id: reservationId, policyVersion: input.policy.version, day, estimatedInputTokens: input.estimatedInputTokens });
  }
}
