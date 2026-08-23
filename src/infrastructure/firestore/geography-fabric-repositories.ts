import {
  FieldValue,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";

import type {
  CanonicalGeography,
  GeographicScope,
  GeographicScopeMember,
  GeographyDatasetSource,
  GeographyFabricCommand,
  GeographyFabricEvent,
  GeographyMetricSnapshot,
  GeographyVersion,
  LocationGeographyMembership,
  LocationGeographyProfile,
} from "../../domain/geography-fabric/model.ts";
import type {
  CanonicalGeographyRepository,
  GeographicScopeRepository,
  GeographyFabricCommandRepository,
  GeographyFabricRepositories,
  GeographyFabricUnitOfWork,
  GeographyMetricSnapshotRepository,
  LocationGeographyProfileRepository,
} from "../../domain/geography-fabric/repository.ts";
import {
  FIRESTORE_SCHEMA_VERSION,
  firestoreCollectionName,
  firestoreDocumentPath,
  type FirestoreCollectionKey,
} from "./schema.ts";
import {
  getFirestoreRecordById,
  listFirestoreRecords,
} from "./support.ts";

function appendOnlyPayload(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  };
}

function mutablePayload(record: object, existing: DocumentSnapshot): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: existing.data()?.createdAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function sameImmutableRecord(
  existing: DocumentSnapshot,
  expected: object,
  fields: readonly string[],
  label: string,
): void {
  const data = existing.data();
  if (!data) throw new Error(`${label} exists without readable data.`);
  for (const field of fields) {
    if (data[field] !== (expected as Readonly<Record<string, unknown>>)[field]) {
      throw new Error(`${label} conflicts with the existing immutable record.`);
    }
  }
}

function commandIsReplay(existing: DocumentSnapshot, command: GeographyFabricCommand): boolean {
  if (!existing.exists) return false;
  const data = existing.data();
  if (
    data?.action !== command.action
    || data?.subjectId !== command.subjectId
    || data?.requestFingerprint !== command.requestFingerprint
  ) {
    throw new Error("Geography Fabric command id is already bound to a different request.");
  }
  return true;
}

function requireNextRevision(
  existing: DocumentSnapshot,
  nextRevision: number,
  field: "profileVersion" | "revision",
  label: string,
): void {
  const current = existing.exists ? existing.data()?.[field] : 0;
  if (!Number.isSafeInteger(current) || nextRevision !== Number(current) + 1) {
    throw new Error(`${label} must advance exactly one revision from persisted state.`);
  }
}

function createRecord(
  transaction: Transaction,
  key: FirestoreCollectionKey,
  id: string,
  record: object,
): void {
  transaction.create(transaction.firestore.doc(firestoreDocumentPath(key, id)), appendOnlyPayload(record));
}

export class FirestoreCanonicalGeographyRepository implements CanonicalGeographyRepository {
  constructor(private readonly db: Firestore) {}

  getById(id: CanonicalGeography["id"]): Promise<CanonicalGeography | null> {
    return getFirestoreRecordById<CanonicalGeography>(this.db, "canonicalGeographies", id);
  }

  getVersionById(id: GeographyVersion["id"]): Promise<GeographyVersion | null> {
    return getFirestoreRecordById<GeographyVersion>(this.db, "geographyVersions", id);
  }

  getDatasetSourceById(id: GeographyDatasetSource["id"]): Promise<GeographyDatasetSource | null> {
    return getFirestoreRecordById<GeographyDatasetSource>(this.db, "geographyDatasetSources", id);
  }
}

export class FirestoreLocationGeographyProfileRepository
  implements LocationGeographyProfileRepository
{
  constructor(private readonly db: Firestore) {}

  getById(id: LocationGeographyProfile["id"]): Promise<LocationGeographyProfile | null> {
    return getFirestoreRecordById<LocationGeographyProfile>(
      this.db,
      "locationGeographyProfiles",
      id,
    );
  }
}

export class FirestoreGeographicScopeRepository implements GeographicScopeRepository {
  constructor(private readonly db: Firestore) {}

  getById(id: GeographicScope["id"]): Promise<GeographicScope | null> {
    return getFirestoreRecordById<GeographicScope>(this.db, "geographicScopes", id);
  }
}

export class FirestoreGeographyFabricCommandRepository
  implements GeographyFabricCommandRepository
{
  constructor(private readonly db: Firestore) {}

  getById(id: GeographyFabricCommand["id"]): Promise<GeographyFabricCommand | null> {
    return getFirestoreRecordById<GeographyFabricCommand>(this.db, "geographyFabricCommands", id);
  }
}

export class FirestoreGeographyMetricSnapshotRepository
  implements GeographyMetricSnapshotRepository
{
  constructor(private readonly db: Firestore) {}

  listByGeographyVersion(
    id: GeographyVersion["id"],
  ): Promise<readonly GeographyMetricSnapshot[]> {
    return listFirestoreRecords<GeographyMetricSnapshot>(
      this.db
        .collection(firestoreCollectionName("geographyMetricSnapshots"))
        .where("geographyVersionId", "==", id),
      "geographyMetricSnapshots",
    );
  }
}

export class FirestoreGeographyFabricUnitOfWork implements GeographyFabricUnitOfWork {
  constructor(private readonly db: Firestore) {}

