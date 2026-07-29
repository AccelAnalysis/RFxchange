import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  type Query,
} from "firebase-admin/firestore";

import {
  FIRESTORE_COLLECTION_CONVENTIONS,
  FIRESTORE_SCHEMA_VERSION,
  assertOrganizationScopedFirestoreRecord,
  firestoreDocumentPath,
  type FirestoreCollectionKey,
} from "./schema";

interface DomainTimestampExposure {
  readonly createdAt: boolean;
  readonly updatedAt: boolean;
}

const DOMAIN_TIMESTAMP_EXPOSURE: Readonly<Record<FirestoreCollectionKey, DomainTimestampExposure>> =
  Object.freeze({
    organizations: Object.freeze({ createdAt: true, updatedAt: true }),
    organizationProfiles: Object.freeze({ createdAt: true, updatedAt: true }),
    users: Object.freeze({ createdAt: true, updatedAt: true }),
    organizationMemberships: Object.freeze({ createdAt: true, updatedAt: true }),
    organizationAuthorizations: Object.freeze({ createdAt: true, updatedAt: true }),
    organizationAuditEvents: Object.freeze({ createdAt: false, updatedAt: false }),
    accessJourneys: Object.freeze({ createdAt: true, updatedAt: true }),
    accessRestrictions: Object.freeze({ createdAt: true, updatedAt: true }),
    legalDocumentVersions: Object.freeze({ createdAt: true, updatedAt: false }),
    legalAcknowledgements: Object.freeze({ createdAt: false, updatedAt: false }),
    organizationAuthorityRepresentations: Object.freeze({ createdAt: false, updatedAt: false }),
    platformChangeDirectives: Object.freeze({ createdAt: true, updatedAt: false }),
    retentionPolicies: Object.freeze({ createdAt: true, updatedAt: false }),
    retentionAssignments: Object.freeze({ createdAt: false, updatedAt: false }),
    adminAuthorityContexts: Object.freeze({ createdAt: false, updatedAt: false }),
    adminPermissionGrants: Object.freeze({ createdAt: true, updatedAt: false }),
  });

function asDocumentData(record: object): DocumentData {
  return { ...record } as DocumentData;
}

function organizationIdFrom(record: object): string | null {
  const candidate = (record as { readonly organizationId?: unknown }).organizationId;
  return typeof candidate === "string" ? candidate : null;
}

function assertWriteContract(key: FirestoreCollectionKey, record: object): void {
  assertOrganizationScopedFirestoreRecord(key, organizationIdFrom(record));
}

function assertSchemaVersion(data: DocumentData, path: string): void {
  const version = data.schemaVersion;
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`Firestore document ${path} is missing a valid schemaVersion.`);
  }
  if (version > FIRESTORE_SCHEMA_VERSION) {
    throw new Error(
      `Firestore document ${path} uses unsupported future schemaVersion ${String(version)}.`,
    );
  }
}

function normalizeFirestoreValue(value: unknown): unknown {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeFirestoreValue);
  }

  if (value && typeof value === "object") {
    const normalized = Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, normalizeFirestoreValue(nested)]),
    );
    return normalized;
  }

  return value;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  return value;
}

function toDomainRecord<T extends object>(
  snapshot: DocumentSnapshot,
  key: FirestoreCollectionKey,
): T | null {
  if (!snapshot.exists) return null;

  const raw = snapshot.data();
  if (!raw) return null;

  assertSchemaVersion(raw, snapshot.ref.path);

  const normalized = normalizeFirestoreValue(raw) as Record<string, unknown>;
  delete normalized.schemaVersion;

  const exposure = DOMAIN_TIMESTAMP_EXPOSURE[key];
  if (!exposure.createdAt) delete normalized.createdAt;
  if (!exposure.updatedAt) delete normalized.updatedAt;

  const convention = FIRESTORE_COLLECTION_CONVENTIONS[key];
  const identityValue = normalized[convention.documentIdSource];
  if (typeof identityValue !== "string" || identityValue !== snapshot.id) {
    throw new Error(
      `Firestore document ${snapshot.ref.path} does not match canonical ${convention.documentIdSource} identity.`,
    );
  }

  assertOrganizationScopedFirestoreRecord(
    key,
    typeof normalized.organizationId === "string" ? normalized.organizationId : null,
  );

  return deepFreeze(normalized) as T;
}

function mutablePayload(record: object, createdAt: unknown): DocumentData {
  return {
    ...asDocumentData(record),
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export async function createMutableFirestoreRecord(
  db: Firestore,
  key: FirestoreCollectionKey,
  id: string,
  record: object,
): Promise<void> {
  const convention = FIRESTORE_COLLECTION_CONVENTIONS[key];
  if (!convention.mutable || convention.appendOnly) {
    throw new Error(`${convention.collection} is not a mutable-create collection.`);
  }

  assertWriteContract(key, record);
  const ref = db.doc(firestoreDocumentPath(key, id));
  await ref.create(mutablePayload(record, FieldValue.serverTimestamp()));
}

export async function saveMutableFirestoreRecord(
  db: Firestore,
  key: FirestoreCollectionKey,
  id: string,
  record: object,
): Promise<void> {
  const convention = FIRESTORE_COLLECTION_CONVENTIONS[key];
  if (!convention.mutable || convention.appendOnly) {
    throw new Error(`${convention.collection} is not mutable.`);
  }

  assertWriteContract(key, record);
  const ref = db.doc(firestoreDocumentPath(key, id));

  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    const existingCreatedAt = existing.exists ? existing.data()?.createdAt : undefined;
    transaction.set(
      ref,
      mutablePayload(record, existingCreatedAt ?? FieldValue.serverTimestamp()),
    );
  });
}

export async function appendFirestoreRecord(
  db: Firestore,
  key: FirestoreCollectionKey,
  id: string,
  record: object,
): Promise<void> {
  const convention = FIRESTORE_COLLECTION_CONVENTIONS[key];
  if (!convention.appendOnly || convention.mutable) {
    throw new Error(`${convention.collection} is not append-only.`);
  }

  assertWriteContract(key, record);
  const ref = db.doc(firestoreDocumentPath(key, id));
  await ref.create({
    ...asDocumentData(record),
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function getFirestoreRecordById<T extends object>(
  db: Firestore,
  key: FirestoreCollectionKey,
  id: string,
): Promise<T | null> {
  const snapshot = await db.doc(firestoreDocumentPath(key, id)).get();
  return toDomainRecord<T>(snapshot, key);
}

export async function listFirestoreRecords<T extends object>(
  query: Query,
  key: FirestoreCollectionKey,
): Promise<readonly T[]> {
  const snapshot = await query.get();
  return Object.freeze(
    snapshot.docs.map((document) => {
      const record = toDomainRecord<T>(document, key);
      if (!record) throw new Error(`Firestore query returned missing document ${document.ref.path}.`);
      return record;
    }),
  );
}

export async function getFirstFirestoreRecord<T extends object>(
  query: Query,
  key: FirestoreCollectionKey,
): Promise<T | null> {
  const records = await listFirestoreRecords<T>(query.limit(1), key);
  return records[0] ?? null;
}
