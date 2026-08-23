import { createHash } from "node:crypto";

import {
  acceptedPointFingerprint,
  geographyPoint,
  type GeographyPoint,
  type LocationGeographyProfile,
} from "../geography-fabric/model.ts";
import type { LocationProfileMaterializationPacket } from "../geography-fabric/resolver.ts";
import type {
  OrganizationAccount,
  OrganizationProfile,
} from "../organizations/model.ts";
import type { OrganizationDiscoveryRecord } from "../organization-resolution/model.ts";
import type {
  ProviderCanonicalComparison,
  ProviderCanonicalMatchEvidence,
  ProviderPromotionApproval,
  ProviderPromotionCommand,
  ProviderPromotionEvent,
  ProviderSeedPromotionCandidate,
} from "./promotion.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type ProviderSeedSourceRecordId = Brand<string, "ProviderSeedSourceRecordId">;
export type SourceBackedOrganizationLocationId = Brand<
  string,
  "SourceBackedOrganizationLocationId"
>;
export type ProviderSeedDraftId = Brand<string, "ProviderSeedDraftId">;
export type ProviderPromotionReceiptId = Brand<string, "ProviderPromotionReceiptId">;

export interface ProviderSeedSourceAddress {
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly locality: string;
  readonly regionCode: string;
  readonly postalCode: string | null;
  readonly countryCode: string;
  readonly matchedAddress: string | null;
}

export interface ProviderSeedSourceLocation {
  readonly locationKey: string;
  readonly label: string;
  readonly address: ProviderSeedSourceAddress;
  readonly acceptedPoint: GeographyPoint;
  readonly acceptedPointFingerprint: string;
  readonly benchmark: string;
  readonly geocodedAt: string;
}

export interface ProviderSeedSourceRecord {
  readonly id: ProviderSeedSourceRecordId;
  readonly marketKey: string;
  readonly seedKey: string;
  readonly displayName: string;
  readonly providerClass: string;
  readonly participationPolicy: string;
  readonly providerType: string;
  readonly resourceCategory: string;
  readonly serviceName: string;
  readonly serviceSummary: string;
  readonly website: string | null;
  readonly aliases: readonly string[];
  readonly serviceAreaLabels: readonly string[];
  readonly primarySourceId: string;
  readonly intendedClaimState: string;
  readonly location: ProviderSeedSourceLocation;
  readonly sourcePlanFingerprint: string;
  readonly donorRepository: string;
  readonly donorCommit: string;
  readonly preparedAt: string;
}

export interface ProviderCanonicalSearchSnapshot {
  readonly id: string;
  readonly candidateId: string;
  readonly matches: readonly ProviderCanonicalMatchEvidence[];
  readonly generatedAt: string;
}

export interface SourceBackedOrganizationLocation {
  readonly id: SourceBackedOrganizationLocationId;
  readonly organizationId: string;
  readonly sourceRecordId: ProviderSeedSourceRecordId;
  readonly sourceLocationKey: string;
  readonly label: string;
  readonly address: ProviderSeedSourceAddress;
  readonly acceptedPoint: GeographyPoint;
  readonly acceptedPointFingerprint: string;
  readonly geographyProfileId: string;
  readonly geographyProfileVersion: number;
  readonly visibility: "approximate";
  readonly authorityState: "source-backed-unclaimed";
  readonly participantProjectionState: "withheld";
  readonly source: Readonly<{
    readonly kind: "provider-seed-import";
    readonly primarySourceId: string;
    readonly donorRepository: string;
    readonly donorCommit: string;
    readonly observedAt: string;
  }>;
  readonly importedByAdministratorId: string;
  readonly importedAt: string;
}

export interface ProviderSeedDraft {
  readonly id: ProviderSeedDraftId;
  readonly organizationId: string;
  readonly candidateId: string;
  readonly sourceRecordId: ProviderSeedSourceRecordId;
  readonly sourceBackedLocationId: SourceBackedOrganizationLocationId;
  readonly geographyProfileId: string;
  readonly marketKey: string;
  readonly canonicalOrganizationDisplayName: string;
  readonly sourceDisplayName: string;
  readonly providerClass: string;
  readonly participationPolicy: string;
  readonly providerType: string;
  readonly resourceCategory: string;
  readonly serviceName: string;
  readonly serviceSummary: string;
  readonly website: string | null;
  readonly aliases: readonly string[];
  readonly serviceAreaLabels: readonly string[];
  readonly primarySourceId: string;
  readonly intendedClaimState: string;
  readonly status: "staged";
  readonly claimState: "unclaimed";
  readonly officialResourceProviderStatus: "not-granted";
  readonly providerDiscoveryStatus: "not-published";
  readonly resourcePublicationStatus: "not-published";
  readonly participantAuthorUserId: null;
  readonly createdByAdministratorId: string;
  readonly sourcePlanFingerprint: string;
  readonly sourceRecordFingerprint: string;
  readonly geographyProfileFingerprint: string;
  readonly createdAt: string;
}

