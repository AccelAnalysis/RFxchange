import type { GeographyDefinition } from "../geography/model.ts";
import type {
  GeocodeProvenance,
  GeocodeQuality,
  LocationVisibility,
  OrganizationGeocodeCandidate,
  StructuredPostalAddress,
} from "../organization-location/model.ts";
import type { GeographicPosition } from "../geography/boundary.ts";
import type { OrganizationLocationTimestamp } from "../organization-location/model.ts";
import {
  defaultLocationVisibility,
  locationVisibility,
  organizationLocationDraftId,
  organizationLocationId,
  projectPublicOrganizationLocation,
} from "../organization-location/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { StoredAssetId } from "../storage/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";

export const ORGANIZATION_CREDENTIAL_KINDS = [
  "certification",
  "license",
  "uei",
  "cage",
  "sam_registration",
  "other_identifier",
] as const;
export type OrganizationCredentialKind = (typeof ORGANIZATION_CREDENTIAL_KINDS)[number];

export const ORGANIZATION_CREDENTIAL_STATUSES = [
  "self_reported",
  "evidence_submitted",
  "expired",
  "retired",
] as const;
export type OrganizationCredentialStatus = (typeof ORGANIZATION_CREDENTIAL_STATUSES)[number];

export const ENRICHMENT_VISIBILITIES = ["private", "network", "public"] as const;
export type EnrichmentVisibility = (typeof ENRICHMENT_VISIBILITIES)[number];

export interface OrganizationCredential {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly kind: OrganizationCredentialKind;
  readonly label: string;
  readonly issuer: string;
  readonly identifierValue: string | null;
  readonly issuedOn: string | null;
  readonly effectiveOn: string | null;
  readonly expiresOn: string | null;
  readonly sourceLabel: string;
  readonly sourceUrl: string | null;
  readonly evidenceAssetIds: readonly StoredAssetId[];
  readonly status: OrganizationCredentialStatus;
  readonly visibility: EnrichmentVisibility;
  readonly recordedByUserId: UserId;
  readonly recordedByMembershipId: OrganizationMembershipId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly retiredAt: string | null;
}

export interface PublicOrganizationCredential {
  readonly id: string;
  readonly kind: OrganizationCredentialKind;
  readonly label: string;
  readonly issuer: string;
  readonly identifierValue: string | null;
  readonly issuedOn: string | null;
  readonly effectiveOn: string | null;
  readonly expiresOn: string | null;
  readonly status: Exclude<OrganizationCredentialStatus, "retired">;
  readonly provenanceLabel: "Organization reported";
}

export const ORGANIZATION_PROFILE_ASSET_KINDS = ["logo", "image", "document", "portfolio"] as const;
export type OrganizationProfileAssetKind = (typeof ORGANIZATION_PROFILE_ASSET_KINDS)[number];
export type ProfileAssetPublicationStatus = "private" | "published" | "unpublished" | "retired";

export interface OrganizationProfileAsset {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly storedAssetId: StoredAssetId;
  readonly kind: OrganizationProfileAssetKind;
  readonly title: string;
  readonly description: string | null;
  readonly altText: string | null;
  readonly publicationStatus: ProfileAssetPublicationStatus;
  readonly recordedByUserId: UserId;
  readonly recordedByMembershipId: OrganizationMembershipId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly publishedAt: string | null;
  readonly retiredAt: string | null;
}

export interface PublicOrganizationProfileAsset {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly kind: OrganizationProfileAssetKind;
  readonly title: string;
  readonly description: string | null;
  readonly altText: string | null;
  readonly deliveryPath: string;
  readonly provenanceLabel: "Organization published";
}

export type AdditionalLocationDraftState = "geocoded" | "confirmed" | "superseded";
export type AdditionalLocationPublicationStatus = "private" | "published" | "unpublished";