  async materializeLocationProfile(input: Readonly<{
    datasetSources: readonly GeographyDatasetSource[];
    geographies: readonly CanonicalGeography[];
    versions: readonly GeographyVersion[];
    profile: LocationGeographyProfile;
    memberships: readonly LocationGeographyMembership[];
    command: GeographyFabricCommand;
    event: GeographyFabricEvent;
  }>): Promise<void> {
    await this.db.runTransaction(async (transaction) => {
      const commandRef = this.db.doc(firestoreDocumentPath("geographyFabricCommands", input.command.id));
      const profileRef = this.db.doc(firestoreDocumentPath("locationGeographyProfiles", input.profile.id));
      const datasetRefs = input.datasetSources.map((record) => this.db.doc(
        firestoreDocumentPath("geographyDatasetSources", record.id),
      ));
      const geographyRefs = input.geographies.map((record) => this.db.doc(
        firestoreDocumentPath("canonicalGeographies", record.id),
      ));
      const versionRefs = input.versions.map((record) => this.db.doc(
        firestoreDocumentPath("geographyVersions", record.id),
      ));

      const [commandSnapshot, profileSnapshot, datasetSnapshots, geographySnapshots, versionSnapshots] = await Promise.all([
        transaction.get(commandRef),
        transaction.get(profileRef),
        Promise.all(datasetRefs.map((ref) => transaction.get(ref))),
        Promise.all(geographyRefs.map((ref) => transaction.get(ref))),
        Promise.all(versionRefs.map((ref) => transaction.get(ref))),
      ]);
      if (commandIsReplay(commandSnapshot, input.command)) return;
      requireNextRevision(profileSnapshot, input.profile.profileVersion, "profileVersion", "Location geography profile");

      for (const [index, record] of input.datasetSources.entries()) {
        const snapshot = datasetSnapshots[index];
        if (!snapshot) throw new Error("Missing dataset-source transaction snapshot.");
        if (snapshot.exists) {
          sameImmutableRecord(snapshot, record, ["id", "sourceSystem", "authority", "vintage"], "Geography dataset source");
        } else {
          transaction.create(datasetRefs[index]!, appendOnlyPayload(record));
        }
      }
      for (const [index, record] of input.versions.entries()) {
        const snapshot = versionSnapshots[index];
        if (!snapshot) throw new Error("Missing geography-version transaction snapshot.");
        if (snapshot.exists) {
          sameImmutableRecord(snapshot, record, ["id", "geographyId", "datasetSourceId", "vintage"], "Geography version");
        } else {
          transaction.create(versionRefs[index]!, appendOnlyPayload(record));
        }
      }
      for (const [index, record] of input.geographies.entries()) {
        const snapshot = geographySnapshots[index];
        if (!snapshot) throw new Error("Missing canonical-geography transaction snapshot.");
        transaction.set(geographyRefs[index]!, mutablePayload(record, snapshot));
      }
      for (const membership of input.memberships) {
        createRecord(transaction, "locationGeographyMemberships", membership.id, membership);
      }
      transaction.set(profileRef, mutablePayload(input.profile, profileSnapshot));
      transaction.create(commandRef, appendOnlyPayload(input.command));
      createRecord(transaction, "geographyFabricEvents", input.event.id, input.event);
    });
  }

  async saveScope(input: Readonly<{
    scope: GeographicScope;
    members: readonly GeographicScopeMember[];
    command: GeographyFabricCommand;
    event: GeographyFabricEvent;
  }>): Promise<void> {
    await this.db.runTransaction(async (transaction) => {
      const commandRef = this.db.doc(firestoreDocumentPath("geographyFabricCommands", input.command.id));
      const scopeRef = this.db.doc(firestoreDocumentPath("geographicScopes", input.scope.id));
      const [commandSnapshot, scopeSnapshot] = await Promise.all([
        transaction.get(commandRef),
        transaction.get(scopeRef),
      ]);
      if (commandIsReplay(commandSnapshot, input.command)) return;
      requireNextRevision(scopeSnapshot, input.scope.revision, "revision", "Geographic scope");

      for (const member of input.members) {
        createRecord(transaction, "geographicScopeMembers", member.id, member);
      }
      transaction.set(scopeRef, mutablePayload(input.scope, scopeSnapshot));
      transaction.create(commandRef, appendOnlyPayload(input.command));
      createRecord(transaction, "geographyFabricEvents", input.event.id, input.event);
    });
  }

  async saveMetricSnapshot(input: Readonly<{
    snapshot: GeographyMetricSnapshot;
    command: GeographyFabricCommand;
    event: GeographyFabricEvent;
  }>): Promise<void> {
    await this.db.runTransaction(async (transaction) => {
      const commandRef = this.db.doc(firestoreDocumentPath("geographyFabricCommands", input.command.id));
      const commandSnapshot = await transaction.get(commandRef);
      if (commandIsReplay(commandSnapshot, input.command)) return;
      createRecord(transaction, "geographyMetricSnapshots", input.snapshot.id, input.snapshot);
      transaction.create(commandRef, appendOnlyPayload(input.command));
      createRecord(transaction, "geographyFabricEvents", input.event.id, input.event);
    });
  }
}

export function createFirestoreGeographyFabricRepositories(
  db: Firestore,
): GeographyFabricRepositories {
  return Object.freeze({
    catalog: new FirestoreCanonicalGeographyRepository(db),
    profiles: new FirestoreLocationGeographyProfileRepository(db),
    scopes: new FirestoreGeographicScopeRepository(db),
    commands: new FirestoreGeographyFabricCommandRepository(db),
    metrics: new FirestoreGeographyMetricSnapshotRepository(db),
    unitOfWork: new FirestoreGeographyFabricUnitOfWork(db),
  });
}
