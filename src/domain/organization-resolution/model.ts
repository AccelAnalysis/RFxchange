import type {
  OrganizationAccount,
  OrganizationId,
  OrganizationProfile,
  OrganizationProfileId,
} from "../organizations/model.ts";
import { isoTimestamp, type IsoTimestamp } from "../organizations/model.ts";
import type { GeographyId } from "../geography/model.ts";
import type { AccessJourneyId } from "../lifecycle/model.ts";
import type { UserId } from "../users/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type OrganizationDiscoveryRecordId = Brand<
  string,
  "OrganizationDiscoveryRecordId"
>;
export type OrganizationResolutionId = Brand<string, "OrganizationResolutionId">;

export type OrganizationRecordOrigin =
  | "seeded"
  | "participant-created"
  | "organization-confirmed";

export type OrganizationDataProvenanceKind =
  | "seeded-public"
  | "participant-provided"
  | "organization-confirmed";

export interface OrganizationDataProvenance {
  readonly kind: OrganizationDataProvenanceKind;
  readonly sourceLabel: string;
  readonly sourceRecordId?: string;
  readonly observedAt: IsoTimestamp;
}

export interface OrganizationIdentityValue<T> {
  readonly value: T;
  /**
   * Public projections emit only values explicitly marked public. Resolution-only
   * signals may participate in server-side comparison but never public discovery.
   */
  readonly visibility: "public" | "resolution-only";
  readonly provenance: OrganizationDataProvenance;
}

export interface OrganizationAddressIdentity {
  readonly line1: string;
  readonly locality: string;
  readonly region: string;
  readonly postalCode?: string;
  readonly countryCode: string;
}

export interface OrganizationGovernmentIdentifier {
  readonly scheme: string;
  readonly jurisdiction: string;
  readonly value: string;
}

export interface OrganizationIdentityInput {
  readonly displayName: string;
  readonly aliases?: readonly string[];
  readonly categories?: readonly string[];
  readonly geographyId?: GeographyId;
  readonly address?: OrganizationAddressIdentity;
  readonly domain?: string;
  readonly phone?: string;
  readonly governmentIdentifiers?: readonly OrganizationGovernmentIdentifier[];
}

