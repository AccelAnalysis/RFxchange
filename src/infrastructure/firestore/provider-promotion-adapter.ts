import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  type QueryDocumentSnapshot,
  type Transaction,
} from "firebase-admin/firestore";

import { evaluateProviderPromotion } from "../../application/provider-seeding/provider-promotion-evaluation.ts";
import { matchOrganizations } from "../../domain/organization-resolution/matching.ts";
import type {
  OrganizationDiscoveryRecord,
  OrganizationIdentityInput,
} from "../../domain/organization-resolution/model.ts";
import type {
  OrganizationAccount,
  OrganizationProfile,
} from "../../domain/organizations/model.ts";
import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import type {
  ProviderCanonicalComparison,
  ProviderPromotionApproval,
  ProviderPromotionCommand,
  ProviderSeedPromotionCandidate,
} from "../../domain/provider-seeding/promotion.ts";
import type {
  ProviderPromotionEvidenceBundle,
  ProviderPromotionGeographyPreparation,
  ProviderPromotionPreview,
  ProviderPromotionReceipt,
  ProviderPromotionSourceRecord,
} from "../../domain/provider-seeding/promotion-runtime.ts";
import {
  FIRESTORE_SCHEMA_VERSION,
  firestoreCollectionName,
  firestoreDocumentPath,
} from "./schema.ts";
import { providerPromotionDocumentPath } from "./provider-promotion-schema.ts";

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

function promotionRecord<T extends object>(snapshot: DocumentSnapshot): T | null {
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data) return null;
  const normalized = normalizeValue(data) as Record<string, unknown>;
  const {
    schemaVersion: _schemaVersion,
    storageCreatedAt: _storageCreatedAt,
    ...record
  } = normalized;
  void _schemaVersion;
  void _storageCreatedAt;
  return Object.freeze(record) as T;
}

function canonicalRecord<T extends object>(snapshot: DocumentSnapshot): T | null {
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data) return null;
  const normalized = normalizeValue(data) as Record<string, unknown>;
  delete normalized.schemaVersion;
  return Object.freeze(normalized) as T;
}

function discoveryRecord(snapshot: QueryDocumentSnapshot): OrganizationDiscoveryRecord {
  const data = normalizeValue(snapshot.data()) as Record<string, unknown>;
  delete data.schemaVersion;
  return Object.freeze(data) as unknown as OrganizationDiscoveryRecord;
}

function immutablePromotionPayload(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    storageCreatedAt: FieldValue.serverTimestamp(),
  };
}

function immutableCanonicalPayload(record: object): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: FieldValue.serverTimestamp(),
  };
}

