import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  type Query,
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
  GEOGRAPHY_FABRIC_FIRESTORE_COLLECTION_CONVENTIONS,
  assertGeographyFabricOrganizationScope,
  geographyFabricCollectionName,
  geographyFabricDocumentPath,
  type GeographyFabricFirestoreCollectionKey,
} from "./geography-fabric-schema.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";

interface DomainTimestampExposure {
  readonly createdAt: boolean;
  readonly updatedAt: boolean;
}

const DOMAIN_TIMESTAMP_EXPOSURE: Readonly<
  Record<GeographyFabricFirestoreCollectionKey, DomainTimestampExposure>
> = Object.freeze({
  canonicalGeographies: Object.freeze({ createdAt: true, updatedAt: true }),
  geographyVersions: Object.freeze({ createdAt: true, updatedAt: false }),
  geographyDatasetSources: Object.freeze({ createdAt: false, updatedAt: false }),
  locationGeographyProfiles: Object.freeze({ createdAt: false, updatedAt: true }),
  locationGeographyMemberships: Object.freeze({ createdAt: true, updatedAt: false }),
  geographicScopes: Object.freeze({ createdAt: true, updatedAt: true }),
  geographicScopeMembers: Object.freeze({ createdAt: true, updatedAt: false }),
  geographyFabricCommands: Object.freeze({ createdAt: false, updatedAt: false }),
  geographyFabricEvents: Object.freeze({ createdAt: false, updatedAt: false }),
  geographyMetricSnapshots: Object.freeze({ createdAt: false, updatedAt: false }),
});

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
  key: GeographyFabricFirestoreCollectionKey,
): T | null {
  if (!snapshot.exists) return null;
  const raw = snapshot.data();
  if (!raw) return null;
  const schemaVersion = raw.schemaVersion;
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new Error(`Firestore document ${snapshot.ref.path} is missing a valid schemaVersion.`);
  }
  if (Number(schemaVersion) > FIRESTORE_SCHEMA_VERSION) {
    throw new Error(
      `Firestore document ${snapshot.ref.path} uses unsupported future schemaVersion ${String(schemaVersion)}.`,
    );
  }

  const normalized = normalizeFirestoreValue(raw) as Record<string, unknown>;
  delete normalized.schemaVersion;
  const exposure = DOMAIN_TIMESTAMP_EXPOSURE[key];
  if (!exposure.createdAt) delete normalized.createdAt;
  if (!exposure.updatedAt) delete normalized.updatedAt;
  if (normalized.id !== snapshot.id) {
    throw new Error(`Firestore document ${snapshot.ref.path} does not match canonical id identity.`);
  }
  assertGeographyFabricOrganizationScope(
    key,
    typeof normalized.organizationId === "string" ? normalized.organizationId : null,
  );
  return deepFreeze(normalized) as T;
}

async function getRecordById<T extends object>(
  db: Firestore,
  key: GeographyFabricFirestoreCollectionKey,
  id: string,
): Promise<T | null> {
  const snapshot = await db.doc(geographyFabricDocumentPath(key, id)).get();
  return toDomainRecord<T>(snapshot, key);
}

async function listRecords<T extends object>(
  query: Query,
  key: GeographyFabricFirestoreCollectionKey,
): Promise<readonly T[]> {
  const snapshot = await query.get();
  return Object.freeze(
    snapshot.docs.map((document) => {
      const record = toDomainRecord<T>(document, key);
      if (!record) {
        throw new Error(`Firestore query returned missing document ${document.ref.path}.`);
      }
      return record;
    }),
  );
}

function assertWriteContract(
  key: GeographyFabricFirestoreCollectionKey,
  record: object,
): void {
  const organizationId = (record as { readonly organizationId?: unknown }).organizationId;
  assertGeographyFabricOrganizationScope(
    key,
    typeof organizationId === "string" ? organizationId : null,
  );
}

function appendOnlyPayload(
  key: GeographyFabricFirestoreCollectionKey,
  record: object,
): DocumentData {
  const convention = GEOGRAPHY_FABRIC_FIRESTORE_COLLECTION_CONVENTIONS[key];
  if (!convention.appendOnly || convention.mutable) {
    throw new Error(`${convention.collection} is not append-only.`);
  }
  assertWriteContract(key, record);
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  };
}