export interface OrganizationAdditionalLocationDraft {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly locationId: string;
  readonly label: string;
  readonly requestedByUserId: UserId;
  readonly membershipId: OrganizationMembershipId;
  readonly geographyId: string;
  readonly physicalAddress: StructuredPostalAddress;
  readonly isHomeOrPrivate: boolean;
  readonly visibility: LocationVisibility;
  readonly candidates: readonly OrganizationGeocodeCandidate[];
  readonly selectedCandidateId: string | null;
  readonly state: AdditionalLocationDraftState;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OrganizationAdditionalLocation {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly sourceDraftId: string;
  readonly label: string;
  readonly geographyId: string;
  readonly physicalAddress: StructuredPostalAddress;
  readonly isHomeOrPrivate: boolean;
  readonly visibility: LocationVisibility;
  readonly coordinate: GeographicPosition;
  readonly geocodeQuality: GeocodeQuality;
  readonly geocodeProvenance: GeocodeProvenance;
  readonly publicationStatus: AdditionalLocationPublicationStatus;
  readonly lifecycleStatus: "active" | "retired";
  readonly confirmedByUserId: UserId;
  readonly confirmedByMembershipId: OrganizationMembershipId;
  readonly confirmedAt: string;
  readonly updatedAt: string;
  readonly publishedAt: string | null;
  readonly retiredAt: string | null;
}

export type PublicOrganizationAdditionalLocation = Readonly<{
  id: string;
  organizationId: OrganizationId;
  label: string;
  geographyId: string;
  localityName: string;
  visibility: LocationVisibility;
  coordinate?: GeographicPosition;
  displayAddress?: StructuredPostalAddress;
  relationship: "subordinate-location";
}>;

export const ORGANIZATION_ENRICHMENT_EVENT_KINDS = [
  "credential-upserted",
  "credential-retired",
  "asset-registered",
  "asset-publication-changed",
  "asset-retired",
  "additional-location-geocoded",
  "additional-location-confirmed",
  "additional-location-publication-changed",
  "additional-location-retired",
] as const;
export type OrganizationEnrichmentEventKind = (typeof ORGANIZATION_ENRICHMENT_EVENT_KINDS)[number];

export interface OrganizationEnrichmentEvent {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly actorUserId: UserId;
  readonly actorMembershipId: OrganizationMembershipId;
  readonly kind: OrganizationEnrichmentEventKind;
  readonly subjectId: string;
  readonly commandId: string;
  readonly priorState: Readonly<Record<string, unknown>> | null;
  readonly newState: Readonly<Record<string, unknown>>;
  readonly occurredAt: string;
}

export interface OrganizationEnrichmentCommandReceipt {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly action: OrganizationEnrichmentEventKind;
  readonly resultId: string;
  readonly requestFingerprint: string;
  readonly actorUserId: UserId;
  readonly recordedAt: string;
}

function text(value: string, label: string, maximum: number, minimum = 1): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new Error(`${label} must contain ${minimum}-${maximum} characters.`);
  }
  return normalized;
}

function optionalText(value: string | null | undefined, label: string, maximum: number): string | null {
  return value?.trim() ? text(value, label, maximum) : null;
}

