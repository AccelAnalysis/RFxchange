import type { PublicOrganizationLocation } from "../organization-location/model.ts";
import type {
  OrganizationId,
  OrganizationProfile,
  OrganizationProfileId,
} from "../organizations/model.ts";
import { isoTimestamp, organizationId, organizationProfileId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";
import { organizationMembershipId, userId } from "../users/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type OrganizationCapabilityId = Brand<string, "OrganizationCapabilityId">;
export type OrganizationProfileCompletionId =
  Brand<string, "OrganizationProfileCompletionId">;
export type OrganizationProfileEventId = Brand<string, "OrganizationProfileEventId">;

export const ORGANIZATION_TYPES = [
  "for-profit-business",
  "government-entity",
  "nonprofit-organization",
  "educational-institution",
  "other",
] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const ORGANIZATION_PARTICIPATION_ROLES = [
  "business",
  "supplier",
  "buyer",
  "issuer",
  "government",
  "edo",
  "resource-provider",
  "chamber",
  "lender",
  "university",
  "nonprofit",
  "other",
] as const;
export type OrganizationParticipationRole =
  (typeof ORGANIZATION_PARTICIPATION_ROLES)[number];

export const ORGANIZATION_BUSINESS_OBJECTIVES = [
  "find-opportunities",
  "issue-opportunities",
  "find-customers",
  "find-suppliers",
  "find-teammates",
  "send-receive-referrals",
  "find-resources-support",
  "explore-local-network",
] as const;
export type OrganizationBusinessObjective =
  (typeof ORGANIZATION_BUSINESS_OBJECTIVES)[number];

export const ORGANIZATION_CAPABILITY_KINDS = [
  "service",
  "product",
  "function",
  "buying-need",
  "resource-provider-function",
] as const;
export type OrganizationCapabilityKind =
  (typeof ORGANIZATION_CAPABILITY_KINDS)[number];

export interface OrganizationWebsite {
  readonly disposition: "available" | "not-applicable";
  readonly url: string | null;
  readonly explanation: string | null;
}

export interface OrganizationMainContact {
  readonly displayName: string;
  readonly roleTitle: string;
  readonly email: string;
  readonly phone: string | null;
  readonly publiclyVisible: boolean;
}

export interface OrganizationCapability {
  readonly id: OrganizationCapabilityId;
  readonly kind: OrganizationCapabilityKind;
  readonly name: string;
  readonly description: string;
}

/**
 * Enriches the existing durable OrganizationProfile identity. This is persisted back to the
 * existing organizationProfiles document rather than creating a parallel profile identity.
 */
export interface EssentialOrganizationProfile extends OrganizationProfile {
  readonly organizationType: OrganizationType | null;
  readonly website: OrganizationWebsite | null;
  readonly mainContact: OrganizationMainContact | null;
  readonly capabilities: readonly OrganizationCapability[];
  readonly participationRoles: readonly OrganizationParticipationRole[];
  readonly businessObjectives: readonly OrganizationBusinessObjective[];
}

export const PROFILE_COMPLETION_REQUIREMENTS = [
  "minimum-identity",
  "organization-type",
  "website-disposition",
  "main-contact",
  "meaningful-capability",
  "service-geography",
  "participation-role",
  "location-visibility",
  "confirmed-primary-location",
] as const;
export type ProfileCompletionRequirement =
  (typeof PROFILE_COMPLETION_REQUIREMENTS)[number];

export interface OrganizationProfileCompletion {
  /** Stable singleton identity equals organizationId. */
  readonly id: OrganizationProfileCompletionId;
  readonly organizationId: OrganizationId;
  readonly profileId: OrganizationProfileId;
  readonly credentialFamily: "active";
  readonly credentialKey: "profile-complete";
  readonly status: "active" | "inactive";
  readonly missingRequirements: readonly ProfileCompletionRequirement[];
  readonly sourceProfileUpdatedAt: string;
  readonly sourceLocationUpdatedAt: string | null;
  readonly sourceServiceGeographyUpdatedAt: string | null;
  readonly firstActivatedAt: string | null;
  readonly lastTransitionAt: string;
  readonly evaluatedAt: string;
}

export interface OrganizationProfileEvent {
  readonly id: OrganizationProfileEventId;
  readonly organizationId: OrganizationId;
  readonly profileId: OrganizationProfileId;
  readonly actor: Readonly<{
    readonly userId: UserId;
    readonly membershipId: OrganizationMembershipId;
  }>;
  readonly kind: "essential-profile-updated" | "profile-completion-recalculated";
  readonly priorCompletionStatus: "active" | "inactive" | null;
  readonly newCompletionStatus: "active" | "inactive";
  readonly missingRequirements: readonly ProfileCompletionRequirement[];
  readonly reason: string;
  readonly occurredAt: string;
}

export interface PublicEssentialOrganizationProfile {
  readonly organizationId: OrganizationId;
  readonly profileId: OrganizationProfileId;
  readonly displayName: string;
  readonly organizationType: OrganizationType;
  readonly website: string | null;
  readonly mainContact: OrganizationMainContact | null;
  readonly capabilities: readonly OrganizationCapability[];
  readonly participationRoles: readonly OrganizationParticipationRole[];
  readonly businessObjectives: readonly OrganizationBusinessObjective[];
  readonly location: PublicOrganizationLocation;
  readonly profileComplete: boolean;
}

const GENERIC_CAPABILITY_NAMES = new Set([
  "business services",
  "consulting",
  "general services",
  "other",
  "products",
  "services",
  "solutions",
]);

function required(value: string, label: string, maximum = 240): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximum) throw new Error(`${label} exceeds ${maximum} characters.`);
  return normalized;
}

