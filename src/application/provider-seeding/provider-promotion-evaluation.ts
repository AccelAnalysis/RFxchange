import {
  assertAdministrativeActionAuthorized,
  createAdministrativeActionRequirement,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";
import type {
  OrganizationDiscoveryRecord,
  OrganizationIdentityInput,
  OrganizationMatchCandidate,
} from "../../domain/organization-resolution/model.ts";
import {
  createOrganizationDataProvenance,
  createOrganizationDiscoveryRecord,
} from "../../domain/organization-resolution/model.ts";
import { evaluateOrganizationCreationSafety } from "../../domain/organization-resolution/matching.ts";
import {
  createOrganizationAccount,
  createOrganizationProfile,
  type OrganizationAccount,
  type OrganizationProfile,
} from "../../domain/organizations/model.ts";
import type { LocationProfileMaterializationPacket } from "../../domain/geography-fabric/resolver.ts";
import {
  createProviderPromotionEvent,
  type ProviderPromotionCommand,
} from "../../domain/provider-seeding/promotion.ts";
import type {
  ProviderPromotionEvidenceBundle,
  ProviderPromotionPreview,
  ProviderPromotionReceipt,
  ProviderPromotionWriteRecord,
  SeededProviderClassification,
  SeededProviderLocation,
  SeededProviderResourceDraft,
} from "../../domain/provider-seeding/promotion-runtime.ts";
import {
  providerApprovalFingerprint,
  providerCanonicalSearchFingerprint,
  providerComparisonFingerprint,
  providerGeographyProfileFingerprint,
  providerPromotionAuthorityContextFingerprint,
  providerPromotionRequestFingerprint,
  providerSourcePlanFingerprint,
  providerSourceRecordFingerprint,
} from "./promotion-fingerprints.ts";

const PREVIEW_REQUIREMENT = createAdministrativeActionRequirement({
  permission: "provider.seed-promotion.preview",
  scope: "GLOBAL",
  conditions: "none",
});
const COMMIT_REQUIREMENT = createAdministrativeActionRequirement({
  permission: "provider.seed-promotion.commit",
  scope: "GLOBAL",
  conditions: "pre-resolved",
});

export interface ProviderPromotionTargetState {
  readonly account: OrganizationAccount | null;
  readonly profile: OrganizationProfile | null;
  readonly discovery: OrganizationDiscoveryRecord | null;
}

export interface EvaluatedProviderPromotion {
  readonly preview: ProviderPromotionPreview;
  readonly account: OrganizationAccount | null;
  readonly profile: OrganizationProfile | null;
  readonly discovery: OrganizationDiscoveryRecord | null;
  readonly seededLocation: SeededProviderLocation;
  readonly classification: SeededProviderClassification;
  readonly resourceDraft: SeededProviderResourceDraft;
  readonly geographyPacket: LocationProfileMaterializationPacket;
  readonly event: ReturnType<typeof createProviderPromotionEvent>;
  readonly receipt: ProviderPromotionReceipt;
}

function fail(message: string): never {
  throw new Error(`Provider seed promotion rejected: ${message}`);
}

function safeDomain(value: string | null): string | undefined {
  if (!value) return undefined;
  const parsed = new URL(value);
  return parsed.hostname.replace(/^www\./, "");
}

function organizationIdentity(input: ProviderPromotionEvidenceBundle): OrganizationIdentityInput {
  const source = input.source;
  return Object.freeze({
    displayName: source.displayName,
    aliases: source.aliases,
    categories: Object.freeze([
      input.candidate.providerType,
      input.candidate.resourceCategory,
    ]),
    address: Object.freeze({
      line1: source.acceptedLocation.addressLine1,
      locality: source.acceptedLocation.locality,
      region: source.acceptedLocation.regionCode,
      postalCode: source.acceptedLocation.postalCode,
      countryCode: source.acceptedLocation.countryCode,
    }),
    ...(source.website ? { domain: safeDomain(source.website) } : {}),
  });
}

function reboundGeographyPacket(
  packet: LocationProfileMaterializationPacket,
  organizationId: string,
): LocationProfileMaterializationPacket {
  const profile = Object.freeze({ ...packet.profile, organizationId });
  const memberships = Object.freeze(
    packet.memberships.map((membership) => Object.freeze({ ...membership, organizationId })),
  );
  const command = Object.freeze({ ...packet.command, organizationId });
  const event = Object.freeze({ ...packet.event, organizationId });
  return Object.freeze({
    datasetSources: packet.datasetSources,
    geographies: packet.geographies,
    versions: packet.versions,
    profile,
    memberships,
    command,
    event,
  });
}

function assertEvidenceBindings(
  evidence: ProviderPromotionEvidenceBundle,
  command: ProviderPromotionCommand,
  currentMatches: readonly OrganizationMatchCandidate[],
  authority: PlatformAdministratorAuthorityContext,
): void {
  const { candidate, source, geography, comparison, approval } = evidence;
  if (
    candidate.id !== command.candidateId
    || source.candidateId !== candidate.id
    || geography.candidateId !== candidate.id
    || comparison.candidateId !== candidate.id
    || approval.candidateId !== candidate.id
    || comparison.id !== command.comparisonId
    || approval.id !== command.approvalId
    || approval.comparisonId !== comparison.id
  ) fail("command and staged evidence identities do not agree.");
  if (candidate.disposition !== "ready_for_canonical_comparison") {
    fail("only an ordinary accepted candidate may be committed; identity-review and unresolved candidates remain held.");
  }
  if (candidate.geographyEnrichmentStatus !== "ready_for_profile_materialization") {
    fail("candidate geography is not materialization-ready.");
  }
  if (
    source.seedKey !== candidate.seedKey
    || source.primarySourceId !== candidate.primarySourceId
    || source.acceptedLocation.locationKey !== candidate.acceptedLocationKey
    || source.acceptedLocation.acceptedPointFingerprint !== candidate.acceptedPointFingerprint
  ) fail("current source record no longer agrees with the approved candidate.");

  const planFingerprint = providerSourcePlanFingerprint(source.sourcePlan);
  if (
    planFingerprint !== source.sourcePlanFingerprint
    || planFingerprint !== candidate.sourcePlanFingerprint
  ) fail("source-plan evidence is stale.");
  const recordFingerprint = providerSourceRecordFingerprint(candidate, source);
  if (
    recordFingerprint !== source.sourceRecordFingerprint
    || recordFingerprint !== candidate.sourceRecordFingerprint
    || recordFingerprint !== geography.sourceRecordFingerprint
    || recordFingerprint !== comparison.candidateRecordFingerprint
    || recordFingerprint !== approval.candidateRecordFingerprint
    || recordFingerprint !== command.candidateRecordFingerprint
  ) fail("source-record evidence is stale.");
  const geographyFingerprint = providerGeographyProfileFingerprint(geography.packet);
  if (
    geographyFingerprint !== geography.geographyProfileFingerprint
    || geographyFingerprint !== candidate.geographyProfileFingerprint
    || geographyFingerprint !== comparison.geographyProfileFingerprint
    || geographyFingerprint !== approval.geographyProfileFingerprint
    || geographyFingerprint !== command.geographyProfileFingerprint
  ) fail("geography evidence is stale.");
  const searchFingerprint = providerCanonicalSearchFingerprint(currentMatches);
  if (searchFingerprint !== comparison.canonicalSearchFingerprint) {
    fail("canonical Organization search changed after review.");
  }
  const comparisonFingerprint = providerComparisonFingerprint(comparison);
  if (
    comparisonFingerprint !== comparison.comparisonFingerprint
    || comparisonFingerprint !== approval.comparisonFingerprint
    || comparisonFingerprint !== command.comparisonFingerprint
  ) fail("canonical comparison evidence is stale.");
  if (providerApprovalFingerprint(approval) !== command.approvalFingerprint) {
    fail("promotion approval evidence is stale.");
  }
  if (providerPromotionRequestFingerprint(command) !== command.requestFingerprint) {
    fail("promotion command request fingerprint is invalid.");
  }
  const authorityFingerprint = providerPromotionAuthorityContextFingerprint(authority);
  if (
    String(authority.administratorId) !== command.actorAdministratorId
    || authorityFingerprint !== approval.authorityContextId
    || authorityFingerprint !== comparison.authorityContextId
    || authorityFingerprint !== command.authorityContextId
    || approval.approvedByAdministratorId !== command.actorAdministratorId
  ) fail("current administrator authority context differs from the reviewed approval.");
  if (approval.state !== "approved") fail("promotion approval is not approved.");
  if (
    approval.targetOrganizationMode !== command.targetOrganizationMode
    || approval.targetOrganizationId !== command.targetOrganizationId
  ) fail("promotion target differs from the approved target.");
  if (command.publishProviderDiscovery || command.publishResource) {
    fail("seed promotion may not publish provider discovery or a Resource.");
  }
  if (
    String(geography.packet.profile.id) !== command.geographyProfileId
    || geography.packet.profile.locationId !== command.targetLocationId
    || command.geographyProfileId !== command.targetLocationId
  ) fail("promotion target location does not match the prepared Geography Fabric profile.");
  if (
    geography.packet.profile.acceptedPointFingerprint
      !== source.acceptedLocation.acceptedPointFingerprint
  ) fail("prepared Geography Fabric point differs from the approved source location.");
}

function assertTargetState(
  evidence: ProviderPromotionEvidenceBundle,
  command: ProviderPromotionCommand,
  currentMatches: readonly OrganizationMatchCandidate[],
  target: ProviderPromotionTargetState,
): void {
  if (command.targetOrganizationMode === "create") {
    const reviewedIds = evidence.comparison.matches.map((match) => match.organizationId as never);
    const creationSafety = evaluateOrganizationCreationSafety(currentMatches, reviewedIds);
    if (!creationSafety.allowed) {
      fail(`new Organization creation is blocked by ${creationSafety.reason}.`);
    }
    if (target.account || target.profile || target.discovery) {
      fail("reserved new Organization target is already occupied.");
    }
    if (evidence.comparison.outcome !== "create-new-organization") {
      fail("new Organization command does not match comparison outcome.");
    }
    return;
  }
  if (
    evidence.comparison.outcome !== "attach-to-existing-organization"
    || evidence.comparison.selectedOrganizationId !== command.targetOrganizationId
  ) fail("existing Organization command does not match the reviewed selected Organization.");
  if (!target.account || !target.profile || !target.discovery) {
    fail("selected existing Organization is no longer complete.");
  }
  if (
    String(target.account.id) !== command.targetOrganizationId
    || String(target.profile.organizationId) !== command.targetOrganizationId
    || String(target.discovery.organizationId) !== command.targetOrganizationId
    || String(target.discovery.profileId) !== String(target.profile.id)
  ) fail("selected existing Organization identity links no longer agree.");
  const current = currentMatches.find(
    (match) => String(match.organizationId) === command.targetOrganizationId,
  );
  if (!current || current.displayName !== target.profile.displayName) {
    fail("selected existing Organization is no longer a current canonical match.");
  }
}

function writePlan(
  command: ProviderPromotionCommand,
  createdOrganization: boolean,
  profileId: string | null,
  discoveryId: string | null,
): readonly ProviderPromotionWriteRecord[] {
  return Object.freeze([
    Object.freeze({
      kind: createdOrganization ? "organization-created" as const : "organization-attached" as const,
      id: command.targetOrganizationId,
    }),
    ...(profileId ? [Object.freeze({ kind: "organization-profile-created" as const, id: profileId })] : []),
    ...(discoveryId ? [Object.freeze({ kind: "organization-discovery-created" as const, id: discoveryId })] : []),
    Object.freeze({ kind: "seeded-location-created" as const, id: command.targetLocationId }),
    Object.freeze({ kind: "geography-profile-materialized" as const, id: command.geographyProfileId }),
    Object.freeze({ kind: "provider-classification-created" as const, id: command.targetOrganizationId }),
    Object.freeze({ kind: "resource-draft-created" as const, id: command.targetProviderResourceId }),
    Object.freeze({ kind: "promotion-command-recorded" as const, id: command.id }),
    Object.freeze({ kind: "promotion-event-recorded" as const, id: `${command.id}:event` }),
  ]);
}

export function evaluateProviderPromotion(input: Readonly<{
  evidence: ProviderPromotionEvidenceBundle;
  command: ProviderPromotionCommand;
  authority: PlatformAdministratorAuthorityContext;
  currentMatches: readonly OrganizationMatchCandidate[];
  target: ProviderPromotionTargetState;
  now: string;
}>): EvaluatedProviderPromotion {
  const { evidence, command, authority, currentMatches, target } = input;
  const requirement = command.action === "commit-approved-provider-promotion"
    ? COMMIT_REQUIREMENT
    : PREVIEW_REQUIREMENT;
  assertAdministrativeActionAuthorized(authority, requirement);
  assertEvidenceBindings(evidence, command, currentMatches, authority);
  assertTargetState(evidence, command, currentMatches, target);

  const now = new Date(input.now).toISOString();
  let account: OrganizationAccount | null = null;
  let profile: OrganizationProfile | null = null;
  let discovery: OrganizationDiscoveryRecord | null = null;
  if (command.targetOrganizationMode === "create") {
    account = createOrganizationAccount({ id: command.targetOrganizationId, now });
    profile = createOrganizationProfile(account, {
      id: `provider-seed-profile:${command.targetOrganizationId}`,
      displayName: evidence.source.displayName,
      now,
    });
    const provenance = createOrganizationDataProvenance({
      kind: "seeded-public",
      sourceLabel: `${evidence.candidate.donorRepository} · ${evidence.source.primarySourceId}`,
      sourceRecordId: evidence.candidate.id,
      observedAt: evidence.source.preparedAt,
    });
    discovery = createOrganizationDiscoveryRecord(account, profile, {
      id: `provider-seed-discovery:${command.targetOrganizationId}`,
      origin: "seeded",
      identity: organizationIdentity(evidence),
      provenance,
      publicAddress: false,
      publicDomain: false,
      publicPhone: false,
      publicGovernmentIdentifiers: false,
      now,
    });
  }

  const sourceLocation = evidence.source.acceptedLocation;
  const seededLocation: SeededProviderLocation = Object.freeze({
    id: command.targetLocationId,
    organizationId: command.targetOrganizationId,
    candidateId: evidence.candidate.id,
    sourceLocationKey: sourceLocation.locationKey,
    addressLine1: sourceLocation.addressLine1,
    addressLine2: sourceLocation.addressLine2,
    locality: sourceLocation.locality,
    regionCode: sourceLocation.regionCode,
    postalCode: sourceLocation.postalCode,
    countryCode: sourceLocation.countryCode,
    matchedAddress: sourceLocation.matchedAddress,
    coordinate: sourceLocation.acceptedPoint,
    acceptedPointFingerprint: sourceLocation.acceptedPointFingerprint,
    geocodeProvider: sourceLocation.geocodeProvider,
    geocodeBenchmark: sourceLocation.geocodeBenchmark,
    geocodedAt: sourceLocation.geocodedAt,
    provenance: "source-backed-seed",
    participantConfirmed: false,
    publicProjection: "disabled",
    createdAt: now,
  });
  const classification: SeededProviderClassification = Object.freeze({
    id: command.targetOrganizationId,
    organizationId: command.targetOrganizationId,
    candidateId: evidence.candidate.id,
    providerClass: evidence.candidate.providerClass,
    participationPolicy: evidence.candidate.participationPolicy,
    providerType: evidence.candidate.providerType,
    resourceCategory: evidence.candidate.resourceCategory,
    claimState: "unclaimed",
    officialProviderStatus: "not-established",
    providerDiscovery: "disabled",
    sourceRecordFingerprint: evidence.candidate.sourceRecordFingerprint,
    createdAt: now,
  });
  const resourceDraft: SeededProviderResourceDraft = Object.freeze({
    id: command.targetProviderResourceId,
    organizationId: command.targetOrganizationId,
    candidateId: evidence.candidate.id,
    title: evidence.candidate.serviceName,
    summary: evidence.source.serviceSummary,
    resourceCategory: evidence.candidate.resourceCategory,
    serviceAreaLabels: evidence.source.serviceAreaLabels,
    sourceUrl: evidence.source.website,
    status: "draft",
    participantEditable: false,
    publication: "disabled",
    sourceRecordFingerprint: evidence.candidate.sourceRecordFingerprint,
    createdAt: now,
  });
  const geographyPacket = reboundGeographyPacket(
    evidence.geography.packet,
    command.targetOrganizationId,
  );
  const writes = writePlan(
    command,
    command.targetOrganizationMode === "create",
    profile ? String(profile.id) : null,
    discovery ? String(discovery.id) : null,
  );
  const preview: ProviderPromotionPreview = Object.freeze({
    mode: "preview",
    commandId: command.id,
    candidateId: evidence.candidate.id,
    targetOrganizationMode: command.targetOrganizationMode,
    targetOrganizationId: command.targetOrganizationId,
    targetLocationId: command.targetLocationId,
    targetProviderResourceId: command.targetProviderResourceId,
    geographyProfileId: command.geographyProfileId,
    writes,
    publishProviderDiscovery: false,
    publishResource: false,
    generatedAt: now,
  });
  const event = createProviderPromotionEvent({
    id: `${command.id}:event`,
    command,
    occurredAt: now,
  });
  const receipt: ProviderPromotionReceipt = Object.freeze({
    id: `${command.id}:receipt`,
    commandId: command.id,
    candidateId: evidence.candidate.id,
    targetOrganizationId: command.targetOrganizationId,
    targetOrganizationMode: command.targetOrganizationMode,
    targetLocationId: command.targetLocationId,
    targetProviderResourceId: command.targetProviderResourceId,
    geographyProfileId: command.geographyProfileId,
    requestFingerprint: command.requestFingerprint,
    writes,
    publishProviderDiscovery: false,
    publishResource: false,
    committedAt: now,
  });
  return Object.freeze({
    preview,
    account,
    profile,
    discovery,
    seededLocation,
    classification,
    resourceDraft,
    geographyPacket,
    event,
    receipt,
  });
}
