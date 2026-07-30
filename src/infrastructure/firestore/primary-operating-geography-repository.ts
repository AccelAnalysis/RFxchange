import type { Firestore } from "firebase-admin/firestore";

import {
  primaryOperatingGeographySelectionId,
  type PrimaryOperatingGeographySelection,
} from "../../domain/geography/model.ts";
import type { PrimaryOperatingGeographySelectionRepository } from "../../domain/geography/repository.ts";
import type { UserId } from "../../domain/users/model.ts";
import {
  getFirestoreRecordById,
  saveMutableFirestoreRecord,
} from "./support.ts";

/** Server-only INF-002 adapter for the user-scoped GEO-001 primary locality choice. */
export class FirestorePrimaryOperatingGeographySelectionRepository
  implements PrimaryOperatingGeographySelectionRepository
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  getByUserId(userId: UserId): Promise<PrimaryOperatingGeographySelection | null> {
    return getFirestoreRecordById<PrimaryOperatingGeographySelection>(
      this.db,
      "primaryOperatingGeographySelections",
      primaryOperatingGeographySelectionId(userId),
    );
  }

  save(selection: PrimaryOperatingGeographySelection): Promise<void> {
    return saveMutableFirestoreRecord(
      this.db,
      "primaryOperatingGeographySelections",
      selection.id,
      selection,
    );
  }
}