export interface ProviderPromotionReceipt {
  readonly id: ProviderPromotionReceiptId;
  readonly commandId: string;
  readonly action:
    | "preview-approved-provider-promotion"
    | "commit-approved-provider-promotion";
  readonly status: "previewed" | "committed";
  readonly candidateId: string;
  readonly targetOrganizationMode: "create" | "attach-existing";
  readonly targetOrganizationId: string;
  readonly organizationCreated: boolean;
  readonly organizationAttached: boolean;
  readonly sourceBackedLocationId: SourceBackedOrganizationLocationId;
  readonly providerSeedDraftId: ProviderSeedDraftId;
  readonly geographyProfileId: string;
  readonly providerDiscoveryPublished: false;
  readonly resourcePublished: false;
  readonly officialResourceProviderGranted: false;
  readonly requestFingerprint: string;
  readonly actorAdministratorId: string;
  readonly recordedAt: string;
}

export interface ProviderSeedPromotionEvidenceBundle {
  readonly candidate: ProviderSeedPromotionCandidate;
  readonly sourceRecord: ProviderSeedSourceRecord;
  readonly geography: LocationProfileMaterializationPacket;
  readonly canonicalSearch: ProviderCanonicalSearchSnapshot;
  readonly comparison: ProviderCanonicalComparison;
  readonly approval: ProviderPromotionApproval;
}

export interface ProviderSeedPromotionOrganizationState {
  readonly account: OrganizationAccount | null;
  readonly profile: OrganizationProfile | null;
  readonly discovery: OrganizationDiscoveryRecord | null;
}

export interface ProviderSeedPromotionWriteSet {
  readonly command: ProviderPromotionCommand;
  readonly event: ProviderPromotionEvent;
  readonly receipt: ProviderPromotionReceipt;
  readonly evidence: ProviderSeedPromotionEvidenceBundle;
  readonly organization: Readonly<{
    readonly mode: "create" | "attach-existing";
    readonly account: OrganizationAccount;
    readonly profile: OrganizationProfile;
    readonly discovery: OrganizationDiscoveryRecord;
    readonly createRecords: boolean;
  }>;
  readonly location: SourceBackedOrganizationLocation;
  readonly draft: ProviderSeedDraft;
  readonly geography: LocationProfileMaterializationPacket;
}

function normalized(value: string, label: string, maximum = 500): string {
  const result = value.trim().replace(/\s+/g, " ");
  if (!result || result.length > maximum) {
    throw new Error(`${label} must contain 1-${maximum} characters.`);
  }
  return result;
}

function optional(
  value: string | null | undefined,
  label: string,
  maximum = 500,
): string | null {
  return value?.trim() ? normalized(value, label, maximum) : null;
}

function stable<T extends string>(value: string, label: string): T {
  const result = normalized(value, label, 240).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._:-]{1,239}$/.test(result)) {
    throw new Error(`${label} must be a stable lowercase identifier.`);
  }
  return result as T;
}

function foreignId(value: string, label: string): string {
  const result = normalized(value, label, 191);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(result)) {
    throw new Error(`${label} must be a stable identifier.`);
  }
  return result;
}

function timestamp(value: string, label: string): string {
  const parsed = Date.parse(normalized(value, label, 80));
  if (Number.isNaN(parsed)) throw new Error(`${label} must be ISO-compatible.`);
  return new Date(parsed).toISOString();
}

function safeUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const url = new URL(value.trim());
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Provider website must be a safe HTTP(S) URL.");
  }
  return url.toString();
}

function uniqueStrings(values: readonly string[], label: string): readonly string[] {
  return Object.freeze([
    ...new Set(values.map((value) => normalized(value, label, 300))),
  ]);
}