function optional(value: string | null | undefined, label: string, maximum = 240): string | null {
  if (value == null || !value.trim()) return null;
  return required(value, label, maximum);
}

function stableId<T extends string>(value: string, label: string): T {
  const normalized = required(value, label, 191);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/.test(normalized)) {
    throw new Error(`${label} must be a stable identifier.`);
  }
  return normalized as T;
}

function oneOf<T extends string>(
  value: string,
  values: readonly T[],
  label: string,
): T {
  if (!values.includes(value as T)) throw new Error(`Unsupported ${label}: ${value}.`);
  return value as T;
}

function uniqueValues<T extends string>(
  values: readonly string[],
  vocabulary: readonly T[],
  label: string,
): readonly T[] {
  return Object.freeze([
    ...new Set(values.map((value) => oneOf(value, vocabulary, label))),
  ]);
}

function boundedUrl(value: string): string {
  const normalized = required(value, "Organization website", 320);
  const parsed = new URL(normalized);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Organization website must use HTTP or HTTPS.");
  }
  parsed.hash = "";
  return parsed.toString();
}

function organizationWebsite(
  value: Readonly<{
    disposition: "available" | "not-applicable";
    url?: string | null;
    explanation?: string | null;
  }>,
): OrganizationWebsite {
  if (value.disposition === "available") {
    return Object.freeze({
      disposition: "available" as const,
      url: boundedUrl(value.url ?? ""),
      explanation: null,
    });
  }
  return Object.freeze({
    disposition: "not-applicable" as const,
    url: null,
    explanation: required(
      value.explanation ?? "",
      "Website not-applicable explanation",
      240,
    ),
  });
}

function organizationMainContact(
  value: Readonly<{
    displayName: string;
    roleTitle: string;
    email: string;
    phone?: string | null;
    publiclyVisible: boolean;
  }>,
): OrganizationMainContact {
  const email = required(value.email, "Organization contact email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Organization contact email is malformed.");
  }
  const phone = optional(value.phone, "Organization contact phone", 40);
  if (phone && !/^[+0-9().\-\s]{7,40}$/.test(phone)) {
    throw new Error("Organization contact phone is malformed.");
  }
  return Object.freeze({
    displayName: required(value.displayName, "Organization contact name", 160),
    roleTitle: required(value.roleTitle, "Organization contact role", 120),
    email,
    phone,
    publiclyVisible: value.publiclyVisible,
  });
}

