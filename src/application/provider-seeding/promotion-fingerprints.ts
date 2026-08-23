import { createHash } from "node:crypto";

import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import type { OrganizationMatchCandidate } from "../../domain/organization-resolution/model.ts";
import type { LocationProfileMaterializationPacket } from "../../domain/geography-fabric/resolver.ts";
import type {
  ProviderCanonicalComparison,
  ProviderPromotionApproval,
  ProviderPromotionCommand,
  ProviderSeedPromotionCandidate,
} from "../../domain/provider-seeding/promotion.ts";
import type {
  ProviderPromotionPlanSnapshot,
  ProviderPromotionSourceRecord,
} from "../../domain/provider-seeding/promotion-runtime.ts";

type JsonScalar = string | number | boolean | null;
type StableValue = JsonScalar | readonly StableValue[] | Readonly<Record<string, StableValue>>;

function stableValue(value: unknown): StableValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Fingerprint input cannot contain non-finite numbers.");
    return value;
  }
  if (Array.isArray(value)) return Object.freeze(value.map(stableValue));
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Readonly<Record<string, unknown>>)
      .filter(([, nested]) => nested !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, stableValue(nested)] as const);
    return Object.freeze(Object.fromEntries(entries));
  }
  throw new Error(`Unsupported fingerprint input type: ${typeof value}.`);
}

export function providerPromotionFingerprint(value: unknown): string {
  const canonical = JSON.stringify(stableValue(value));
  return `sha256:${createHash("sha256").update(canonical).digest("hex")}`;
}

export function providerSourcePlanFingerprint(plan: ProviderPromotionPlanSnapshot): string {
  return providerPromotionFingerprint(plan);
}

function sourceRecordFacts(source: ProviderPromotionSourceRecord) {
  return Object.freeze({
    id: source.id,
    candidateId: source.candidateId,
    seedKey: source.seedKey,
    displayName: source.displayName,
    serviceSummary: source.serviceSummary,
    serviceAreaLabels: Object.freeze([...source.serviceAreaLabels].sort()),
    primarySourceId: source.primarySourceId,
    website: source.website,
    aliases: Object.freeze([...source.aliases].sort()),
    acceptedLocation: source.acceptedLocation,
    sourcePlan: source.sourcePlan,
    sourcePlanFingerprint: source.sourcePlanFingerprint,
  });
}

function candidateSourceFacts(candidate: ProviderSeedPromotionCandidate) {
  return Object.freeze({
    id: candidate.id,
    marketKey: candidate.marketKey,
    seedKey: candidate.seedKey,
    displayName: candidate.displayName,
    providerClass: candidate.providerClass,
    participationPolicy: candidate.participationPolicy,
    providerType: candidate.providerType,
    resourceCategory: candidate.resourceCategory,
    serviceName: candidate.serviceName,
    website: candidate.website,
    aliases: Object.freeze([...candidate.aliases].sort()),
    primarySourceId: candidate.primarySourceId,
    disposition: candidate.disposition,
    acceptedLocationKey: candidate.acceptedLocationKey,
    acceptedPointFingerprint: candidate.acceptedPointFingerprint,
    sourcePlanFingerprint: candidate.sourcePlanFingerprint,
    donorRepository: candidate.donorRepository,
    donorCommit: candidate.donorCommit,
  });
}

export function providerSourceRecordFingerprint(
  candidate: ProviderSeedPromotionCandidate,
  source: ProviderPromotionSourceRecord,
): string {
  return providerPromotionFingerprint(Object.freeze({
    candidate: candidateSourceFacts(candidate),
    source: sourceRecordFacts(source),
  }));
}