function optionalHttpsUrl(value: string | null | undefined, label: string): string | null {
  const normalized = optionalText(value, label, 2_048);
  if (!normalized) return null;
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${label} must be a valid HTTPS URL.`);
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new Error(`${label} must be a valid HTTPS URL.`);
  }
  return parsed.toString();
}

function stableId(value: string, label: string): string {
  const normalized = text(value, label, 191, 2);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(normalized)) {
    throw new Error(`${label} must be a stable identifier.`);
  }
  return normalized;
}

function oneOf<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value as T)) throw new Error(`Unsupported ${label}: ${value}.`);
  return value as T;
}

function timestamp(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error("Timestamp must be ISO compatible.");
  return new Date(parsed).toISOString();
}

function date(value: string | null | undefined, label: string): string | null {
  if (!value?.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))) {
    throw new Error(`${label} must be an ISO date.`);
  }
  return value;
}

function validateDateOrder(issuedOn: string | null, effectiveOn: string | null, expiresOn: string | null): void {
  const start = effectiveOn ?? issuedOn;
  if (start && expiresOn && Date.parse(expiresOn) < Date.parse(start)) {
    throw new Error("Credential expiration cannot precede its issued or effective date.");
  }
}

export function createOrganizationCredential(input: Readonly<{
  id: string;
  organizationId: OrganizationId;
  kind: string;
  label: string;
  issuer: string;
  identifierValue?: string | null;
  issuedOn?: string | null;
  effectiveOn?: string | null;
  expiresOn?: string | null;
  sourceLabel: string;
  sourceUrl?: string | null;
  evidenceAssetIds?: readonly StoredAssetId[];
  visibility: string;
  userId: UserId;
  membershipId: OrganizationMembershipId;
  now: string;
  existing?: OrganizationCredential | null;
}>): OrganizationCredential {
  const now = timestamp(input.now);
  const issuedOn = date(input.issuedOn, "Issued date");
  const effectiveOn = date(input.effectiveOn, "Effective date");
  const expiresOn = date(input.expiresOn, "Expiration date");
  validateDateOrder(issuedOn, effectiveOn, expiresOn);
  const evidenceAssetIds = Object.freeze([...new Set(input.evidenceAssetIds ?? [])]);
  if (evidenceAssetIds.length > 10) throw new Error("Credential supports at most 10 evidence assets.");
  const status: OrganizationCredentialStatus = expiresOn && Date.parse(`${expiresOn}T23:59:59.999Z`) < Date.parse(now)
    ? "expired"
    : evidenceAssetIds.length > 0 ? "evidence_submitted" : "self_reported";
  return Object.freeze({
    id: stableId(input.id, "Credential id"),
    organizationId: input.organizationId,
    kind: oneOf(input.kind, ORGANIZATION_CREDENTIAL_KINDS, "credential kind"),
    label: text(input.label, "Credential label", 240),
    issuer: text(input.issuer, "Credential issuer", 240),
    identifierValue: optionalText(input.identifierValue, "Credential identifier", 240),
    issuedOn,
    effectiveOn,
    expiresOn,
    sourceLabel: text(input.sourceLabel, "Credential source", 240),
    sourceUrl: optionalHttpsUrl(input.sourceUrl, "Credential source URL"),
    evidenceAssetIds,
    status,
    visibility: oneOf(input.visibility, ENRICHMENT_VISIBILITIES, "credential visibility"),
    recordedByUserId: input.userId,
    recordedByMembershipId: input.membershipId,
    createdAt: input.existing?.createdAt ?? now,
    updatedAt: now,
    retiredAt: null,
  });
}

export function retireOrganizationCredential(record: OrganizationCredential, nowValue: string): OrganizationCredential {
  if (record.status === "retired") return record;
  const now = timestamp(nowValue);
  return Object.freeze({ ...record, status: "retired" as const, visibility: "private" as const, updatedAt: now, retiredAt: now });
}

export function projectPublicCredential(record: OrganizationCredential): PublicOrganizationCredential | null {
  if (record.visibility !== "public" || record.status === "retired") return null;
  return Object.freeze({
    id: record.id,
    kind: record.kind,
    label: record.label,
    issuer: record.issuer,
    identifierValue: record.identifierValue,
    issuedOn: record.issuedOn,
    effectiveOn: record.effectiveOn,
    expiresOn: record.expiresOn,
    status: record.status,
    provenanceLabel: "Organization reported" as const,
  });
}

export function createOrganizationProfileAsset(input: Readonly<{
  id: string;
  organizationId: OrganizationId;
  storedAssetId: StoredAssetId;
  kind: string;
  title: string;
  description?: string | null;
  altText?: string | null;
  userId: UserId;
  membershipId: OrganizationMembershipId;
  now: string;
}>): OrganizationProfileAsset {
  const kind = oneOf(input.kind, ORGANIZATION_PROFILE_ASSET_KINDS, "profile asset kind");
  const altText = optionalText(input.altText, "Asset alternative text", 300);
  if ((kind === "logo" || kind === "image" || kind === "portfolio") && !altText) {
    throw new Error("Published visual assets require meaningful alternative text.");
  }
  const now = timestamp(input.now);
  return Object.freeze({
    id: stableId(input.id, "Profile asset id"), organizationId: input.organizationId,
    storedAssetId: input.storedAssetId, kind, title: text(input.title, "Asset title", 240),
    description: optionalText(input.description, "Asset description", 2_000), altText,
    publicationStatus: "private" as const, recordedByUserId: input.userId,
    recordedByMembershipId: input.membershipId, createdAt: now, updatedAt: now,
    publishedAt: null, retiredAt: null,
  });
}

export function changeProfileAssetPublication(record: OrganizationProfileAsset, publish: boolean, nowValue: string): OrganizationProfileAsset {
  if (record.publicationStatus === "retired") throw new Error("A retired profile asset cannot be published.");
  if (publish && (record.kind === "logo" || record.kind === "image" || record.kind === "portfolio") && !record.altText) {
    throw new Error("Visual assets need alternative text before publication.");
  }
  const now = timestamp(nowValue);
  return Object.freeze({ ...record, publicationStatus: publish ? "published" as const : "unpublished" as const,
    updatedAt: now, publishedAt: publish ? record.publishedAt ?? now : record.publishedAt });
}

export function retireProfileAsset(record: OrganizationProfileAsset, nowValue: string): OrganizationProfileAsset {
  if (record.publicationStatus === "retired") return record;
  const now = timestamp(nowValue);
  return Object.freeze({ ...record, publicationStatus: "retired" as const, updatedAt: now, retiredAt: now });
}

export function projectPublicProfileAsset(record: OrganizationProfileAsset): PublicOrganizationProfileAsset | null {
  if (record.publicationStatus !== "published") return null;
  return Object.freeze({ id: record.id, organizationId: record.organizationId, kind: record.kind,
    title: record.title, description: record.description, altText: record.altText,
    deliveryPath: `/api/organization-enrichment/assets/${encodeURIComponent(record.id)}`,
    provenanceLabel: "Organization published" as const });
}

export function createAdditionalLocationDraft(input: Readonly<{
  id: string; locationId: string; organizationId: OrganizationId; label: string;
  requestedByUserId: UserId; membershipId: OrganizationMembershipId; geographyId: string;
  physicalAddress: StructuredPostalAddress; isHomeOrPrivate: boolean; visibility?: string;
  candidates: readonly OrganizationGeocodeCandidate[]; now: string;
}>): OrganizationAdditionalLocationDraft {
  if (input.candidates.length === 0) throw new Error("Additional location requires a geocode candidate.");
  if (input.candidates.some((candidate) => String(candidate.geographyId) !== input.geographyId)) {
    throw new Error("Every additional-location candidate must remain in the authorized geography.");
  }
  const now = timestamp(input.now);
  return Object.freeze({ id: stableId(input.id, "Additional location draft id"),
    organizationId: input.organizationId, locationId: stableId(input.locationId, "Additional location id"),
    label: text(input.label, "Additional location label", 160), requestedByUserId: input.requestedByUserId,
    membershipId: input.membershipId, geographyId: stableId(input.geographyId, "Additional location geography"),
    physicalAddress: Object.freeze({ ...input.physicalAddress }), isHomeOrPrivate: input.isHomeOrPrivate,
    visibility: locationVisibility(input.visibility ?? defaultLocationVisibility(input.isHomeOrPrivate)),
    candidates: Object.freeze([...input.candidates]), selectedCandidateId: null, state: "geocoded" as const,
    createdAt: now, updatedAt: now });
}

export function confirmAdditionalLocationDraft(input: Readonly<{
  draft: OrganizationAdditionalLocationDraft; candidateId: string; userId: UserId;
  membershipId: OrganizationMembershipId; now: string;
}>): Readonly<{ draft: OrganizationAdditionalLocationDraft; location: OrganizationAdditionalLocation }> {
  if (input.draft.state !== "geocoded") throw new Error("Only a geocoded additional location may be confirmed.");
  const candidate = input.draft.candidates.find((entry) => entry.id === input.candidateId);
  if (!candidate) throw new Error("Selected candidate does not belong to this additional location.");
  const now = timestamp(input.now);
  const draft = Object.freeze({ ...input.draft, selectedCandidateId: candidate.id, state: "confirmed" as const, updatedAt: now });
  return Object.freeze({ draft, location: Object.freeze({
    id: input.draft.locationId, organizationId: input.draft.organizationId, sourceDraftId: input.draft.id,
    label: input.draft.label, geographyId: input.draft.geographyId, physicalAddress: input.draft.physicalAddress,
    isHomeOrPrivate: input.draft.isHomeOrPrivate, visibility: input.draft.visibility,
    coordinate: candidate.coordinate, geocodeQuality: candidate.quality, geocodeProvenance: candidate.provenance,
    publicationStatus: "private" as const, lifecycleStatus: "active" as const,
    confirmedByUserId: input.userId, confirmedByMembershipId: input.membershipId,
    confirmedAt: now, updatedAt: now, publishedAt: null, retiredAt: null,
  }) });
}

export function changeAdditionalLocationPublication(record: OrganizationAdditionalLocation, publish: boolean, nowValue: string): OrganizationAdditionalLocation {
  if (record.lifecycleStatus !== "active") throw new Error("A retired additional location cannot be published.");
  const now = timestamp(nowValue);
  return Object.freeze({ ...record, publicationStatus: publish ? "published" as const : "unpublished" as const,
    updatedAt: now, publishedAt: publish ? record.publishedAt ?? now : record.publishedAt });
}

export function retireAdditionalLocation(record: OrganizationAdditionalLocation, nowValue: string): OrganizationAdditionalLocation {
  if (record.lifecycleStatus === "retired") return record;
  const now = timestamp(nowValue);
  return Object.freeze({ ...record, lifecycleStatus: "retired" as const, publicationStatus: "unpublished" as const,
    updatedAt: now, retiredAt: now });
}

export function projectPublicAdditionalLocation(record: OrganizationAdditionalLocation, geography: GeographyDefinition): PublicOrganizationAdditionalLocation | null {
  if (record.lifecycleStatus !== "active" || record.publicationStatus !== "published" || record.geographyId !== String(geography.id)) return null;
  const projected = projectPublicOrganizationLocation({
    id: organizationLocationId(String(record.organizationId)), organizationId: record.organizationId,
    sourceDraftId: organizationLocationDraftId(record.sourceDraftId), geographyId: geography.id,
    physicalAddress: record.physicalAddress, mailingAddress: null, isHomeOrPrivate: record.isHomeOrPrivate,
    visibility: record.visibility, coordinate: record.coordinate, geocodeQuality: record.geocodeQuality,
    geocodeProvenance: record.geocodeProvenance, confirmedByUserId: record.confirmedByUserId,
    confirmedByMembershipId: record.confirmedByMembershipId,
    confirmedAt: record.confirmedAt as OrganizationLocationTimestamp,
    updatedAt: record.updatedAt as OrganizationLocationTimestamp,
  }, geography);
  return Object.freeze({ id: record.id, organizationId: record.organizationId, label: record.label,
    geographyId: String(projected.geographyId), localityName: projected.localityName,
    visibility: projected.visibility, ...(projected.visibility !== "locality-only" ? { coordinate: projected.coordinate } : {}),
    ...(projected.visibility === "exact" ? { displayAddress: projected.displayAddress } : {}),
    relationship: "subordinate-location" as const });
}

export function projectOwnerAdditionalLocation(record: OrganizationAdditionalLocation, geography: GeographyDefinition): PublicOrganizationAdditionalLocation | null {
  if (record.lifecycleStatus !== "active") return null;
  return projectPublicAdditionalLocation(
    Object.freeze({ ...record, publicationStatus: "published" as const }),
    geography,
  );
}
