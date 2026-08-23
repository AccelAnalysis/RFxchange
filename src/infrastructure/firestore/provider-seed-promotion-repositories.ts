import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";

import {
  assertSameImmutableGeographyVersion,
  type CanonicalGeography,
  type GeographyDatasetSource,
  type GeographyFabricCommand,
  type GeographyFabricEvent,
  type GeographyVersion,
  type LocationGeographyMembership,
  type LocationGeographyProfile,
} from "../../domain/geography-fabric/model.ts";
import type { LocationProfileMaterializationPacket } from "../../domain/geography-fabric/resolver.ts";
import type {
  OrganizationAccount,
  OrganizationProfile,
} from "../../domain/organizations/model.ts";
import type { OrganizationDiscoveryRecord } from "../../domain/organization-resolution/model.ts";
import type {
  ProviderCanonicalComparison,
  ProviderPromotionApproval,
  ProviderPromotionCommand,
} from "../../domain/provider-seeding/promotion.ts";
import type {
  ProviderSeedPromotionEvidenceRepository,
  ProviderSeedPromotionRepositories,
  ProviderSeedPromotionUnitOfWork,
} from "../../domain/provider-seeding/promotion-repository.ts";
import {
  deterministicProviderPromotionFingerprint,
  providerCanonicalComparisonFingerprint,
  providerCanonicalSearchFingerprint,
  providerGeographyProfileFingerprint,
  providerPromotionApprovalFingerprint,
  providerPromotionRequestFingerprint,
  providerSeedSourceRecordFingerprint,
  type ProviderCanonicalSearchSnapshot,
  type ProviderPromotionReceipt,
  type ProviderSeedDraft,
  type ProviderSeedPromotionEvidenceBundle,
  type ProviderSeedPromotionWriteSet,
  type ProviderSeedSourceRecord,
  type SourceBackedOrganizationLocation,
} from "../../domain/provider-seeding/promotion-runtime.ts";
import {
  geographyFabricDocumentPath,
  type GeographyFabricFirestoreCollectionKey,
} from "./geography-fabric-schema.ts";
import {
  FIRESTORE_SCHEMA_VERSION,
  firestoreDocumentPath,
  type FirestoreCollectionKey,
} from "./schema.ts";
import {
  assertProviderSeedPromotionOrganizationScope,
  providerSeedPromotionDocumentPath,
  type ProviderSeedPromotionFirestoreCollectionKey,
} from "./provider-seed-promotion-schema.ts";

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

function domainData(snapshot: DocumentSnapshot): Readonly<Record<string, unknown>> | null {
  if (!snapshot.exists) return null;
  const raw = snapshot.data();
  if (!raw) return null;
  const normalized = normalizeFirestoreValue(raw) as Record<string, unknown>;
  delete normalized.schemaVersion;
  delete normalized.persistedAt;
  if (normalized.id !== snapshot.id) {
    throw new Error(`Firestore document ${snapshot.ref.path} does not match canonical id identity.`);
  }
  return Object.freeze(normalized);
}

async function getPromotionRecord<T extends object>(
  db: Firestore,
  key: ProviderSeedPromotionFirestoreCollectionKey,
  id: string,
): Promise<T | null> {
  const snapshot = await db.doc(providerSeedPromotionDocumentPath(key, id)).get();
  const data = domainData(snapshot);
  return data as T | null;
}

function appendOnlyPayload(
  key: ProviderSeedPromotionFirestoreCollectionKey,
  record: object,
): DocumentData {
  const organizationId = (record as { readonly organizationId?: unknown }).organizationId;
  assertProviderSeedPromotionOrganizationScope(
    key,
    typeof organizationId === "string" ? organizationId : null,
  );
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    persistedAt: FieldValue.serverTimestamp(),
  };
}

function geographyAppendPayload(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  };
}