function sourceAddress(input: ProviderSeedSourceAddress): ProviderSeedSourceAddress {
  return Object.freeze({
    addressLine1: normalized(input.addressLine1, "Source address line", 300),
    addressLine2: optional(input.addressLine2, "Source address line 2", 300),
    locality: normalized(input.locality, "Source address locality", 160),
    regionCode: normalized(input.regionCode, "Source address region", 40).toUpperCase(),
    postalCode: optional(input.postalCode, "Source postal code", 40),
    countryCode: normalized(input.countryCode, "Source address country", 2).toUpperCase(),
    matchedAddress: optional(input.matchedAddress, "Matched source address", 500),
  });
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Readonly<Record<string, unknown>>)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonicalize(nested)] as const);
    return Object.fromEntries(entries);
  }
  return value;
}

export function deterministicProviderPromotionFingerprint(value: unknown): string {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex")}`;
}

export function providerSeedSourceRecordFingerprint(
  sourceRecord: ProviderSeedSourceRecord,
): string {
  return deterministicProviderPromotionFingerprint(sourceRecord);
}

export function providerGeographyProfileFingerprint(
  packet: LocationProfileMaterializationPacket,
): string {
  return deterministicProviderPromotionFingerprint({
    datasetSources: packet.datasetSources,
    geographies: packet.geographies,
    versions: packet.versions,
    profile: packet.profile,
    memberships: packet.memberships,
  });
}

export function providerCanonicalSearchFingerprint(
  snapshot: ProviderCanonicalSearchSnapshot,
): string {
  return deterministicProviderPromotionFingerprint({
    candidateId: snapshot.candidateId,
    matches: snapshot.matches,
    generatedAt: snapshot.generatedAt,
  });
}

export function providerCanonicalComparisonFingerprint(
  comparison: ProviderCanonicalComparison,
): string {
  const { comparisonFingerprint: _ignored, ...evidence } = comparison;
  return deterministicProviderPromotionFingerprint(evidence);
}

export function providerPromotionApprovalFingerprint(
  approval: ProviderPromotionApproval,
): string {
  return deterministicProviderPromotionFingerprint(approval);
}

export function providerPromotionRequestFingerprint(
  command: ProviderPromotionCommand,
): string {
  const { requestFingerprint: _ignored, ...request } = command;
  return deterministicProviderPromotionFingerprint(request);
}

export function createProviderSeedSourceRecord(input: Readonly<{
  id?: string;
  marketKey: string;
  seedKey: string;
  displayName: string;
  providerClass: string;
  participationPolicy: string;
  providerType: string;
  resourceCategory: string;
  serviceName: string;
  serviceSummary: string;
  website?: string | null;
  aliases?: readonly string[];
  serviceAreaLabels?: readonly string[];
  primarySourceId: string;
  intendedClaimState: string;
  location: Readonly<{
    locationKey: string;
    label: string;
    address: ProviderSeedSourceAddress;
    acceptedPoint: GeographyPoint;
    benchmark: string;
    geocodedAt: string;
  }>;
  sourcePlanFingerprint: string;
  donorRepository: string;
  donorCommit: string;
  preparedAt: string;
}>): ProviderSeedSourceRecord {
  const marketKey = stable<string>(input.marketKey, "Provider seed market key");
  const seedKey = stable<string>(input.seedKey, "Provider seed key");
  const point = geographyPoint(input.location.acceptedPoint);
  return Object.freeze({
    id: stable<ProviderSeedSourceRecordId>(
      input.id ?? `${marketKey}:${seedKey}`,
      "Provider seed source record id",
    ),
    marketKey,
    seedKey,
    displayName: normalized(input.displayName, "Provider source display name", 200),
    providerClass: stable<string>(input.providerClass, "Provider class"),
    participationPolicy: stable<string>(
      input.participationPolicy,
      "Provider participation policy",
    ),
    providerType: stable<string>(input.providerType, "Provider type"),
    resourceCategory: stable<string>(input.resourceCategory, "Resource category"),
    serviceName: normalized(input.serviceName, "Provider service name", 240),
    serviceSummary: normalized(input.serviceSummary, "Provider service summary", 2_000),
    website: safeUrl(input.website),
    aliases: uniqueStrings(input.aliases ?? [], "Provider source alias"),
    serviceAreaLabels: uniqueStrings(
      input.serviceAreaLabels ?? [],
      "Provider source service-area label",
    ),
    primarySourceId: foreignId(input.primarySourceId, "Provider primary source id"),
    intendedClaimState: stable<string>(
      input.intendedClaimState,
      "Provider intended claim state",
    ),
    location: Object.freeze({
      locationKey: foreignId(input.location.locationKey, "Provider source location key"),
      label: normalized(input.location.label, "Provider source location label", 240),
      address: sourceAddress(input.location.address),
      acceptedPoint: point,
      acceptedPointFingerprint: acceptedPointFingerprint(point),
      benchmark: normalized(input.location.benchmark, "Provider geocode benchmark", 160),
      geocodedAt: timestamp(input.location.geocodedAt, "Provider geocode timestamp"),
    }),
    sourcePlanFingerprint: normalized(
      input.sourcePlanFingerprint,
      "Provider source plan fingerprint",
      500,
    ),
    donorRepository: normalized(input.donorRepository, "Provider donor repository", 240),
    donorCommit: normalized(input.donorCommit, "Provider donor commit", 120),
    preparedAt: timestamp(input.preparedAt, "Provider source record preparation timestamp"),
  });
}

