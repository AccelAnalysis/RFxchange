import type { Firestore } from "firebase-admin/firestore";

import type {
  GeographyDefinition,
  GeographyId,
  GeographyParticipationAuthorization,
  PrimaryOperatingGeographySelection,
} from "../../domain/geography/model.ts";
import type {
  GeographyDefinitionRepository,
  GeographyParticipationAuthorizationRepository,
  GeographyRepositories,
  PrimaryGeographySelectionUnitOfWork,
  PrimaryOperatingGeographySelectionRepository,
} from "../../domain/geography/repository.ts";
import type { AccessLifecycleRecord } from "../../domain/lifecycle/model.ts";
import type { UserId } from "../../domain/users/model.ts";
import { firestoreCollectionName } from "./schema.ts";
import {
  getFirestoreRecordById,
  listFirestoreRecords,
  saveMutableFirestoreRecord,
  saveMutableFirestoreRecordsAtomically,
} from "./support.ts";

export class FirestoreGeographyDefinitionRepository implements GeographyDefinitionRepository {
  constructor(private readonly db: Firestore) {}

  getById(id: GeographyId): Promise<GeographyDefinition | null> {
    return getFirestoreRecordById<GeographyDefinition>(this.db, "geographies", id);
  }

  save(definition: GeographyDefinition): Promise<void> {
    return saveMutableFirestoreRecord(this.db, "geographies", definition.id, definition);
  }
}

export class FirestorePrimaryOperatingGeographySelectionRepository
  implements PrimaryOperatingGeographySelectionRepository
{
  constructor(private readonly db: Firestore) {}

  getByUserId(userId: UserId): Promise<PrimaryOperatingGeographySelection | null> {
    return getFirestoreRecordById<PrimaryOperatingGeographySelection>(
      this.db,
      "primaryGeographySelections",
      userId,
    );
  }
}

export class FirestoreGeographyParticipationAuthorizationRepository
  implements GeographyParticipationAuthorizationRepository
{
  constructor(private readonly db: Firestore) {}

  listByUserAndGeography(
    userId: UserId,
    geographyId: GeographyId,
  ): Promise<readonly GeographyParticipationAuthorization[]> {
    return listFirestoreRecords<GeographyParticipationAuthorization>(
      this.db
        .collection(firestoreCollectionName("geographyParticipationAuthorizations"))
        .where("subject.kind", "==", "user")
        .where("subject.userId", "==", userId)
        .where("geographyId", "==", geographyId),
      "geographyParticipationAuthorizations",
    );
  }

  save(authorization: GeographyParticipationAuthorization): Promise<void> {
    return saveMutableFirestoreRecord(
      this.db,
      "geographyParticipationAuthorizations",
      authorization.id,
      authorization,
    );
  }
}

export class FirestorePrimaryGeographySelectionUnitOfWork
  implements PrimaryGeographySelectionUnitOfWork
{
  constructor(private readonly db: Firestore) {}

  commit(
    selection: PrimaryOperatingGeographySelection,
    lifecycle: AccessLifecycleRecord,
  ): Promise<void> {
    return saveMutableFirestoreRecordsAtomically(this.db, [
      Object.freeze({
        key: "primaryGeographySelections" as const,
        id: selection.userId,
        record: selection,
      }),
      Object.freeze({
        key: "accessJourneys" as const,
        id: lifecycle.id,
        record: lifecycle,
      }),
    ]);
  }
}

export function createFirestoreGeographyRepositories(db: Firestore): GeographyRepositories {
  return Object.freeze({
    definitions: new FirestoreGeographyDefinitionRepository(db),
    selections: new FirestorePrimaryOperatingGeographySelectionRepository(db),
    authorizations: new FirestoreGeographyParticipationAuthorizationRepository(db),
    selectionUnitOfWork: new FirestorePrimaryGeographySelectionUnitOfWork(db),
  });
}