export function organizationCapabilityId(value: string): OrganizationCapabilityId {
  return stableId<OrganizationCapabilityId>(value, "Organization capability id");
}

export function organizationProfileCompletionId(
  value: string,
): OrganizationProfileCompletionId {
  return stableId<OrganizationProfileCompletionId>(
    value,
    "Organization profile completion id",
  );
}

export function organizationProfileEventId(value: string): OrganizationProfileEventId {
  return stableId<OrganizationProfileEventId>(value, "Organization profile event id");
}

export function createOrganizationCapability(input: Readonly<{
  id: string;
  kind: string;
  name: string;
  description: string;
}>): OrganizationCapability {
  const name = required(input.name, "Organization capability name", 120);
  if (GENERIC_CAPABILITY_NAMES.has(name.toLowerCase())) {
    throw new Error("Organization capability must be specific and meaningful.");
  }
  const description = required(input.description, "Organization capability description", 600);
  if (description.length < 20) {
    throw new Error("Organization capability description must contain at least 20 characters.");
  }
  return Object.freeze({
    id: organizationCapabilityId(input.id),
    kind: oneOf(input.kind, ORGANIZATION_CAPABILITY_KINDS, "capability kind"),
    name,
    description,
  });
}

export function hydrateEssentialOrganizationProfile(
  profile: OrganizationProfile,
): EssentialOrganizationProfile {
  const existing = profile as Partial<EssentialOrganizationProfile>;
  return Object.freeze({
    ...profile,
    id: organizationProfileId(profile.id),
    organizationId: organizationId(profile.organizationId),
    organizationType:
      existing.organizationType &&
      ORGANIZATION_TYPES.includes(existing.organizationType)
        ? existing.organizationType
        : null,
    website: existing.website ?? null,
    mainContact: existing.mainContact ?? null,
    capabilities: Object.freeze([...(existing.capabilities ?? [])]),
    participationRoles: Object.freeze([...(existing.participationRoles ?? [])]),
    businessObjectives: Object.freeze([...(existing.businessObjectives ?? [])]),
  });
}

export function updateEssentialOrganizationProfile(
  profile: OrganizationProfile,
  input: Readonly<{
    displayName: string;
    organizationType: string;
    website: Readonly<{
      disposition: "available" | "not-applicable";
      url?: string | null;
      explanation?: string | null;
    }>;
    mainContact: Readonly<{
      displayName: string;
      roleTitle: string;
      email: string;
      phone?: string | null;
      publiclyVisible: boolean;
    }>;
    capabilities: readonly OrganizationCapability[];
    participationRoles: readonly string[];
    businessObjectives: readonly string[];
    now: string;
  }>,
): EssentialOrganizationProfile {
  if (input.capabilities.length > 20) {
    throw new Error("Organization profile supports at most 20 essential capabilities.");
  }
  const capabilityIds = new Set(input.capabilities.map((capability) => capability.id));
  if (capabilityIds.size !== input.capabilities.length) {
    throw new Error("Organization capability identities must be unique.");
  }
  const participationRoles = uniqueValues(
    input.participationRoles,
    ORGANIZATION_PARTICIPATION_ROLES,
    "organization participation role",
  );
  const businessObjectives = uniqueValues(
    input.businessObjectives,
    ORGANIZATION_BUSINESS_OBJECTIVES,
    "organization business objective",
  );
  return Object.freeze({
    ...hydrateEssentialOrganizationProfile(profile),
    displayName: required(input.displayName, "Organization display name", 180),
    organizationType: oneOf(
      input.organizationType,
      ORGANIZATION_TYPES,
      "organization type",
    ),
    website: organizationWebsite(input.website),
    mainContact: organizationMainContact(input.mainContact),
    capabilities: Object.freeze([...input.capabilities]),
    participationRoles,
    businessObjectives,
    updatedAt: isoTimestamp(input.now),
  });
}