export function providerGeographyProfileFingerprint(
  packet: LocationProfileMaterializationPacket,
): string {
  const { organizationId: _profileOrganizationId, ...profile } = packet.profile;
  void _profileOrganizationId;
  const memberships = packet.memberships.map((membership) => {
    const { organizationId: _membershipOrganizationId, ...rest } = membership;
    void _membershipOrganizationId;
    return rest;
  });
  return providerPromotionFingerprint(Object.freeze({
    datasetSources: [...packet.datasetSources].sort((a, b) => String(a.id).localeCompare(String(b.id))),
    geographies: [...packet.geographies].sort((a, b) => String(a.id).localeCompare(String(b.id))),
    versions: [...packet.versions].sort((a, b) => String(a.id).localeCompare(String(b.id))),
    profile,
    memberships: memberships.sort((a, b) => String(a.id).localeCompare(String(b.id))),
  }));
}

export function providerCanonicalSearchFingerprint(
  matches: readonly OrganizationMatchCandidate[],
): string {
  return providerPromotionFingerprint(
    [...matches]
      .sort((left, right) => String(left.organizationId).localeCompare(String(right.organizationId)))
      .map((match) => Object.freeze({
        organizationId: match.organizationId,
        profileId: match.profileId,
        displayName: match.displayName,
        origin: match.origin,
        classification: match.classification,
        score: match.score,
        evidence: [...match.evidence].sort((left, right) =>
          `${left.kind}:${left.strength}:${left.score}`.localeCompare(
            `${right.kind}:${right.strength}:${right.score}`,
          )),
        publicCategories: Object.freeze([...match.publicCategories].sort()),
        publicGeographyId: match.publicGeographyId ?? null,
        publicLocality: match.publicLocality ?? null,
        publicRegion: match.publicRegion ?? null,
      })),
  );
}

export function providerComparisonFingerprint(
  comparison: ProviderCanonicalComparison,
): string {
  return providerPromotionFingerprint(Object.freeze({
    id: comparison.id,
    candidateId: comparison.candidateId,
    candidateRecordFingerprint: comparison.candidateRecordFingerprint,
    geographyProfileFingerprint: comparison.geographyProfileFingerprint,
    canonicalSearchFingerprint: comparison.canonicalSearchFingerprint,
    matches: [...comparison.matches]
      .sort((left, right) => left.organizationId.localeCompare(right.organizationId))
      .map((match) => Object.freeze({
        ...match,
        basis: Object.freeze([...match.basis].sort()),
      })),
    outcome: comparison.outcome,
    selectedOrganizationId: comparison.selectedOrganizationId,
    rationale: comparison.rationale,
    reviewedByAdministratorId: comparison.reviewedByAdministratorId,
    authorityContextId: comparison.authorityContextId,
    reviewedAt: comparison.reviewedAt,
  }));
}

export function providerApprovalFingerprint(approval: ProviderPromotionApproval): string {
  return providerPromotionFingerprint(approval);
}

export function providerPromotionRequestFingerprint(command: ProviderPromotionCommand): string {
  return providerPromotionFingerprint(Object.freeze({
    id: command.id,
    action: command.action,
    marketKey: command.marketKey,
    candidateId: command.candidateId,
    comparisonId: command.comparisonId,
    approvalId: command.approvalId,
    targetOrganizationMode: command.targetOrganizationMode,
    targetOrganizationId: command.targetOrganizationId,
    targetLocationId: command.targetLocationId,
    targetProviderResourceId: command.targetProviderResourceId,
    geographyProfileId: command.geographyProfileId,
    candidateRecordFingerprint: command.candidateRecordFingerprint,
    geographyProfileFingerprint: command.geographyProfileFingerprint,
    comparisonFingerprint: command.comparisonFingerprint,
    approvalFingerprint: command.approvalFingerprint,
    publishProviderDiscovery: command.publishProviderDiscovery,
    publishResource: command.publishResource,
    actorAdministratorId: command.actorAdministratorId,
    authorityContextId: command.authorityContextId,
  }));
}

export function providerPromotionAuthorityContextFingerprint(
  context: PlatformAdministratorAuthorityContext,
): string {
  return providerPromotionFingerprint(Object.freeze({
    administratorId: context.administratorId,
    rolePresetKeys: Object.freeze([...context.rolePresetKeys].sort()),
    effectivePermissions: Object.freeze([...context.effectivePermissions].sort()),
    scope: context.scope,
    conditions: context.conditions,
  }));
}