function geographyProfilePayload(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function organizationMutableCreatePayload(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function sameFingerprint(existing: DocumentSnapshot, expected: object, label: string): void {
  const data = domainData(existing);
  if (!data) throw new Error(`${label} exists without readable data.`);
  if (
    deterministicProviderPromotionFingerprint(data)
      !== deterministicProviderPromotionFingerprint(expected)
  ) {
    throw new Error(`${label} conflicts with persisted evidence.`);
  }
}

function sameFields(
  existing: DocumentSnapshot,
  expected: object,
  fields: readonly string[],
  label: string,
): void {
  const data = domainData(existing);
  if (!data) throw new Error(`${label} exists without readable data.`);
  const record = expected as Readonly<Record<string, unknown>>;
  for (const field of fields) {
    if (
      deterministicProviderPromotionFingerprint(data[field])
        !== deterministicProviderPromotionFingerprint(record[field])
    ) {
      throw new Error(`${label} conflicts on immutable field ${field}.`);
    }
  }
}

function createRecord(
  transaction: Transaction,
  ref: DocumentReference,
  payload: DocumentData,
): void {
  transaction.create(ref, payload);
}

function geographyFields(
  record: CanonicalGeography,
): readonly string[] {
  void record;
  return Object.freeze([
    "id",
    "type",
    "name",
    "countryCode",
    "stateCode",
    "externalId",
    "sourceSystem",
    "economicDevelopmentZone",
    "currentVersionId",
  ]);
}

function datasetFields(
  record: GeographyDatasetSource,
): readonly string[] {
  void record;
  return Object.freeze([
    "id",
    "sourceSystem",
    "name",
    "authority",
    "sourceUrl",
    "licenseOrUseBasis",
    "vintage",
    "effectiveFrom",
    "effectiveTo",
    "importedAt",
  ]);
}

const PROFILE_FIELDS = Object.freeze([
  "id",
  "locationId",
  "organizationId",
  "operatingGeographyId",
  "profileVersion",
  "acceptedPoint",
  "acceptedPointFingerprint",
  "visibility",
  "hierarchy",
  "overlays",
  "membershipIds",
  "resolver",
  "benchmark",
  "resolverVintage",
  "derivedFrom",
  "sourceLocationUpdatedAt",
  "resolvedAt",
]);

const MEMBERSHIP_FIELDS = Object.freeze([
  "id",
  "locationId",
  "organizationId",
  "profileVersion",
  "geographyId",
  "geographyVersionId",
  "geographyType",
  "role",
  "derivation",
  "confidence",
]);

const GEOGRAPHY_COMMAND_FIELDS = Object.freeze([
  "id",
  "action",
  "organizationId",
  "subjectId",
  "requestFingerprint",
  "actorUserId",
  "actorMembershipId",
  "recordedAt",
]);

const GEOGRAPHY_EVENT_FIELDS = Object.freeze([
  "id",
  "kind",
  "organizationId",
  "subjectId",
  "commandId",
  "occurredAt",
]);

function assertPromotionWriteSet(writeSet: ProviderSeedPromotionWriteSet): void {
  const { command, event, receipt, location, draft, evidence, geography } = writeSet;
  if (
    command.action !== "commit-approved-provider-promotion"
    || event.kind !== "provider-promotion-committed"
    || event.commandId !== command.id
    || receipt.status !== "committed"
    || receipt.commandId !== command.id
    || receipt.requestFingerprint !== command.requestFingerprint
  ) {
    throw new Error("Provider seed promotion unit of work requires one committed command graph.");
  }
  if (
    command.publishProviderDiscovery !== false
    || command.publishResource !== false
    || receipt.providerDiscoveryPublished !== false
    || receipt.resourcePublished !== false
    || receipt.officialResourceProviderGranted !== false
    || draft.providerDiscoveryStatus !== "not-published"
    || draft.resourcePublicationStatus !== "not-published"
    || draft.officialResourceProviderStatus !== "not-granted"
    || draft.participantAuthorUserId !== null
    || location.participantProjectionState !== "withheld"
  ) {
    throw new Error("Provider seed promotion write set attempted an unauthorized publication or participant fact.");
  }
  if (
    location.organizationId !== command.targetOrganizationId
    || draft.organizationId !== command.targetOrganizationId
    || draft.sourceBackedLocationId !== location.id
    || geography.profile.id !== command.geographyProfileId
    || geography.profile.locationId !== location.id
    || geography.profile.organizationId !== command.targetOrganizationId
    || evidence.candidate.id !== command.candidateId
  ) {
    throw new Error("Provider seed promotion write set is cross-bound.");
  }
  if (
    providerSeedSourceRecordFingerprint(evidence.sourceRecord)
      !== command.candidateRecordFingerprint
    || providerGeographyProfileFingerprint(geography)
      !== command.geographyProfileFingerprint
    || providerCanonicalSearchFingerprint(evidence.canonicalSearch)
      !== evidence.comparison.canonicalSearchFingerprint
    || providerCanonicalComparisonFingerprint(evidence.comparison)
      !== command.comparisonFingerprint
    || providerPromotionApprovalFingerprint(evidence.approval)
      !== command.approvalFingerprint
    || providerPromotionRequestFingerprint(command)
      !== command.requestFingerprint
  ) {
    throw new Error("Provider seed promotion write set contains stale evidence fingerprints.");
  }
}

function evidenceRefs(
  db: Firestore,
  command: ProviderPromotionCommand,
): Readonly<{
  source: DocumentReference;
  candidate: DocumentReference;
  geography: DocumentReference;
  search: DocumentReference;
  comparison: DocumentReference;
  approval: DocumentReference;
}> {
  return Object.freeze({
    source: db.doc(providerSeedPromotionDocumentPath("sourceRecords", command.candidateId)),
    candidate: db.doc(providerSeedPromotionDocumentPath("candidates", command.candidateId)),
    geography: db.doc(
      providerSeedPromotionDocumentPath("geographyPackets", command.geographyProfileId),
    ),
    search: db.doc(
      providerSeedPromotionDocumentPath("canonicalSearchSnapshots", command.comparisonId),
    ),
    comparison: db.doc(
      providerSeedPromotionDocumentPath("comparisons", command.comparisonId),
    ),
    approval: db.doc(
      providerSeedPromotionDocumentPath("approvals", command.approvalId),
    ),
  });
}

export class FirestoreProviderSeedPromotionEvidenceRepository
  implements ProviderSeedPromotionEvidenceRepository
{
  constructor(private readonly db: Firestore) {}

  async loadForCommand(
    command: ProviderPromotionCommand,
  ): Promise<ProviderSeedPromotionEvidenceBundle | null> {
    const [sourceRecord, candidate, geography, canonicalSearch, comparison, approval] =
      await Promise.all([
        getPromotionRecord<ProviderSeedSourceRecord>(
          this.db,
          "sourceRecords",
          command.candidateId,
        ),
        getPromotionRecord<ProviderSeedPromotionEvidenceBundle["candidate"]>(
          this.db,
          "candidates",
          command.candidateId,
        ),
        getPromotionRecord<LocationProfileMaterializationPacket>(
          this.db,
          "geographyPackets",
          command.geographyProfileId,
        ),
        getPromotionRecord<ProviderCanonicalSearchSnapshot>(
          this.db,
          "canonicalSearchSnapshots",
          command.comparisonId,
        ),
        getPromotionRecord<ProviderCanonicalComparison>(
          this.db,
          "comparisons",
          command.comparisonId,
        ),
        getPromotionRecord<ProviderPromotionApproval>(
          this.db,
          "approvals",
          command.approvalId,
        ),
      ]);
    if (
      !sourceRecord
      || !candidate
      || !geography
      || !canonicalSearch
      || !comparison
      || !approval
    ) {
      return null;
    }
    return Object.freeze({
      candidate,
      sourceRecord,
      geography,
      canonicalSearch,
      comparison,
      approval,
    });
  }
}

function checkCommandReplay(
  commandSnapshot: DocumentSnapshot,
  receiptSnapshot: DocumentSnapshot,
  writeSet: ProviderSeedPromotionWriteSet,
): boolean {
  if (!commandSnapshot.exists) return false;
  if (!receiptSnapshot.exists) {
    throw new Error("Committed provider promotion is missing its receipt.");
  }
  sameFields(
    commandSnapshot,
    writeSet.command,
    [
      "id",
      "action",
      "candidateId",
      "comparisonId",
      "approvalId",
      "targetOrganizationMode",
      "targetOrganizationId",
      "targetLocationId",
      "targetProviderResourceId",
      "geographyProfileId",
      "requestFingerprint",
      "actorAdministratorId",
      "authorityContextId",
    ],
    "Provider promotion command",
  );
  sameFingerprint(receiptSnapshot, writeSet.receipt, "Provider promotion receipt");
  return true;
}

function assertEvidenceSnapshots(
  snapshots: Readonly<{
    source: DocumentSnapshot;
    candidate: DocumentSnapshot;
    geography: DocumentSnapshot;
    search: DocumentSnapshot;
    comparison: DocumentSnapshot;
    approval: DocumentSnapshot;
  }>,
  evidence: ProviderSeedPromotionEvidenceBundle,
): void {
  sameFingerprint(snapshots.source, evidence.sourceRecord, "Provider seed source record");
  sameFingerprint(snapshots.candidate, evidence.candidate, "Provider seed candidate");
  sameFingerprint(snapshots.geography, evidence.geography, "Provider seed Geography packet");
  sameFingerprint(
    snapshots.search,
    evidence.canonicalSearch,
    "Provider canonical search snapshot",
  );
  sameFingerprint(
    snapshots.comparison,
    evidence.comparison,
    "Provider canonical comparison",
  );
  sameFingerprint(snapshots.approval, evidence.approval, "Provider promotion approval");
}

function assertExistingOrganization(
  snapshots: Readonly<{
    account: DocumentSnapshot;
    profile: DocumentSnapshot;
    discovery: DocumentSnapshot;
  }>,
  writeSet: ProviderSeedPromotionWriteSet,
): void {
  if (writeSet.organization.createRecords) {
    if (
      snapshots.account.exists
      || snapshots.profile.exists
      || snapshots.discovery.exists
    ) {
      throw new Error("Approved new Organization identity is no longer available.");
    }
    return;
  }
  sameFields(
    snapshots.account,
    writeSet.organization.account,
    ["id"],
    "Approved existing Organization account",
  );
  sameFields(
    snapshots.profile,
    writeSet.organization.profile,
    ["id", "organizationId", "displayName"],
    "Approved existing Organization profile",
  );
  sameFields(
    snapshots.discovery,
    writeSet.organization.discovery,
    ["id", "organizationId", "profileId", "displayName"],
    "Approved existing Organization discovery record",
  );
}

function createOrganizationRecords(
  transaction: Transaction,
  refs: Readonly<{
    account: DocumentReference;
    profile: DocumentReference;
    discovery: DocumentReference;
  }>,
  writeSet: ProviderSeedPromotionWriteSet,
): void {
  if (!writeSet.organization.createRecords) return;
  createRecord(
    transaction,
    refs.account,
    organizationMutableCreatePayload(writeSet.organization.account),
  );
  createRecord(
    transaction,
    refs.profile,
    organizationMutableCreatePayload(writeSet.organization.profile),
  );
  createRecord(
    transaction,
    refs.discovery,
    organizationMutableCreatePayload(writeSet.organization.discovery),
  );
}

function createOrVerifyGeographyRecord(
  transaction: Transaction,
  snapshot: DocumentSnapshot,
  ref: DocumentReference,
  key: GeographyFabricFirestoreCollectionKey,
  record:
    | GeographyDatasetSource
    | CanonicalGeography
    | GeographyVersion
    | LocationGeographyProfile
    | LocationGeographyMembership
    | GeographyFabricCommand
    | GeographyFabricEvent,
): void {
  if (!snapshot.exists) {
    createRecord(
      transaction,
      ref,
      key === "locationGeographyProfiles"
        ? geographyProfilePayload(record)
        : geographyAppendPayload(record),
    );
    return;
  }
  if (key === "geographyDatasetSources") {
    sameFields(snapshot, record, datasetFields(record as GeographyDatasetSource), "Geography dataset source");
    return;
  }
  if (key === "canonicalGeographies") {
    sameFields(snapshot, record, geographyFields(record as CanonicalGeography), "Canonical geography");
    return;
  }
  if (key === "geographyVersions") {
    const existing = domainData(snapshot) as unknown as GeographyVersion | null;
    if (!existing) throw new Error("Geography version exists without readable data.");
    assertSameImmutableGeographyVersion(existing, record as GeographyVersion);
    return;
  }
  if (key === "locationGeographyProfiles") {
    sameFields(snapshot, record, PROFILE_FIELDS, "Location Geography profile");
    return;
  }
  if (key === "locationGeographyMemberships") {
    sameFields(snapshot, record, MEMBERSHIP_FIELDS, "Location Geography membership");
    return;
  }
  if (key === "geographyFabricCommands") {
    sameFields(snapshot, record, GEOGRAPHY_COMMAND_FIELDS, "Geography Fabric command");
    return;
  }
  sameFields(snapshot, record, GEOGRAPHY_EVENT_FIELDS, "Geography Fabric event");
}

export class FirestoreProviderSeedPromotionUnitOfWork
  implements ProviderSeedPromotionUnitOfWork
{
  constructor(private readonly db: Firestore) {}

  async commit(writeSet: ProviderSeedPromotionWriteSet): Promise<ProviderPromotionReceipt> {
    assertPromotionWriteSet(writeSet);
    const commandRef = this.db.doc(
      providerSeedPromotionDocumentPath("commands", writeSet.command.id),
    );
    const eventRef = this.db.doc(
      providerSeedPromotionDocumentPath("events", writeSet.event.id),
    );
    const receiptRef = this.db.doc(
      providerSeedPromotionDocumentPath("receipts", writeSet.receipt.id),
    );
    const locationRef = this.db.doc(
      providerSeedPromotionDocumentPath("sourceBackedLocations", writeSet.location.id),
    );
    const draftRef = this.db.doc(
      providerSeedPromotionDocumentPath("seedDrafts", writeSet.draft.id),
    );
    const organizationRefs = Object.freeze({
      account: this.db.doc(
        firestoreDocumentPath("organizations", writeSet.organization.account.id),
      ),
      profile: this.db.doc(
        firestoreDocumentPath("organizationProfiles", writeSet.organization.profile.id),
      ),
      discovery: this.db.doc(
        firestoreDocumentPath(
          "organizationDiscoveryRecords",
          writeSet.organization.discovery.id,
        ),
      ),
    });
    const sourceRefs = evidenceRefs(this.db, writeSet.command);
    const geographyRecords = [
      ...writeSet.geography.datasetSources.map((record) => ({
        key: "geographyDatasetSources" as const,
        record,
        ref: this.db.doc(
          geographyFabricDocumentPath("geographyDatasetSources", record.id),
        ),
      })),
      ...writeSet.geography.geographies.map((record) => ({
        key: "canonicalGeographies" as const,
        record,
        ref: this.db.doc(
          geographyFabricDocumentPath("canonicalGeographies", record.id),
        ),
      })),
      ...writeSet.geography.versions.map((record) => ({
        key: "geographyVersions" as const,
        record,
        ref: this.db.doc(
          geographyFabricDocumentPath("geographyVersions", record.id),
        ),
      })),
      {
        key: "locationGeographyProfiles" as const,
        record: writeSet.geography.profile,
        ref: this.db.doc(
          geographyFabricDocumentPath(
            "locationGeographyProfiles",
            writeSet.geography.profile.id,
          ),
        ),
      },
      ...writeSet.geography.memberships.map((record) => ({
        key: "locationGeographyMemberships" as const,
        record,
        ref: this.db.doc(
          geographyFabricDocumentPath("locationGeographyMemberships", record.id),
        ),
      })),
      {
        key: "geographyFabricCommands" as const,
        record: writeSet.geography.command,
        ref: this.db.doc(
          geographyFabricDocumentPath(
            "geographyFabricCommands",
            writeSet.geography.command.id,
          ),
        ),
      },
      {
        key: "geographyFabricEvents" as const,
        record: writeSet.geography.event,
        ref: this.db.doc(
          geographyFabricDocumentPath(
            "geographyFabricEvents",
            writeSet.geography.event.id,
          ),
        ),
      },
    ];

    return this.db.runTransaction(async (transaction) => {
      const refs = [
        commandRef,
        receiptRef,
        eventRef,
        locationRef,
        draftRef,
        organizationRefs.account,
        organizationRefs.profile,
        organizationRefs.discovery,
        sourceRefs.source,
        sourceRefs.candidate,
        sourceRefs.geography,
        sourceRefs.search,
        sourceRefs.comparison,
        sourceRefs.approval,
        ...geographyRecords.map((entry) => entry.ref),
      ];
      const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
      const byPath = new Map(
        snapshots.map((snapshot) => [snapshot.ref.path, snapshot] as const),
      );
      const snapshotFor = (ref: DocumentReference): DocumentSnapshot => {
        const snapshot = byPath.get(ref.path);
        if (!snapshot) throw new Error(`Missing transaction snapshot for ${ref.path}.`);
        return snapshot;
      };

      if (
        checkCommandReplay(
          snapshotFor(commandRef),
          snapshotFor(receiptRef),
          writeSet,
        )
      ) {
        return writeSet.receipt;
      }
      if (
        snapshotFor(eventRef).exists
        || snapshotFor(locationRef).exists
        || snapshotFor(draftRef).exists
      ) {
        throw new Error("Provider promotion target records already exist without the command receipt.");
      }

      assertEvidenceSnapshots(
        {
          source: snapshotFor(sourceRefs.source),
          candidate: snapshotFor(sourceRefs.candidate),
          geography: snapshotFor(sourceRefs.geography),
          search: snapshotFor(sourceRefs.search),
          comparison: snapshotFor(sourceRefs.comparison),
          approval: snapshotFor(sourceRefs.approval),
        },
        writeSet.evidence,
      );
      assertExistingOrganization(
        {
          account: snapshotFor(organizationRefs.account),
          profile: snapshotFor(organizationRefs.profile),
          discovery: snapshotFor(organizationRefs.discovery),
        },
        writeSet,
      );
      for (const entry of geographyRecords) {
        createOrVerifyGeographyRecord(
          transaction,
          snapshotFor(entry.ref),
          entry.ref,
          entry.key,
          entry.record,
        );
      }

      createOrganizationRecords(transaction, organizationRefs, writeSet);
      createRecord(
        transaction,
        locationRef,
        appendOnlyPayload("sourceBackedLocations", writeSet.location),
      );
      createRecord(
        transaction,
        draftRef,
        appendOnlyPayload("seedDrafts", writeSet.draft),
      );
      createRecord(
        transaction,
        commandRef,
        appendOnlyPayload("commands", writeSet.command),
      );
      createRecord(
        transaction,
        eventRef,
        appendOnlyPayload("events", writeSet.event),
      );
      createRecord(
        transaction,
        receiptRef,
        appendOnlyPayload("receipts", writeSet.receipt),
      );
      return writeSet.receipt;
    });
  }
}

export function createFirestoreProviderSeedPromotionRepositories(
  db: Firestore,
): ProviderSeedPromotionRepositories {
  return Object.freeze({
    evidence: new FirestoreProviderSeedPromotionEvidenceRepository(db),
    unitOfWork: new FirestoreProviderSeedPromotionUnitOfWork(db),
  });
}
