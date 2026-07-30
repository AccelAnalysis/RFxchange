import type { Firestore } from "firebase-admin/firestore";

import type { OrganizationId } from "../../domain/organizations/model";
import type { StoredAsset, StoredAssetId } from "../../domain/storage/model";
import type { StoredAssetRepository } from "../../domain/storage/repository";
import { firestoreCollectionName } from "../firestore/schema";
import {
  createMutableFirestoreRecord,
  getFirestoreRecordById,
  listFirestoreRecords,
  saveMutableFirestoreRecord,
} from "../firestore/support";

export class FirestoreStoredAssetRepository implements StoredAssetRepository {
  constructor(private readonly db: Firestore) {}

  getById(id: StoredAssetId): Promise<StoredAsset | null> {
    return getFirestoreRecordById<StoredAsset>(this.db, "storedAssets", id);
  }

  listByOrganizationId(organizationId: OrganizationId): Promise<readonly StoredAsset[]> {
    return listFirestoreRecords<StoredAsset>(
      this.db.collection(firestoreCollectionName("storedAssets")).where("organizationId", "==", organizationId),
      "storedAssets",
    );
  }

  create(asset: StoredAsset): Promise<void> {
    return createMutableFirestoreRecord(this.db, "storedAssets", asset.id, asset);
  }

  save(asset: StoredAsset): Promise<void> {
    return saveMutableFirestoreRecord(this.db, "storedAssets", asset.id, asset);
  }
}