export function evaluateOrganizationProfileCompletion(input: Readonly<{
  profile: EssentialOrganizationProfile;
  location: Readonly<{
    updatedAt: string;
    visibility: string;
  }> | null;
  serviceGeographies: Readonly<{
    serviceGeographyIds: readonly string[];
    updatedAt: string;
  }> | null;
  prior?: OrganizationProfileCompletion | null;
  now: string;
}>): OrganizationProfileCompletion {
  const missing: ProfileCompletionRequirement[] = [];
  if (!input.profile.displayName.trim()) missing.push("minimum-identity");
  if (!input.profile.organizationType) missing.push("organization-type");
  if (!input.profile.website) missing.push("website-disposition");
  if (!input.profile.mainContact) missing.push("main-contact");
  if (input.profile.capabilities.length === 0) missing.push("meaningful-capability");
  if (!input.serviceGeographies?.serviceGeographyIds.length) {
    missing.push("service-geography");
  }
  if (input.profile.participationRoles.length === 0) missing.push("participation-role");
  if (
    !input.location ||
    !["exact", "approximate", "locality-only"].includes(input.location.visibility)
  ) {
    missing.push("location-visibility");
  }
  if (!input.location) missing.push("confirmed-primary-location");

  const now = isoTimestamp(input.now);
  const status = missing.length === 0 ? "active" as const : "inactive" as const;
  const priorStatus = input.prior?.status ?? null;
  return Object.freeze({
    id: organizationProfileCompletionId(input.profile.organizationId),
    organizationId: input.profile.organizationId,
    profileId: input.profile.id,
    credentialFamily: "active" as const,
    credentialKey: "profile-complete" as const,
    status,
    missingRequirements: Object.freeze(missing),
    sourceProfileUpdatedAt: input.profile.updatedAt,
    sourceLocationUpdatedAt: input.location?.updatedAt ?? null,
    sourceServiceGeographyUpdatedAt: input.serviceGeographies?.updatedAt ?? null,
    firstActivatedAt:
      input.prior?.firstActivatedAt ?? (status === "active" ? now : null),
    lastTransitionAt:
      priorStatus === status && input.prior ? input.prior.lastTransitionAt : now,
    evaluatedAt: now,
  });
}

export function createOrganizationProfileEvent(input: Readonly<{
  id: string;
  profile: EssentialOrganizationProfile;
  userId: string;
  membershipId: string;
  kind: OrganizationProfileEvent["kind"];
  priorCompletionStatus?: "active" | "inactive" | null;
  completion: OrganizationProfileCompletion;
  reason: string;
  now: string;
}>): OrganizationProfileEvent {
  return Object.freeze({
    id: organizationProfileEventId(input.id),
    organizationId: input.profile.organizationId,
    profileId: input.profile.id,
    actor: Object.freeze({
      userId: userId(input.userId),
      membershipId: organizationMembershipId(input.membershipId),
    }),
    kind: input.kind,
    priorCompletionStatus: input.priorCompletionStatus ?? null,
    newCompletionStatus: input.completion.status,
    missingRequirements: input.completion.missingRequirements,
    reason: required(input.reason, "Organization profile event reason", 600),
    occurredAt: isoTimestamp(input.now),
  });
}

export function projectPublicEssentialOrganizationProfile(input: Readonly<{
  profile: EssentialOrganizationProfile;
  completion: OrganizationProfileCompletion;
  location: PublicOrganizationLocation;
}>): PublicEssentialOrganizationProfile {
  if (
    input.profile.organizationId !== input.completion.organizationId ||
    input.profile.organizationId !== input.location.organizationId
  ) {
    throw new Error("Public profile inputs belong to different organizations.");
  }
  if (!input.profile.organizationType) {
    throw new Error("Public essential profile requires an organization type.");
  }
  return Object.freeze({
    organizationId: input.profile.organizationId,
    profileId: input.profile.id,
    displayName: input.profile.displayName,
    organizationType: input.profile.organizationType,
    website:
      input.profile.website?.disposition === "available"
        ? input.profile.website.url
        : null,
    mainContact:
      input.profile.mainContact?.publiclyVisible
        ? input.profile.mainContact
        : null,
    capabilities: input.profile.capabilities,
    participationRoles: input.profile.participationRoles,
    businessObjectives: input.profile.businessObjectives,
    location: input.location,
    profileComplete: input.completion.status === "active",
  });
}
