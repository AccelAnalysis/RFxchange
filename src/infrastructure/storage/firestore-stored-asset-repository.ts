import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
} from "firebase-admin/firestore";

import type { OrganizationId } from "../../domain/organizations/model";
import type { StoredAsset, StoredAssetId } from "../../domain/storage/model";
import type { StoredAssetRepository } from "../../domain/storage/repository";

export const STORED_ASSET_COLLECTION = "storedAssets" as const;
export const STORED_ASSET_SCHEMA_VERSION = 1 as const;

function normalizeFirestoreValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalizeFirestoreValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, normalizeFirestoreValue(nested)]),
    );
  }
  return value;
}

function toStoredAsset(snapshot: DocumentSnapshot): StoredAsset | null {
  if (!snapshot.exists) return null;
  const raw = snapshot.data();
  if (!raw) return null;
  if (raw.schemaVersion !== STORED_ASSET_SCHEMA_VERSION) {
    throw new Error(`Stored asset ${snapshot.ref.path} has an unsupported schema version.`);
  }
  const normalized = normalizeFirestoreValue(raw) as Record<string, unknown>;
  delete normalized.schemaVersion;
  if (normalized.id !== snapshot.id) throw new Error("Stored asset metadata identity does not match its document path.");
  if (typeof normalized.organizationId !== "string" || !normalized.organizationId.trim()) {
    throw new Error("Stored asset metadata requires organizationId.");
  }
  return Object.freeze(normalized) as unknown as StoredAsset;
}

function payload(asset: StoredAsset, createdAt: unknown): DocumentData {
  return {
    ...asset,
    schemaVersion: STORED_ASSET_SCHEMA_VERSION,
    createdAt,
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export class FirestoreStoredAssetRepository implements StoredAssetRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getById(id: StoredAssetId): Promise<StoredAsset | null> {
    return toStoredAsset(await this.db.collection(STORED_ASSET_COLLECTION).doc(id).get());
  }

  async listByOrganizationId(organizationId: OrganizationId): Promise<readonly StoredAsset[]> {
    const snapshot = await this.db
      .collection(STORED_ASSET_COLLECTION)
      .where("organizationId", "==", organizationId)
      .get();
    return Object.freeze(
      snapshot.docs.map((document) => {
        const asset = toStoredAsset(document);
        if (!asset) throw new Error(`Stored asset query returned missing document ${document.ref.path}.`);
        return asset;
      }),
    );
  }

  async create(asset: StoredAsset): Promise<void> {
    await this.db
      .collection(STORED_ASSET_COLLECTION)
      .doc(asset.id)
      .create(payload(asset, FieldValue.serverTimestamp()));
  }

  async save(asset: StoredAsset): Promise<void> {
    const ref = this.db.collection(STORED_ASSET_COLLECTION).doc(asset.id);
    await this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      if (!existing.exists) throw new Error("Stored asset metadata does not exist.");
      transaction.set(ref, payload(asset, existing.data()?.createdAt ?? FieldValue.serverTimestamp()));
    });
  }
}
