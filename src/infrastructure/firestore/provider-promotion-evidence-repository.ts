import { FieldValue, Timestamp, type DocumentData, type Firestore } from "firebase-admin/firestore";

import { providerPromotionFingerprint } from "../../application/provider-seeding/promotion-fingerprints.ts";
import type {
  ProviderCanonicalComparison,
  ProviderPromotionApproval,
  ProviderSeedPromotionCandidate,
} from "../../domain/provider-seeding/promotion.ts";
import type {
  ProviderPromotionEvidenceBundle,
  ProviderPromotionGeographyPreparation,
  ProviderPromotionSourceRecord,
} from "../../domain/provider-seeding/promotion-runtime.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";
import {
  providerPromotionDocumentPath,
  type ProviderPromotionFirestoreCollectionKey,
} from "./provider-promotion-schema.ts";

function normalizeValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === "object") {
    return Object.freeze(Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>)
        .map(([key, nested]) => [key, normalizeValue(nested)]),
    ));
  }
  return value;
}

function normalizeRecord<T extends object>(data: DocumentData): T {
  const normalized = normalizeValue(data) as Record<string, unknown>;
  const { schemaVersion: _schemaVersion, createdAt: _storageCreatedAt, ...record } = normalized;
  void _schemaVersion;
  void _storageCreatedAt;
  return Object.freeze(record) as T;
}

function immutablePayload(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  };
}

function assertSame(existing: DocumentData, expected: object, label: string): void {
  const normalized = normalizeRecord(existing);
  if (providerPromotionFingerprint(normalized) !== providerPromotionFingerprint(expected)) {
    throw new Error(`${label} conflicts with the immutable staged promotion evidence.`);
  }
}

async function readRecord<T extends object>(
  db: Firestore,
  key: ProviderPromotionFirestoreCollectionKey,
  id: string,
): Promise<T | null> {
  const snapshot = await db.doc(providerPromotionDocumentPath(key, id)).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data) return null;
  return normalizeRecord<T>(data);
}

export class FirestoreProviderPromotionEvidenceRepository {
  constructor(private readonly db: Firestore) {}

  getCandidate(id: string): Promise<ProviderSeedPromotionCandidate | null> {
    return readRecord<ProviderSeedPromotionCandidate>(this.db, "candidates", id);
  }

  getSource(id: string): Promise<ProviderPromotionSourceRecord | null> {
    return readRecord<ProviderPromotionSourceRecord>(this.db, "sourceRecords", id);
  }

  getGeography(id: string): Promise<ProviderPromotionGeographyPreparation | null> {
    return readRecord<ProviderPromotionGeographyPreparation>(
      this.db,
      "geographyPreparations",
      id,
    );
  }

  getComparison(id: string): Promise<ProviderCanonicalComparison | null> {
    return readRecord<ProviderCanonicalComparison>(this.db, "comparisons", id);
  }

  getApproval(id: string): Promise<ProviderPromotionApproval | null> {
    return readRecord<ProviderPromotionApproval>(this.db, "approvals", id);
  }

  async stage(input: ProviderPromotionEvidenceBundle): Promise<void> {
    if (
      input.source.id !== input.candidate.id
      || input.geography.id !== input.candidate.id
      || input.source.candidateId !== input.candidate.id
      || input.geography.candidateId !== input.candidate.id
      || input.comparison.candidateId !== input.candidate.id
      || input.approval.candidateId !== input.candidate.id
      || input.approval.comparisonId !== input.comparison.id
    ) {
      throw new Error("Provider promotion evidence bundle contains cross-bound records.");
    }
    const records = [
      ["candidates", input.candidate.id, input.candidate, "Provider promotion candidate"],
      ["sourceRecords", input.source.id, input.source, "Provider promotion source record"],
      ["geographyPreparations", input.geography.id, input.geography, "Provider geography preparation"],
      ["comparisons", input.comparison.id, input.comparison, "Provider canonical comparison"],
      ["approvals", input.approval.id, input.approval, "Provider promotion approval"],
    ] as const;

    await this.db.runTransaction(async (transaction) => {
      const refs = records.map(([key, id]) => this.db.doc(providerPromotionDocumentPath(key, id)));
      const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
      for (const [index, record] of records.entries()) {
        const [, , value, label] = record;
        const snapshot = snapshots[index];
        if (!snapshot) throw new Error(`Missing transaction snapshot for ${label}.`);
        if (snapshot.exists) {
          const data = snapshot.data();
          if (!data) throw new Error(`${label} exists without readable data.`);
          assertSame(data, value, label);
        } else {
          transaction.create(refs[index]!, immutablePayload(value));
        }
      }
    });
  }
}