export interface OrganizationDiscoveryRecord {
  readonly id: OrganizationDiscoveryRecordId;
  readonly organizationId: OrganizationId;
  readonly profileId: OrganizationProfileId;
  readonly origin: OrganizationRecordOrigin;
  /**
   * Slice 2.3 records are discoverable/resolvable but confer no management
   * authority and make no Verification decision.
   */
  readonly authorityState: "unestablished";
  readonly verificationState: "not-evaluated";
  readonly displayName: OrganizationIdentityValue<string>;
  readonly aliases: readonly OrganizationIdentityValue<string>[];
  readonly categories: readonly OrganizationIdentityValue<string>[];
  readonly geographyId?: OrganizationIdentityValue<GeographyId>;
  readonly address?: OrganizationIdentityValue<OrganizationAddressIdentity>;
  readonly domain?: OrganizationIdentityValue<string>;
  readonly phone?: OrganizationIdentityValue<string>;
  readonly governmentIdentifiers: readonly OrganizationIdentityValue<OrganizationGovernmentIdentifier>[];
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export type OrganizationMatchSignalKind =
  | "government-identifier"
  | "domain"
  | "phone"
  | "address"
  | "display-name"
  | "alias"
  | "geography";

export interface OrganizationMatchEvidence {
  readonly kind: OrganizationMatchSignalKind;
  readonly strength: "definitive" | "strong" | "supporting";
  /** Safe explanation; raw resolution-only signal values are deliberately omitted. */
  readonly explanation: string;
  readonly score: number;
}

export type OrganizationMatchClassification =
  | "identity-conflict"
  | "likely-match"
  | "possible-match";

export interface OrganizationMatchCandidate {
  readonly organizationId: OrganizationId;
  readonly profileId: OrganizationProfileId;
  readonly displayName: string;
  readonly origin: OrganizationRecordOrigin;
  readonly classification: OrganizationMatchClassification;
  readonly score: number;
  readonly evidence: readonly OrganizationMatchEvidence[];
  readonly publicCategories: readonly string[];
  readonly publicGeographyId?: GeographyId;
  readonly publicLocality?: string;
  readonly publicRegion?: string;
  readonly claimAction: Readonly<{
    readonly label: "This is my organization";
    readonly organizationId: OrganizationId;
  }>;
}

export interface UnclaimedOrganizationPublicProfile {
  readonly organizationId: OrganizationId;
  readonly profileId: OrganizationProfileId;
  readonly displayName: string;
  readonly status: "Unclaimed";
  readonly provenanceLabel: string;
  readonly categories: readonly string[];
  readonly geographyId?: GeographyId;
  readonly locality?: string;
  readonly region?: string;
  readonly claimAction: Readonly<{
    readonly label: "Claim this organization";
    readonly organizationId: OrganizationId;
  }>;
}

export type OrganizationResolutionDisposition =
  | "existing-organization-selected"
  | "new-organization-created";

export interface OrganizationResolutionRecord {
  readonly id: OrganizationResolutionId;
  readonly userId: UserId;
  readonly accessJourneyId: AccessJourneyId;
  readonly organizationId: OrganizationId;
  readonly profileId: OrganizationProfileId;
  readonly disposition: OrganizationResolutionDisposition;
  readonly relationshipState: "authority-pending";
  readonly verificationState: "not-evaluated";
  readonly provisionalIdentity: OrganizationIdentityInput;
  readonly matchEvidence: readonly OrganizationMatchEvidence[];
  readonly decisionEvidence: Readonly<{
    readonly actor: "participant";
    readonly reason: string;
    readonly reviewedCandidateOrganizationIds: readonly OrganizationId[];
  }>;
  readonly createdAt: IsoTimestamp;
}

export interface OrganizationEntityKeyReservation {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly keyKind: "government-identifier" | "domain-and-phone";
  readonly canonicalValue: string;
  readonly createdAt: IsoTimestamp;
}

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function optionalRequiredValue(
  value: string | undefined,
  field: string,
): string | undefined {
  return value === undefined ? undefined : requiredValue(value, field);
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

export function organizationDiscoveryRecordId(
  value: string,
): OrganizationDiscoveryRecordId {
  return requiredValue(value, "Organization discovery record id") as OrganizationDiscoveryRecordId;
}

export function organizationResolutionId(value: string): OrganizationResolutionId {
  return requiredValue(value, "Organization resolution id") as OrganizationResolutionId;
}

export function normalizeOrganizationName(value: string): string {
  const normalized = requiredValue(value, "Organization name")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  return normalized.replace(
    /\s+(llc|l l c|inc|incorporated|corp|corporation|company|co|ltd|limited|pllc|lp)$/i,
    "",
  );
}

export function normalizeOrganizationDomain(value: string): string {
  const normalized = requiredValue(value, "Organization domain")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
  if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(normalized)) {
    throw new Error("Organization domain must be valid.");
  }
  return normalized;
}

export function normalizeOrganizationPhone(value: string): string {
  const normalized = requiredValue(value, "Organization phone").replace(/\D/g, "");
  const digits =
    normalized.length === 11 && normalized.startsWith("1")
      ? normalized.slice(1)
      : normalized;
  if (digits.length < 10 || digits.length > 15) {
    throw new Error("Organization phone must contain 10 to 15 digits.");
  }
  return digits;
}

export function normalizeGovernmentIdentifier(
  identifier: OrganizationGovernmentIdentifier,
): OrganizationGovernmentIdentifier {
  const value = requiredValue(identifier.value, "Government identifier")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (value.length < 4) throw new Error("Government identifier is too short.");
  return Object.freeze({
    scheme: requiredValue(identifier.scheme, "Government identifier scheme").toUpperCase(),
    jurisdiction: requiredValue(
      identifier.jurisdiction,
      "Government identifier jurisdiction",
    ).toUpperCase(),
    value,
  });
}

export function normalizeOrganizationAddress(
  address: OrganizationAddressIdentity,
): OrganizationAddressIdentity {
  const postalCode = optionalRequiredValue(address.postalCode, "Postal code");
  return Object.freeze({
    line1: requiredValue(address.line1, "Address line"),
    locality: requiredValue(address.locality, "Address locality"),
    region: requiredValue(address.region, "Address region").toUpperCase(),
    ...(postalCode ? { postalCode: postalCode.toUpperCase().replace(/\s+/g, "") } : {}),
    countryCode: requiredValue(address.countryCode, "Address country").toUpperCase(),
  });
}

export function normalizeOrganizationIdentity(
  input: OrganizationIdentityInput,
): OrganizationIdentityInput {
  const aliases = unique(
    (input.aliases ?? [])
      .map((alias) => requiredValue(alias, "Organization alias"))
      .filter((alias) => normalizeOrganizationName(alias) !== normalizeOrganizationName(input.displayName)),
  );
  const categories = unique(
    (input.categories ?? []).map((category) =>
      requiredValue(category, "Organization category"),
    ),
  );
  const governmentIdentifiers = unique(
    (input.governmentIdentifiers ?? []).map((identifier) =>
      JSON.stringify(normalizeGovernmentIdentifier(identifier)),
    ),
  ).map((value) => Object.freeze(JSON.parse(value)) as OrganizationGovernmentIdentifier);

  return Object.freeze({
    displayName: requiredValue(input.displayName, "Organization display name"),
    aliases: Object.freeze(aliases),
    categories: Object.freeze(categories),
    ...(input.geographyId ? { geographyId: input.geographyId } : {}),
    ...(input.address ? { address: normalizeOrganizationAddress(input.address) } : {}),
    ...(input.domain ? { domain: normalizeOrganizationDomain(input.domain) } : {}),
    ...(input.phone ? { phone: normalizeOrganizationPhone(input.phone) } : {}),
    governmentIdentifiers: Object.freeze(governmentIdentifiers),
  });
}

export function createOrganizationDataProvenance(
  input: Readonly<{
    kind: OrganizationDataProvenanceKind;
    sourceLabel: string;
    sourceRecordId?: string;
    observedAt: string;
  }>,
): OrganizationDataProvenance {
  return Object.freeze({
    kind: input.kind,
    sourceLabel: requiredValue(input.sourceLabel, "Organization data source"),
    ...(input.sourceRecordId
      ? { sourceRecordId: requiredValue(input.sourceRecordId, "Source record id") }
      : {}),
    observedAt: isoTimestamp(input.observedAt),
  });
}

function identityValue<T>(
  value: T,
  provenance: OrganizationDataProvenance,
  visibility: OrganizationIdentityValue<T>["visibility"],
): OrganizationIdentityValue<T> {
  return Object.freeze({ value, provenance, visibility });
}

export function createOrganizationDiscoveryRecord(
  account: OrganizationAccount,
  profile: OrganizationProfile,
  input: Readonly<{
    id: string;
    origin: OrganizationRecordOrigin;
    identity: OrganizationIdentityInput;
    provenance: OrganizationDataProvenance;
    publicAddress?: boolean;
    publicDomain?: boolean;
    publicPhone?: boolean;
    publicGovernmentIdentifiers?: boolean;
    now: string;
  }>,
): OrganizationDiscoveryRecord {
  if (profile.organizationId !== account.id) {
    throw new Error("Organization discovery profile belongs to another organization.");
  }
  const identity = normalizeOrganizationIdentity(input.identity);
  if (normalizeOrganizationName(identity.displayName) !== normalizeOrganizationName(profile.displayName)) {
    throw new Error("Discovery identity must match the canonical organization profile name.");
  }
  const now = isoTimestamp(input.now);
  return Object.freeze({
    id: organizationDiscoveryRecordId(input.id),
    organizationId: account.id,
    profileId: profile.id,
    origin: input.origin,
    authorityState: "unestablished" as const,
    verificationState: "not-evaluated" as const,
    displayName: identityValue(identity.displayName, input.provenance, "public"),
    aliases: Object.freeze(
      (identity.aliases ?? []).map((value) =>
        identityValue(value, input.provenance, "public"),
      ),
    ),
    categories: Object.freeze(
      (identity.categories ?? []).map((value) =>
        identityValue(value, input.provenance, "public"),
      ),
    ),
    ...(identity.geographyId
      ? { geographyId: identityValue(identity.geographyId, input.provenance, "public") }
      : {}),
    ...(identity.address
      ? {
          address: identityValue(
            identity.address,
            input.provenance,
            input.publicAddress ? "public" : "resolution-only",
          ),
        }
      : {}),
    ...(identity.domain
      ? {
          domain: identityValue(
            identity.domain,
            input.provenance,
            input.publicDomain ? "public" : "resolution-only",
          ),
        }
      : {}),
    ...(identity.phone
      ? {
          phone: identityValue(
            identity.phone,
            input.provenance,
            input.publicPhone ? "public" : "resolution-only",
          ),
        }
      : {}),
    governmentIdentifiers: Object.freeze(
      (identity.governmentIdentifiers ?? []).map((value) =>
        identityValue(
          value,
          input.provenance,
          input.publicGovernmentIdentifiers ? "public" : "resolution-only",
        ),
      ),
    ),
    createdAt: now,
    updatedAt: now,
  });
}

export function projectUnclaimedOrganizationProfile(
  record: OrganizationDiscoveryRecord,
): UnclaimedOrganizationPublicProfile {
  const address =
    record.address?.visibility === "public" ? record.address.value : undefined;
  return Object.freeze({
    organizationId: record.organizationId,
    profileId: record.profileId,
    displayName: record.displayName.value,
    status: "Unclaimed" as const,
    provenanceLabel: record.displayName.provenance.sourceLabel,
    categories: Object.freeze(
      record.categories
        .filter((category) => category.visibility === "public")
        .map((category) => category.value),
    ),
    ...(record.geographyId?.visibility === "public"
      ? { geographyId: record.geographyId.value }
      : {}),
    ...(address ? { locality: address.locality, region: address.region } : {}),
    claimAction: Object.freeze({
      label: "Claim this organization" as const,
      organizationId: record.organizationId,
    }),
  });
}

export function createOrganizationResolutionRecord(
  input: Readonly<{
    id: string;
    userId: UserId;
    accessJourneyId: AccessJourneyId;
    organizationId: OrganizationId;
    profileId: OrganizationProfileId;
    disposition: OrganizationResolutionDisposition;
    provisionalIdentity: OrganizationIdentityInput;
    matchEvidence?: readonly OrganizationMatchEvidence[];
    decisionReason: string;
    reviewedCandidateOrganizationIds?: readonly OrganizationId[];
    now: string;
  }>,
): OrganizationResolutionRecord {
  return Object.freeze({
    id: organizationResolutionId(input.id),
    userId: input.userId,
    accessJourneyId: input.accessJourneyId,
    organizationId: input.organizationId,
    profileId: input.profileId,
    disposition: input.disposition,
    relationshipState: "authority-pending" as const,
    verificationState: "not-evaluated" as const,
    provisionalIdentity: normalizeOrganizationIdentity(input.provisionalIdentity),
    matchEvidence: Object.freeze([...(input.matchEvidence ?? [])]),
    decisionEvidence: Object.freeze({
      actor: "participant" as const,
      reason: requiredValue(input.decisionReason, "Organization resolution decision reason"),
      reviewedCandidateOrganizationIds: Object.freeze([
        ...(input.reviewedCandidateOrganizationIds ?? []),
      ]),
    }),
    createdAt: isoTimestamp(input.now),
  });
}

export function strongOrganizationEntityKeys(
  identity: OrganizationIdentityInput,
): readonly Readonly<{
  kind: OrganizationEntityKeyReservation["keyKind"];
  canonicalValue: string;
}>[] {
  const normalized = normalizeOrganizationIdentity(identity);
  const governmentKeys = (normalized.governmentIdentifiers ?? []).map((identifier) =>
    Object.freeze({
      kind: "government-identifier" as const,
      canonicalValue: `${identifier.jurisdiction}:${identifier.scheme}:${identifier.value}`,
    }),
  );
  const contactKey =
    normalized.domain && normalized.phone
      ? [
          Object.freeze({
            kind: "domain-and-phone" as const,
            canonicalValue: `${normalized.domain}:${normalized.phone}`,
          }),
        ]
      : [];
  return Object.freeze([...governmentKeys, ...contactKey]);
}

export function createOrganizationEntityKeyReservation(
  input: Readonly<{
    id: string;
    organizationId: OrganizationId;
    keyKind: OrganizationEntityKeyReservation["keyKind"];
    canonicalValue: string;
    now: string;
  }>,
): OrganizationEntityKeyReservation {
  return Object.freeze({
    id: requiredValue(input.id, "Organization entity key reservation id"),
    organizationId: input.organizationId,
    keyKind: input.keyKind,
    canonicalValue: requiredValue(input.canonicalValue, "Canonical organization entity key"),
    createdAt: isoTimestamp(input.now),
  });
}