export function createProviderCanonicalSearchSnapshot(input: Readonly<{
  id: string;
  candidateId: string;
  matches?: readonly ProviderCanonicalMatchEvidence[];
  generatedAt: string;
}>): ProviderCanonicalSearchSnapshot {
  const matches = Object.freeze([...(input.matches ?? [])]);
  const organizationIds = new Set(matches.map((match) => match.organizationId));
  if (organizationIds.size !== matches.length) {
    throw new Error("Canonical search snapshot cannot repeat an Organization.");
  }
  return Object.freeze({
    id: stable<string>(input.id, "Provider canonical search snapshot id"),
    candidateId: stable<string>(input.candidateId, "Provider search candidate id"),
    matches,
    generatedAt: timestamp(input.generatedAt, "Provider canonical search timestamp"),
  });
}

export function createSourceBackedOrganizationLocation(input: Readonly<{
  id: string;
  organizationId: string;
  sourceRecord: ProviderSeedSourceRecord;
  geographyProfile: LocationGeographyProfile;
  importedByAdministratorId: string;
  importedAt: string;
}>): SourceBackedOrganizationLocation {
  const organizationId = foreignId(input.organizationId, "Imported location Organization id");
  if (
    input.geographyProfile.organizationId !== organizationId
    || input.geographyProfile.locationId !== input.id
  ) {
    throw new Error("Source-backed location must match its Organization-bound Geography profile.");
  }
  if (
    input.geographyProfile.acceptedPointFingerprint
      !== input.sourceRecord.location.acceptedPointFingerprint
    || acceptedPointFingerprint(input.geographyProfile.acceptedPoint)
      !== input.sourceRecord.location.acceptedPointFingerprint
  ) {
    throw new Error("Source-backed location and Geography profile use different accepted points.");
  }
  return Object.freeze({
    id: stable<SourceBackedOrganizationLocationId>(
      input.id,
      "Source-backed Organization location id",
    ),
    organizationId,
    sourceRecordId: input.sourceRecord.id,
    sourceLocationKey: input.sourceRecord.location.locationKey,
    label: input.sourceRecord.location.label,
    address: input.sourceRecord.location.address,
    acceptedPoint: input.sourceRecord.location.acceptedPoint,
    acceptedPointFingerprint: input.sourceRecord.location.acceptedPointFingerprint,
    geographyProfileId: input.geographyProfile.id,
    geographyProfileVersion: input.geographyProfile.profileVersion,
    visibility: "approximate",
    authorityState: "source-backed-unclaimed",
    participantProjectionState: "withheld",
    source: Object.freeze({
      kind: "provider-seed-import",
      primarySourceId: input.sourceRecord.primarySourceId,
      donorRepository: input.sourceRecord.donorRepository,
      donorCommit: input.sourceRecord.donorCommit,
      observedAt: input.sourceRecord.preparedAt,
    }),
    importedByAdministratorId: foreignId(
      input.importedByAdministratorId,
      "Provider import administrator id",
    ),
    importedAt: timestamp(input.importedAt, "Provider import timestamp"),
  });
}