function mutablePayload(
  key: GeographyFabricFirestoreCollectionKey,
  record: object,
  existing: DocumentSnapshot,
): DocumentData {
  const convention = GEOGRAPHY_FABRIC_FIRESTORE_COLLECTION_CONVENTIONS[key];
  if (!convention.mutable || convention.appendOnly) {
    throw new Error(`${convention.collection} is not mutable.`);
  }
  assertWriteContract(key, record);
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

function commandIsReplay(
  existing: DocumentSnapshot,
  command: GeographyFabricCommand,
): boolean {
  if (!existing.exists) return false;
  const data = existing.data();
  if (
    data?.action !== command.action
    || data?.organizationId !== command.organizationId
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

function appendRecord(
  db: Firestore,
  transaction: Transaction,
  key: GeographyFabricFirestoreCollectionKey,
  id: string,
  record: object,
): void {
  transaction.create(
    db.doc(geographyFabricDocumentPath(key, id)),
    appendOnlyPayload(key, record),
  );
}

function assertCommandAndEvent(
  command: GeographyFabricCommand,
  event: GeographyFabricEvent,
  action: GeographyFabricCommand["action"],
  eventKind: GeographyFabricEvent["kind"],
  subjectId: string,
  organizationId: string | null,
): void {
  if (command.action !== action || event.kind !== eventKind) {
    throw new Error("Geography Fabric unit of work received the wrong command or event kind.");
  }
  if (
    command.subjectId !== subjectId
    || event.subjectId !== subjectId
    || event.commandId !== command.id
  ) {
    throw new Error("Geography Fabric command, event and aggregate subject must match.");
  }
  if (
    command.organizationId !== organizationId
    || event.organizationId !== organizationId
  ) {
    throw new Error("Geography Fabric command and event organization context must match.");
  }
}

function assertMaterializationInput(input: Readonly<{
  datasetSources: readonly GeographyDatasetSource[];
  geographies: readonly CanonicalGeography[];
  versions: readonly GeographyVersion[];
  profile: LocationGeographyProfile;
  memberships: readonly LocationGeographyMembership[];
  command: GeographyFabricCommand;
  event: GeographyFabricEvent;
}>): void {
  assertCommandAndEvent(
    input.command,
    input.event,
    "materialize-location-profile",
    "location-profile-materialized",
    input.profile.id,
    input.profile.organizationId,
  );
  const membershipIds = new Set(input.memberships.map((membership) => membership.id));
  if (
    membershipIds.size !== input.profile.membershipIds.length
    || input.profile.membershipIds.some((id) => !membershipIds.has(id))
  ) {
    throw new Error("Materialization memberships must match the profile membership projection.");
  }
  const geographyIds = new Set(input.geographies.map((geography) => geography.id));
  const versionIds = new Set(input.versions.map((version) => version.id));
  const sourceIds = new Set(input.datasetSources.map((source) => source.id));
  for (const version of input.versions) {
    if (!geographyIds.has(version.geographyId) || !sourceIds.has(version.datasetSourceId)) {
      throw new Error("Every geography version must link to supplied geography and dataset source records.");
    }
  }
  for (const geography of input.geographies) {
    if (!versionIds.has(geography.currentVersionId)) {
      throw new Error("Every canonical geography must identify a supplied current version.");
    }
  }
  for (const membership of input.memberships) {
    if (
      membership.locationId !== input.profile.locationId
      || membership.organizationId !== input.profile.organizationId
      || membership.profileVersion !== input.profile.profileVersion
      || !geographyIds.has(membership.geographyId)
      || !versionIds.has(membership.geographyVersionId)
    ) {
      throw new Error("Materialized membership is outside the supplied location profile graph.");
    }
  }
}

function assertScopeInput(input: Readonly<{
  scope: GeographicScope;
  members: readonly GeographicScopeMember[];
  command: GeographyFabricCommand;
  event: GeographyFabricEvent;
}>): void {
  assertCommandAndEvent(
    input.command,
    input.event,
    "save-geographic-scope",
    "geographic-scope-saved",
    input.scope.id,
    input.scope.organizationId,
  );
  const expectedMemberCount =
    input.scope.inclusionVersionIds.length + input.scope.exclusionVersionIds.length;
  if (input.members.length !== expectedMemberCount) {
    throw new Error("Geographic scope members must materialize all include and exclude versions.");
  }
  const seen = new Set<string>();
  for (const member of input.members) {
    const key = `${member.inclusion}:${member.geographyVersionId}`;
    if (
      seen.has(key)
      || member.scopeId !== input.scope.id
      || member.scopeRevision !== input.scope.revision
      || member.organizationId !== input.scope.organizationId
    ) {
      throw new Error("Geographic scope member does not match its scope identity and revision.");
    }
    const expectedIds = member.inclusion === "include"
      ? input.scope.inclusionVersionIds
      : input.scope.exclusionVersionIds;
    if (!expectedIds.includes(member.geographyVersionId)) {
      throw new Error("Geographic scope member is not declared by its scope.");
    }
    seen.add(key);
  }
}

export class FirestoreCanonicalGeographyRepository
  implements CanonicalGeographyRepository
{
  constructor(private readonly db: Firestore) {}

  getById(id: CanonicalGeography["id"]): Promise<CanonicalGeography | null> {
    return getRecordById<CanonicalGeography>(this.db, "canonicalGeographies", id);
  }

  getVersionById(id: GeographyVersion["id"]): Promise<GeographyVersion | null> {
    return getRecordById<GeographyVersion>(this.db, "geographyVersions", id);
  }

  getDatasetSourceById(
    id: GeographyDatasetSource["id"],
  ): Promise<GeographyDatasetSource | null> {
    return getRecordById<GeographyDatasetSource>(
      this.db,
      "geographyDatasetSources",
      id,
    );
  }
}

export class FirestoreLocationGeographyProfileRepository
  implements LocationGeographyProfileRepository
{
  constructor(private readonly db: Firestore) {}

  getById(
    id: LocationGeographyProfile["id"],
  ): Promise<LocationGeographyProfile | null> {
    return getRecordById<LocationGeographyProfile>(
      this.db,
      "locationGeographyProfiles",
      id,
    );
  }
}

export class FirestoreGeographicScopeRepository
  implements GeographicScopeRepository
{
  constructor(private readonly db: Firestore) {}

  getById(id: GeographicScope["id"]): Promise<GeographicScope | null> {
    return getRecordById<GeographicScope>(this.db, "geographicScopes", id);
  }
}

export class FirestoreGeographyFabricCommandRepository
  implements GeographyFabricCommandRepository
{
  constructor(private readonly db: Firestore) {}

  getById(id: GeographyFabricCommand["id"]): Promise<GeographyFabricCommand | null> {
    return getRecordById<GeographyFabricCommand>(
      this.db,
      "geographyFabricCommands",
      id,
    );
  }
}

export class FirestoreGeographyMetricSnapshotRepository
  implements GeographyMetricSnapshotRepository
{
  constructor(private readonly db: Firestore) {}

  listByGeographyVersion(
    id: GeographyVersion["id"],
  ): Promise<readonly GeographyMetricSnapshot[]> {
    return listRecords<GeographyMetricSnapshot>(
      this.db
        .collection(geographyFabricCollectionName("geographyMetricSnapshots"))
        .where("geographyVersionId", "==", id),
      "geographyMetricSnapshots",
    );
  }
}

export class FirestoreGeographyFabricUnitOfWork
  implements GeographyFabricUnitOfWork
{
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
    assertMaterializationInput(input);
    await this.db.runTransaction(async (transaction) => {
      const commandRef = this.db.doc(
        geographyFabricDocumentPath("geographyFabricCommands", input.command.id),
      );
      const profileRef = this.db.doc(
        geographyFabricDocumentPath("locationGeographyProfiles", input.profile.id),
      );
      const datasetRefs = input.datasetSources.map((record) =>
        this.db.doc(geographyFabricDocumentPath("geographyDatasetSources", record.id)),
      );
      const geographyRefs = input.geographies.map((record) =>
        this.db.doc(geographyFabricDocumentPath("canonicalGeographies", record.id)),
      );
      const versionRefs = input.versions.map((record) =>
        this.db.doc(geographyFabricDocumentPath("geographyVersions", record.id)),
      );

      const [
        commandSnapshot,
        profileSnapshot,
        datasetSnapshots,
        geographySnapshots,
        versionSnapshots,
      ] = await Promise.all([
        transaction.get(commandRef),
        transaction.get(profileRef),
        Promise.all(datasetRefs.map((ref) => transaction.get(ref))),
        Promise.all(geographyRefs.map((ref) => transaction.get(ref))),
        Promise.all(versionRefs.map((ref) => transaction.get(ref))),
      ]);
      if (commandIsReplay(commandSnapshot, input.command)) return;
      requireNextRevision(
        profileSnapshot,
        input.profile.profileVersion,
        "profileVersion",
        "Location geography profile",
      );

      for (const [index, record] of input.datasetSources.entries()) {
        const snapshot = datasetSnapshots[index];
        const ref = datasetRefs[index];
        if (!snapshot || !ref) throw new Error("Missing dataset-source transaction state.");
        if (snapshot.exists) {
          sameImmutableRecord(
            snapshot,
            record,
            ["id", "sourceSystem", "authority", "vintage"],
            "Geography dataset source",
          );
        } else {
          transaction.create(
            ref,
            appendOnlyPayload("geographyDatasetSources", record),
          );
        }
      }
      for (const [index, record] of input.versions.entries()) {
        const snapshot = versionSnapshots[index];
        const ref = versionRefs[index];
        if (!snapshot || !ref) throw new Error("Missing geography-version transaction state.");
        if (snapshot.exists) {
          sameImmutableRecord(
            snapshot,
            record,
            ["id", "geographyId", "datasetSourceId", "vintage"],
            "Geography version",
          );
        } else {
          transaction.create(ref, appendOnlyPayload("geographyVersions", record));
        }
      }
      for (const [index, record] of input.geographies.entries()) {
        const snapshot = geographySnapshots[index];
        const ref = geographyRefs[index];
        if (!snapshot || !ref) throw new Error("Missing canonical-geography transaction state.");
        if (
          snapshot.exists
          && (
            snapshot.data()?.type !== record.type
            || snapshot.data()?.externalId !== record.externalId
            || snapshot.data()?.sourceSystem !== record.sourceSystem
          )
        ) {
          throw new Error("Canonical geography logical identity conflicts with persisted state.");
        }
        transaction.set(
          ref,
          mutablePayload("canonicalGeographies", record, snapshot),
        );
      }
      for (const membership of input.memberships) {
        appendRecord(
          this.db,
          transaction,
          "locationGeographyMemberships",
          membership.id,
          membership,
        );
      }
      transaction.set(
        profileRef,
        mutablePayload("locationGeographyProfiles", input.profile, profileSnapshot),
      );
      transaction.create(
        commandRef,
        appendOnlyPayload("geographyFabricCommands", input.command),
      );
      appendRecord(
        this.db,
        transaction,
        "geographyFabricEvents",
        input.event.id,
        input.event,
      );
    });
  }

  async saveScope(input: Readonly<{
    scope: GeographicScope;
    members: readonly GeographicScopeMember[];
    command: GeographyFabricCommand;
    event: GeographyFabricEvent;
  }>): Promise<void> {
    assertScopeInput(input);
    await this.db.runTransaction(async (transaction) => {
      const commandRef = this.db.doc(
        geographyFabricDocumentPath("geographyFabricCommands", input.command.id),
      );
      const scopeRef = this.db.doc(
        geographyFabricDocumentPath("geographicScopes", input.scope.id),
      );
      const [commandSnapshot, scopeSnapshot] = await Promise.all([
        transaction.get(commandRef),
        transaction.get(scopeRef),
      ]);
      if (commandIsReplay(commandSnapshot, input.command)) return;
      requireNextRevision(
        scopeSnapshot,
        input.scope.revision,
        "revision",
        "Geographic scope",
      );

      for (const member of input.members) {
        appendRecord(
          this.db,
          transaction,
          "geographicScopeMembers",
          member.id,
          member,
        );
      }
      transaction.set(
        scopeRef,
        mutablePayload("geographicScopes", input.scope, scopeSnapshot),
      );
      transaction.create(
        commandRef,
        appendOnlyPayload("geographyFabricCommands", input.command),
      );
      appendRecord(
        this.db,
        transaction,
        "geographyFabricEvents",
        input.event.id,
        input.event,
      );
    });
  }

  async saveMetricSnapshot(input: Readonly<{
    snapshot: GeographyMetricSnapshot;
    command: GeographyFabricCommand;
    event: GeographyFabricEvent;
  }>): Promise<void> {
    assertCommandAndEvent(
      input.command,
      input.event,
      "capture-metric-snapshot",
      "metric-snapshot-captured",
      input.snapshot.id,
      null,
    );
    await this.db.runTransaction(async (transaction) => {
      const commandRef = this.db.doc(
        geographyFabricDocumentPath("geographyFabricCommands", input.command.id),
      );
      const commandSnapshot = await transaction.get(commandRef);
      if (commandIsReplay(commandSnapshot, input.command)) return;
      appendRecord(
        this.db,
        transaction,
        "geographyMetricSnapshots",
        input.snapshot.id,
        input.snapshot,
      );
      transaction.create(
        commandRef,
        appendOnlyPayload("geographyFabricCommands", input.command),
      );
      appendRecord(
        this.db,
        transaction,
        "geographyFabricEvents",
        input.event.id,
        input.event,
      );
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