function mutableCanonicalPayload(
  record: object,
  existing?: DocumentSnapshot | null,
): DocumentData {
  return {
    ...record,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAt: existing?.data()?.createdAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function sameFields(
  existing: DocumentSnapshot,
  expected: Readonly<Record<string, unknown>>,
  fields: readonly string[],
  label: string,
): void {
  const data = existing.data();
  if (!data) throw new Error(`${label} exists without readable data.`);
  for (const field of fields) {
    if (String(data[field] ?? "") !== String(expected[field] ?? "")) {
      throw new Error(`${label} conflicts with an existing immutable record.`);
    }
  }
}

function sourceIdentity(evidence: ProviderPromotionEvidenceBundle): OrganizationIdentityInput {
  const source = evidence.source;
  const domain = source.website
    ? new URL(source.website).hostname.replace(/^www\./, "")
    : undefined;
  return Object.freeze({
    displayName: source.displayName,
    aliases: source.aliases,
    categories: Object.freeze([
      evidence.candidate.providerType,
      evidence.candidate.resourceCategory,
    ]),
    address: Object.freeze({
      line1: source.acceptedLocation.addressLine1,
      locality: source.acceptedLocation.locality,
      region: source.acceptedLocation.regionCode,
      postalCode: source.acceptedLocation.postalCode,
      countryCode: source.acceptedLocation.countryCode,
    }),
    ...(domain ? { domain } : {}),
  });
}

function releaseGateFromEnvironment(): boolean {
  return process.env.RFXCHANGE_PROVIDER_PROMOTION_ENABLED?.trim().toLowerCase() === "true";
}

function identityReservationId(command: ProviderPromotionCommand): string {
  return `${command.marketKey}:${command.candidateId}`;
}

function ensureEvidence(
  bundle: Partial<ProviderPromotionEvidenceBundle>,
): ProviderPromotionEvidenceBundle {
  if (
    !bundle.candidate
    || !bundle.source
    || !bundle.geography
    || !bundle.comparison
    || !bundle.approval
  ) {
    throw new Error("Provider promotion evidence is incomplete in Firestore.");
  }
  return Object.freeze({
    candidate: bundle.candidate,
    source: bundle.source,
    geography: bundle.geography,
    comparison: bundle.comparison,
    approval: bundle.approval,
  });
}

export class FirestoreProviderPromotionAdapter {
  constructor(
    private readonly db: Firestore,
    private readonly options: Readonly<{
      now?: () => string;
      releaseEnabled?: () => boolean;
    }> = {},
  ) {}

  private now(): string {
    return (this.options.now ?? (() => new Date().toISOString()))();
  }

  private releaseEnabled(): boolean {
    return (this.options.releaseEnabled ?? releaseGateFromEnvironment)();
  }

  private async loadEvidence(
    command: ProviderPromotionCommand,
  ): Promise<ProviderPromotionEvidenceBundle> {
    const [candidate, source, geography, comparison, approval] = await Promise.all([
      this.db.doc(providerPromotionDocumentPath("candidates", command.candidateId)).get(),
      this.db.doc(providerPromotionDocumentPath("sourceRecords", command.candidateId)).get(),
      this.db.doc(
        providerPromotionDocumentPath("geographyPreparations", command.candidateId),
      ).get(),
      this.db.doc(providerPromotionDocumentPath("comparisons", command.comparisonId)).get(),
      this.db.doc(providerPromotionDocumentPath("approvals", command.approvalId)).get(),
    ]);
    return ensureEvidence({
      candidate: promotionRecord<ProviderSeedPromotionCandidate>(candidate),
      source: promotionRecord<ProviderPromotionSourceRecord>(source),
      geography: promotionRecord<ProviderPromotionGeographyPreparation>(geography),
      comparison: promotionRecord<ProviderCanonicalComparison>(comparison),
      approval: promotionRecord<ProviderPromotionApproval>(approval),
    });
  }

  private async loadAuthority(
    command: ProviderPromotionCommand,
  ): Promise<PlatformAdministratorAuthorityContext> {
    const snapshot = await this.db.doc(
      firestoreDocumentPath("adminAuthorityContexts", command.actorAdministratorId),
    ).get();
    const context = canonicalRecord<PlatformAdministratorAuthorityContext>(snapshot);
    if (!context) {
      throw new Error("Current provider-promotion administrator authority was not found.");
    }
    return context;
  }

  private async currentDiscoveryRecords(): Promise<readonly OrganizationDiscoveryRecord[]> {
    const snapshot = await this.db
      .collection(firestoreCollectionName("organizationDiscoveryRecords"))
      .get();
    return Object.freeze(snapshot.docs.map(discoveryRecord));
  }

  private async targetState(command: ProviderPromotionCommand): Promise<Readonly<{
    account: OrganizationAccount | null;
    profile: OrganizationProfile | null;
    discovery: OrganizationDiscoveryRecord | null;
  }>> {
    const [accountSnapshot, profiles, discoveries] = await Promise.all([
      this.db.doc(
        firestoreDocumentPath("organizations", command.targetOrganizationId),
      ).get(),
      this.db.collection(firestoreCollectionName("organizationProfiles"))
        .where("organizationId", "==", command.targetOrganizationId)
        .limit(2)
        .get(),
      this.db.collection(firestoreCollectionName("organizationDiscoveryRecords"))
        .where("organizationId", "==", command.targetOrganizationId)
        .limit(2)
        .get(),
    ]);
    if (profiles.size > 1 || discoveries.size > 1) {
      throw new Error("Target Organization has non-canonical duplicate profile/discovery records.");
    }
    return Object.freeze({
      account: canonicalRecord<OrganizationAccount>(accountSnapshot),
      profile: profiles.empty
        ? null
        : canonicalRecord<OrganizationProfile>(profiles.docs[0]!),
      discovery: discoveries.empty ? null : discoveryRecord(discoveries.docs[0]!),
    });
  }

  async preview(command: ProviderPromotionCommand): Promise<ProviderPromotionPreview> {
    if (command.action !== "preview-approved-provider-promotion") {
      throw new Error("Provider promotion preview requires a preview command.");
    }
    const [evidence, authority, discoveryRecords, target] = await Promise.all([
      this.loadEvidence(command),
      this.loadAuthority(command),
      this.currentDiscoveryRecords(),
      this.targetState(command),
    ]);
    const currentMatches = matchOrganizations(sourceIdentity(evidence), discoveryRecords);
    return evaluateProviderPromotion({
      evidence,
      command,
      authority,
      currentMatches,
      target,
      now: this.now(),
    }).preview;
  }

  async commit(
    command: ProviderPromotionCommand,
    confirmation: string,
  ): Promise<ProviderPromotionReceipt> {
    if (confirmation !== "PROMOTE APPROVED PROVIDER") {
      throw new Error(
        "Provider promotion commit requires the exact production confirmation phrase.",
      );
    }
    if (command.action !== "commit-approved-provider-promotion") {
      throw new Error("Provider promotion commit requires a committed promotion command.");
    }
    if (!this.releaseEnabled()) {
      throw new Error(
        "Provider seed promotion commit is disabled. Set RFXCHANGE_PROVIDER_PROMOTION_ENABLED=true only for an explicitly authorized release.",
      );
    }

    return this.db.runTransaction(async (transaction) => {
      const commandRef = this.db.doc(providerPromotionDocumentPath("commands", command.id));
      const receiptRef = this.db.doc(
        providerPromotionDocumentPath("receipts", `${command.id}:receipt`),
      );
      const [storedCommandSnapshot, storedReceiptSnapshot] = await Promise.all([
        transaction.get(commandRef),
        transaction.get(receiptRef),
      ]);
      const storedReceipt = promotionRecord<ProviderPromotionReceipt>(storedReceiptSnapshot);
      if (storedReceipt) {
        const storedCommand = promotionRecord<ProviderPromotionCommand>(storedCommandSnapshot);
        if (
          !storedCommand
          || storedCommand.requestFingerprint !== command.requestFingerprint
          || storedReceipt.requestFingerprint !== command.requestFingerprint
          || storedReceipt.commandId !== command.id
        ) {
          throw new Error("Provider promotion command id conflicts with an existing receipt.");
        }
        return storedReceipt;
      }
      if (storedCommandSnapshot.exists) {
        throw new Error("Provider promotion command exists without its atomic receipt.");
      }

      const evaluated = await this.evaluateWithinTransaction(transaction, command);
      await this.writeWithinTransaction(transaction, command, evaluated);
      return evaluated.receipt;
    });
  }

  private async evaluateWithinTransaction(
    transaction: Transaction,
    command: ProviderPromotionCommand,
  ) {
    const evidenceRefs = {
      candidate: this.db.doc(providerPromotionDocumentPath("candidates", command.candidateId)),
      source: this.db.doc(providerPromotionDocumentPath("sourceRecords", command.candidateId)),
      geography: this.db.doc(
        providerPromotionDocumentPath("geographyPreparations", command.candidateId),
      ),
      comparison: this.db.doc(
        providerPromotionDocumentPath("comparisons", command.comparisonId),
      ),
      approval: this.db.doc(providerPromotionDocumentPath("approvals", command.approvalId)),
      authority: this.db.doc(
        firestoreDocumentPath("adminAuthorityContexts", command.actorAdministratorId),
      ),
      account: this.db.doc(
        firestoreDocumentPath("organizations", command.targetOrganizationId),
      ),
    };
    const profileQuery = this.db
      .collection(firestoreCollectionName("organizationProfiles"))
      .where("organizationId", "==", command.targetOrganizationId)
      .limit(2);
    const targetDiscoveryQuery = this.db
      .collection(firestoreCollectionName("organizationDiscoveryRecords"))
      .where("organizationId", "==", command.targetOrganizationId)
      .limit(2);
    const allDiscoveryQuery = this.db.collection(
      firestoreCollectionName("organizationDiscoveryRecords"),
    );
    const [
      candidateSnapshot,
      sourceSnapshot,
      geographySnapshot,
      comparisonSnapshot,
      approvalSnapshot,
      authoritySnapshot,
      accountSnapshot,
      profileSnapshot,
      targetDiscoverySnapshot,
      allDiscoverySnapshot,
    ] = await Promise.all([
      transaction.get(evidenceRefs.candidate),
      transaction.get(evidenceRefs.source),
      transaction.get(evidenceRefs.geography),
      transaction.get(evidenceRefs.comparison),
      transaction.get(evidenceRefs.approval),
      transaction.get(evidenceRefs.authority),
      transaction.get(evidenceRefs.account),
      transaction.get(profileQuery),
      transaction.get(targetDiscoveryQuery),
      transaction.get(allDiscoveryQuery),
    ]);
    if (profileSnapshot.size > 1 || targetDiscoverySnapshot.size > 1) {
      throw new Error("Target Organization has non-canonical duplicate profile/discovery records.");
    }
    const evidence = ensureEvidence({
      candidate: promotionRecord<ProviderSeedPromotionCandidate>(candidateSnapshot),
      source: promotionRecord<ProviderPromotionSourceRecord>(sourceSnapshot),
      geography: promotionRecord<ProviderPromotionGeographyPreparation>(geographySnapshot),
      comparison: promotionRecord<ProviderCanonicalComparison>(comparisonSnapshot),
      approval: promotionRecord<ProviderPromotionApproval>(approvalSnapshot),
    });
    const authority = canonicalRecord<PlatformAdministratorAuthorityContext>(authoritySnapshot);
    if (!authority) {
      throw new Error("Current provider-promotion administrator authority was not found.");
    }
    const discoveryRecords = Object.freeze(allDiscoverySnapshot.docs.map(discoveryRecord));
    const currentMatches = matchOrganizations(sourceIdentity(evidence), discoveryRecords);
    const target = Object.freeze({
      account: canonicalRecord<OrganizationAccount>(accountSnapshot),
      profile: profileSnapshot.empty
        ? null
        : canonicalRecord<OrganizationProfile>(profileSnapshot.docs[0]!),
      discovery: targetDiscoverySnapshot.empty
        ? null
        : discoveryRecord(targetDiscoverySnapshot.docs[0]!),
    });
    return evaluateProviderPromotion({
      evidence,
      command,
      authority,
      currentMatches,
      target,
      now: this.now(),
    });
  }

  private async writeWithinTransaction(
    transaction: Transaction,
    command: ProviderPromotionCommand,
    evaluated: Awaited<
      ReturnType<FirestoreProviderPromotionAdapter["evaluateWithinTransaction"]>
    >,
  ): Promise<void> {
    const reservationRef = this.db.doc(
      providerPromotionDocumentPath("identityReservations", identityReservationId(command)),
    );
    const outputRefs = [
      reservationRef,
      this.db.doc(
        providerPromotionDocumentPath("seededLocations", evaluated.seededLocation.id),
      ),
      this.db.doc(
        providerPromotionDocumentPath("classifications", evaluated.classification.id),
      ),
      this.db.doc(
        providerPromotionDocumentPath("resourceDrafts", evaluated.resourceDraft.id),
      ),
    ];
    const outputSnapshots = await Promise.all(
      outputRefs.map((ref) => transaction.get(ref)),
    );
    if (outputSnapshots.some((snapshot) => snapshot.exists)) {
      throw new Error(
        "Provider promotion target output is already reserved or staged by another command.",
      );
    }

    await this.writeGeographyPacket(transaction, evaluated.geographyPacket);

    if (evaluated.account && evaluated.profile && evaluated.discovery) {
      transaction.create(
        this.db.doc(firestoreDocumentPath("organizations", evaluated.account.id)),
        mutableCanonicalPayload(evaluated.account),
      );
      transaction.create(
        this.db.doc(firestoreDocumentPath("organizationProfiles", evaluated.profile.id)),
        mutableCanonicalPayload(evaluated.profile),
      );
      transaction.create(
        this.db.doc(
          firestoreDocumentPath("organizationDiscoveryRecords", evaluated.discovery.id),
        ),
        mutableCanonicalPayload(evaluated.discovery),
      );
    }

    transaction.create(
      reservationRef,
      immutablePromotionPayload(Object.freeze({
        id: reservationRef.id,
        marketKey: command.marketKey,
        candidateId: command.candidateId,
        targetOrganizationId: command.targetOrganizationId,
        commandId: command.id,
        requestFingerprint: command.requestFingerprint,
        committedAt: evaluated.receipt.committedAt,
      })),
    );
    transaction.create(outputRefs[1]!, immutablePromotionPayload(evaluated.seededLocation));
    transaction.create(outputRefs[2]!, immutablePromotionPayload(evaluated.classification));
    transaction.create(outputRefs[3]!, immutablePromotionPayload(evaluated.resourceDraft));
    transaction.create(
      this.db.doc(providerPromotionDocumentPath("commands", command.id)),
      immutablePromotionPayload(command),
    );
    transaction.create(
      this.db.doc(providerPromotionDocumentPath("events", evaluated.event.id)),
      immutablePromotionPayload(evaluated.event),
    );
    transaction.create(
      this.db.doc(providerPromotionDocumentPath("receipts", evaluated.receipt.id)),
      immutablePromotionPayload(evaluated.receipt),
    );
  }

  private async writeGeographyPacket(
    transaction: Transaction,
    packet: Awaited<
      ReturnType<FirestoreProviderPromotionAdapter["evaluateWithinTransaction"]>
    >["geographyPacket"],
  ): Promise<void> {
    const datasetRefs = packet.datasetSources.map((record) =>
      this.db.doc(firestoreDocumentPath("geographyDatasetSources", record.id)),
    );
    const geographyRefs = packet.geographies.map((record) =>
      this.db.doc(firestoreDocumentPath("canonicalGeographies", record.id)),
    );
    const versionRefs = packet.versions.map((record) =>
      this.db.doc(firestoreDocumentPath("geographyVersions", record.id)),
    );
    const profileRef = this.db.doc(
      firestoreDocumentPath("locationGeographyProfiles", packet.profile.id),
    );
    const geographyCommandRef = this.db.doc(
      firestoreDocumentPath("geographyFabricCommands", packet.command.id),
    );
    const geographyEventRef = this.db.doc(
      firestoreDocumentPath("geographyFabricEvents", packet.event.id),
    );
    const [
      datasetSnapshots,
      geographySnapshots,
      versionSnapshots,
      profileSnapshot,
      geographyCommandSnapshot,
      geographyEventSnapshot,
    ] = await Promise.all([
      Promise.all(datasetRefs.map((ref) => transaction.get(ref))),
      Promise.all(geographyRefs.map((ref) => transaction.get(ref))),
      Promise.all(versionRefs.map((ref) => transaction.get(ref))),
      transaction.get(profileRef),
      transaction.get(geographyCommandRef),
      transaction.get(geographyEventRef),
    ]);
    if (
      profileSnapshot.exists
      || geographyCommandSnapshot.exists
      || geographyEventSnapshot.exists
    ) {
      throw new Error(
        "Prepared Geography Fabric profile has already been materialized by another operation.",
      );
    }

    for (const [index, record] of packet.datasetSources.entries()) {
      const snapshot = datasetSnapshots[index]!;
      if (snapshot.exists) {
        sameFields(
          snapshot,
          record as unknown as Readonly<Record<string, unknown>>,
          ["id", "sourceSystem", "authority", "vintage"],
          "Geography dataset source",
        );
      } else {
        transaction.create(datasetRefs[index]!, immutableCanonicalPayload(record));
      }
    }
    for (const [index, record] of packet.versions.entries()) {
      const snapshot = versionSnapshots[index]!;
      if (snapshot.exists) {
        sameFields(
          snapshot,
          record as unknown as Readonly<Record<string, unknown>>,
          ["id", "geographyId", "datasetSourceId", "vintage"],
          "Geography version",
        );
      } else {
        transaction.create(versionRefs[index]!, immutableCanonicalPayload(record));
      }
    }
    for (const [index, record] of packet.geographies.entries()) {
      transaction.set(
        geographyRefs[index]!,
        mutableCanonicalPayload(record, geographySnapshots[index]),
      );
    }
    for (const membership of packet.memberships) {
      transaction.create(
        this.db.doc(
          firestoreDocumentPath("locationGeographyMemberships", membership.id),
        ),
        immutableCanonicalPayload(membership),
      );
    }
    transaction.create(profileRef, mutableCanonicalPayload(packet.profile));
    transaction.create(geographyCommandRef, immutableCanonicalPayload(packet.command));
    transaction.create(geographyEventRef, immutableCanonicalPayload(packet.event));
  }
}