export function createProviderSeedDraft(input: Readonly<{
  id: string;
  organizationId: string;
  canonicalOrganizationDisplayName: string;
  candidate: ProviderSeedPromotionCandidate;
  sourceRecord: ProviderSeedSourceRecord;
  location: SourceBackedOrganizationLocation;
  geographyProfileFingerprint: string;
  createdByAdministratorId: string;
  createdAt: string;
}>): ProviderSeedDraft {
  const organizationId = foreignId(input.organizationId, "Provider seed draft Organization id");
  if (
    input.candidate.marketKey !== input.sourceRecord.marketKey
    || input.candidate.seedKey !== input.sourceRecord.seedKey
    || input.candidate.primarySourceId !== input.sourceRecord.primarySourceId
    || input.location.organizationId !== organizationId
    || input.location.sourceRecordId !== input.sourceRecord.id
  ) {
    throw new Error("Provider seed draft evidence is cross-bound.");
  }
  return Object.freeze({
    id: stable<ProviderSeedDraftId>(input.id, "Provider seed draft id"),
    organizationId,
    candidateId: input.candidate.id,
    sourceRecordId: input.sourceRecord.id,
    sourceBackedLocationId: input.location.id,
    geographyProfileId: input.location.geographyProfileId,
    marketKey: input.candidate.marketKey,
    canonicalOrganizationDisplayName: normalized(
      input.canonicalOrganizationDisplayName,
      "Canonical Organization display name",
      200,
    ),
    sourceDisplayName: input.sourceRecord.displayName,
    providerClass: input.sourceRecord.providerClass,
    participationPolicy: input.sourceRecord.participationPolicy,
    providerType: input.sourceRecord.providerType,
    resourceCategory: input.sourceRecord.resourceCategory,
    serviceName: input.sourceRecord.serviceName,
    serviceSummary: input.sourceRecord.serviceSummary,
    website: input.sourceRecord.website,
    aliases: input.sourceRecord.aliases,
    serviceAreaLabels: input.sourceRecord.serviceAreaLabels,
    primarySourceId: input.sourceRecord.primarySourceId,
    intendedClaimState: input.sourceRecord.intendedClaimState,
    status: "staged",
    claimState: "unclaimed",
    officialResourceProviderStatus: "not-granted",
    providerDiscoveryStatus: "not-published",
    resourcePublicationStatus: "not-published",
    participantAuthorUserId: null,
    createdByAdministratorId: foreignId(
      input.createdByAdministratorId,
      "Provider seed draft administrator id",
    ),
    sourcePlanFingerprint: input.sourceRecord.sourcePlanFingerprint,
    sourceRecordFingerprint: providerSeedSourceRecordFingerprint(input.sourceRecord),
    geographyProfileFingerprint: normalized(
      input.geographyProfileFingerprint,
      "Provider seed Geography profile fingerprint",
      500,
    ),
    createdAt: timestamp(input.createdAt, "Provider seed draft creation timestamp"),
  });
}

export function createProviderPromotionReceipt(input: Readonly<{
  command: ProviderPromotionCommand;
  status: "previewed" | "committed";
}>): ProviderPromotionReceipt {
  const committed = input.status === "committed";
  if (
    committed !== (input.command.action === "commit-approved-provider-promotion")
  ) {
    throw new Error("Provider promotion receipt status must match its command action.");
  }
  return Object.freeze({
    id: stable<ProviderPromotionReceiptId>(
      `${input.command.id}:receipt`,
      "Provider promotion receipt id",
    ),
    commandId: input.command.id,
    action: input.command.action,
    status: input.status,
    candidateId: input.command.candidateId,
    targetOrganizationMode: input.command.targetOrganizationMode,
    targetOrganizationId: input.command.targetOrganizationId,
    organizationCreated: input.command.targetOrganizationMode === "create",
    organizationAttached: input.command.targetOrganizationMode === "attach-existing",
    sourceBackedLocationId: stable<SourceBackedOrganizationLocationId>(
      input.command.targetLocationId,
      "Provider promotion receipt location id",
    ),
    providerSeedDraftId: stable<ProviderSeedDraftId>(
      input.command.targetProviderResourceId,
      "Provider promotion receipt draft id",
    ),
    geographyProfileId: input.command.geographyProfileId,
    providerDiscoveryPublished: false,
    resourcePublished: false,
    officialResourceProviderGranted: false,
    requestFingerprint: input.command.requestFingerprint,
    actorAdministratorId: input.command.actorAdministratorId,
    recordedAt: input.command.recordedAt,
  });
}
