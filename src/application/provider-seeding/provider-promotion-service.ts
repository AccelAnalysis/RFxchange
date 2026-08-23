import {
  assertAdministrativeActionAuthorized,
  createAdministrativeActionRequirement,
  platformAdministratorId,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";
import type { PlatformAdministratorAuthorityContextRepository } from "../../domain/admin-authorization/repository.ts";
import {
  createOrganizationAccount,
  createOrganizationProfile,
  organizationId,
  type OrganizationAccount,
  type OrganizationProfile,
} from "../../domain/organizations/model.ts";
import type {
  OrganizationAccountRepository,
  OrganizationProfileRepository,
} from "../../domain/organizations/repository.ts";
import {
  createOrganizationDataProvenance,
  createOrganizationDiscoveryRecord,
  normalizeOrganizationName,
  type OrganizationDiscoveryRecord,
} from "../../domain/organization-resolution/model.ts";
import type { OrganizationDiscoveryRepository } from "../../domain/organization-resolution/repository.ts";
import {
  createProviderPromotionEvent,
  type ProviderCanonicalMatchEvidence,
  type ProviderPromotionCommand,
} from "../../domain/provider-seeding/promotion.ts";
import {
  providerCanonicalMatchSet,
  type ProviderCanonicalOrganizationSearchPort,
  type ProviderSeedPromotionEvidenceRepository,
  type ProviderSeedPromotionUnitOfWork,
} from "../../domain/provider-seeding/promotion-repository.ts";
import {
  createProviderPromotionReceipt,
  createProviderSeedDraft,
  createSourceBackedOrganizationLocation,
  deterministicProviderPromotionFingerprint,
  providerCanonicalComparisonFingerprint,
  providerCanonicalSearchFingerprint,
  providerGeographyProfileFingerprint,
  providerPromotionApprovalFingerprint,
  providerPromotionRequestFingerprint,
  providerSeedSourceRecordFingerprint,
  type ProviderPromotionReceipt,
  type ProviderSeedPromotionEvidenceBundle,
  type ProviderSeedPromotionOrganizationState,
  type ProviderSeedPromotionWriteSet,
} from "../../domain/provider-seeding/promotion-runtime.ts";

const PROMOTION_REQUIREMENT = createAdministrativeActionRequirement({
  permission: "provider.seed.promote",
  conditions: "pre-resolved",
});

export interface ProviderSeedPromotionServiceDependencies {
  readonly authorityContexts: PlatformAdministratorAuthorityContextRepository;
  readonly accounts: OrganizationAccountRepository;
  readonly profiles: OrganizationProfileRepository;
  readonly discovery: OrganizationDiscoveryRepository;
  readonly evidence: ProviderSeedPromotionEvidenceRepository;
  readonly canonicalSearch: ProviderCanonicalOrganizationSearchPort;
  readonly unitOfWork: ProviderSeedPromotionUnitOfWork;
}

export function providerPromotionAuthorityContextFingerprint(
  authority: PlatformAdministratorAuthorityContext,
): string {
  return deterministicProviderPromotionFingerprint(authority);
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function matchSetFingerprint(
  matches: readonly ProviderCanonicalMatchEvidence[],
): string {
  return deterministicProviderPromotionFingerprint(
    providerCanonicalMatchSet(matches),
  );
}

function assertCommandEvidence(
  command: ProviderPromotionCommand,
  evidence: ProviderSeedPromotionEvidenceBundle,
  authority: PlatformAdministratorAuthorityContext,
): void {
  const { candidate, sourceRecord, geography, canonicalSearch, comparison, approval } = evidence;
  if (
    command.candidateId !== candidate.id
    || command.comparisonId !== comparison.id
    || command.approvalId !== approval.id
    || comparison.candidateId !== candidate.id
    || approval.candidateId !== candidate.id
    || approval.comparisonId !== comparison.id
  ) {
    throw new Error("Provider promotion command and persisted evidence identities do not match.");
  }
  if (
    command.marketKey !== candidate.marketKey
    || sourceRecord.marketKey !== candidate.marketKey
    || sourceRecord.seedKey !== candidate.seedKey
    || String(sourceRecord.id) !== String(candidate.id)
  ) {
    throw new Error("Provider promotion source record belongs to a different seed candidate.");
  }
  if (
    sourceRecord.displayName !== candidate.displayName
    || sourceRecord.providerClass !== candidate.providerClass
    || sourceRecord.participationPolicy !== candidate.participationPolicy
    || sourceRecord.providerType !== candidate.providerType
    || sourceRecord.resourceCategory !== candidate.resourceCategory
    || sourceRecord.serviceName !== candidate.serviceName
    || sourceRecord.website !== candidate.website
    || !sameStrings(sourceRecord.aliases, candidate.aliases)
    || sourceRecord.primarySourceId !== candidate.primarySourceId
    || sourceRecord.sourcePlanFingerprint !== candidate.sourcePlanFingerprint
    || sourceRecord.donorRepository !== candidate.donorRepository
    || sourceRecord.donorCommit !== candidate.donorCommit
  ) {
    throw new Error("Provider promotion candidate no longer matches its source record.");
  }
  if (
    candidate.acceptedLocationKey !== sourceRecord.location.locationKey
    || candidate.acceptedPointFingerprint
      !== sourceRecord.location.acceptedPointFingerprint
  ) {
    throw new Error("Provider promotion candidate no longer matches its accepted location.");
  }

  const sourceFingerprint = providerSeedSourceRecordFingerprint(sourceRecord);
  const geographyFingerprint = providerGeographyProfileFingerprint(geography);
  const searchFingerprint = providerCanonicalSearchFingerprint(canonicalSearch);
  const comparisonFingerprint = providerCanonicalComparisonFingerprint(comparison);
  const approvalFingerprint = providerPromotionApprovalFingerprint(approval);
  const requestFingerprint = providerPromotionRequestFingerprint(command);
  if (
    sourceFingerprint !== candidate.sourceRecordFingerprint
    || sourceFingerprint !== comparison.candidateRecordFingerprint
    || sourceFingerprint !== approval.candidateRecordFingerprint
    || sourceFingerprint !== command.candidateRecordFingerprint
  ) {
    throw new Error("Provider promotion source-record fingerprint is stale.");
  }
  if (
    geographyFingerprint !== candidate.geographyProfileFingerprint
    || geographyFingerprint !== comparison.geographyProfileFingerprint
    || geographyFingerprint !== approval.geographyProfileFingerprint
    || geographyFingerprint !== command.geographyProfileFingerprint
  ) {
    throw new Error("Provider promotion Geography profile fingerprint is stale.");
  }
  if (searchFingerprint !== comparison.canonicalSearchFingerprint) {
    throw new Error("Provider promotion canonical search evidence is stale.");
  }
  if (
    comparisonFingerprint !== comparison.comparisonFingerprint
    || comparisonFingerprint !== approval.comparisonFingerprint
    || comparisonFingerprint !== command.comparisonFingerprint
  ) {
    throw new Error("Provider promotion comparison fingerprint is stale.");
  }
  if (approvalFingerprint !== command.approvalFingerprint) {
    throw new Error("Provider promotion approval fingerprint is stale.");
  }
  if (requestFingerprint !== command.requestFingerprint) {
    throw new Error("Provider promotion request fingerprint is stale.");
  }
  if (
    canonicalSearch.candidateId !== candidate.id
    || matchSetFingerprint(canonicalSearch.matches)
      !== matchSetFingerprint(comparison.matches)
  ) {
    throw new Error("Provider promotion comparison does not match its canonical search snapshot.");
  }
  if (
    approval.state !== "approved"
    || approval.targetOrganizationMode !== command.targetOrganizationMode
    || approval.targetOrganizationId !== command.targetOrganizationId
    || command.publishProviderDiscovery !== false
    || command.publishResource !== false
  ) {
    throw new Error("Provider promotion command exceeds the approved non-publishing decision.");
  }
  const authorityFingerprint = providerPromotionAuthorityContextFingerprint(authority);
  if (
    authority.administratorId !== command.actorAdministratorId
    || authorityFingerprint !== command.authorityContextId
    || authorityFingerprint !== approval.authorityContextId
    || approval.approvedByAdministratorId !== command.actorAdministratorId
  ) {
    throw new Error("Provider promotion command is not bound to the current approving authority context.");
  }
  if (
    geography.profile.id !== command.geographyProfileId
    || geography.profile.locationId !== command.targetLocationId
    || geography.profile.organizationId !== command.targetOrganizationId
    || geography.profile.acceptedPointFingerprint
      !== sourceRecord.location.acceptedPointFingerprint
  ) {
    throw new Error("Provider promotion Geography materialization is cross-bound.");
  }
}

function assertLinkedOrganizationState(
  state: ProviderSeedPromotionOrganizationState,
): asserts state is Readonly<{
  account: OrganizationAccount;
  profile: OrganizationProfile;
  discovery: OrganizationDiscoveryRecord;
}> {
  if (!state.account || !state.profile || !state.discovery) {
    throw new Error("Approved existing Organization no longer has complete canonical identity.");
  }
  if (
    state.profile.organizationId !== state.account.id
    || state.discovery.organizationId !== state.account.id
    || state.discovery.profileId !== state.profile.id
  ) {
    throw new Error("Approved existing Organization identity is internally inconsistent.");
  }
}

function selectedMatchDisplayName(
  evidence: ProviderSeedPromotionEvidenceBundle,
  targetOrganizationId: string,
): string | null {
  return evidence.comparison.matches.find(
    (match) => match.organizationId === targetOrganizationId,
  )?.displayName ?? null;
}

function websiteDomain(value: string | null): string | undefined {
  if (!value) return undefined;
  return new URL(value).hostname.replace(/^www\./, "");
}

function createSeededOrganization(
  command: ProviderPromotionCommand,
  evidence: ProviderSeedPromotionEvidenceBundle,
): Readonly<{
  account: OrganizationAccount;
  profile: OrganizationProfile;
  discovery: OrganizationDiscoveryRecord;
}> {
  const account = createOrganizationAccount({
    id: command.targetOrganizationId,
    now: command.recordedAt,
  });
  const profile = createOrganizationProfile(account, {
    id: `${command.targetOrganizationId}:profile`,
    displayName: evidence.sourceRecord.displayName,
    now: command.recordedAt,
  });
  const provenance = createOrganizationDataProvenance({
    kind: "seeded-public",
    sourceLabel: `Source-backed provider seed: ${evidence.sourceRecord.primarySourceId}`,
    sourceRecordId: evidence.sourceRecord.id,
    observedAt: evidence.sourceRecord.preparedAt,
  });
  const address = evidence.sourceRecord.location.address;
  const domain = websiteDomain(evidence.sourceRecord.website);
  const discovery = createOrganizationDiscoveryRecord(account, profile, {
    id: `${command.targetOrganizationId}:seeded-discovery`,
    origin: "seeded",
    identity: {
      displayName: profile.displayName,
      aliases: evidence.sourceRecord.aliases,
      categories: [
        evidence.sourceRecord.providerType,
        evidence.sourceRecord.resourceCategory,
      ],
      address: {
        line1: address.addressLine1,
        locality: address.locality,
        region: address.regionCode,
        ...(address.postalCode ? { postalCode: address.postalCode } : {}),
        countryCode: address.countryCode,
      },
      ...(domain ? { domain } : {}),
    },
    provenance,
    publicAddress: false,
    publicDomain: true,
    publicPhone: false,
    publicGovernmentIdentifiers: false,
    now: command.recordedAt,
  });
  return Object.freeze({ account, profile, discovery });
}

function sameSeededOrganization(
  current: Readonly<{
    account: OrganizationAccount;
    profile: OrganizationProfile;
    discovery: OrganizationDiscoveryRecord;
  }>,
  expected: Readonly<{
    account: OrganizationAccount;
    profile: OrganizationProfile;
    discovery: OrganizationDiscoveryRecord;
  }>,
): boolean {
  return current.account.id === expected.account.id
    && current.profile.id === expected.profile.id
    && current.profile.organizationId === expected.profile.organizationId
    && normalizeOrganizationName(current.profile.displayName)
      === normalizeOrganizationName(expected.profile.displayName)
    && current.discovery.id === expected.discovery.id
    && current.discovery.organizationId === expected.discovery.organizationId
    && current.discovery.profileId === expected.discovery.profileId
    && current.discovery.origin === "seeded"
    && current.discovery.displayName.provenance.sourceRecordId
      === expected.discovery.displayName.provenance.sourceRecordId;
}

export class ProviderSeedPromotionService {
  private readonly dependencies: ProviderSeedPromotionServiceDependencies;

  constructor(dependencies: ProviderSeedPromotionServiceDependencies) {
    this.dependencies = dependencies;
  }

  private async loadOrganizationState(
    targetOrganizationId: string,
  ): Promise<ProviderSeedPromotionOrganizationState> {
    const id = organizationId(targetOrganizationId);
    const [account, profile, discovery] = await Promise.all([
      this.dependencies.accounts.getById(id),
      this.dependencies.profiles.getByOrganizationId(id),
      this.dependencies.discovery.getByOrganizationId(id),
    ]);
    return Object.freeze({ account, profile, discovery });
  }

  private async assertCanonicalSearchIsCurrent(
    command: ProviderPromotionCommand,
    evidence: ProviderSeedPromotionEvidenceBundle,
  ): Promise<void> {
    const current = await this.dependencies.canonicalSearch.searchCurrent({
      candidateId: evidence.candidate.id,
      sourceRecord: evidence.sourceRecord,
      generatedAt: command.recordedAt,
      excludeOrganizationIds: command.targetOrganizationMode === "create"
        ? Object.freeze([command.targetOrganizationId])
        : Object.freeze([]),
    });
    if (
      current.candidateId !== evidence.candidate.id
      || matchSetFingerprint(current.matches)
        !== matchSetFingerprint(evidence.canonicalSearch.matches)
    ) {
      throw new Error(
        "Canonical Organization search changed after provider promotion approval; re-review is required.",
      );
    }
  }

  private async buildWriteSet(
    command: ProviderPromotionCommand,
  ): Promise<ProviderSeedPromotionWriteSet> {
    const authority = await this.dependencies.authorityContexts.getByAdministratorId(
      platformAdministratorId(command.actorAdministratorId),
    );
    if (!authority) throw new Error("Current provider promotion administrator authority is missing.");
    assertAdministrativeActionAuthorized(authority, PROMOTION_REQUIREMENT);

    const evidence = await this.dependencies.evidence.loadForCommand(command);
    if (!evidence) throw new Error("Current provider promotion evidence bundle is incomplete.");
    assertCommandEvidence(command, evidence, authority);
    await this.assertCanonicalSearchIsCurrent(command, evidence);

    const state = await this.loadOrganizationState(command.targetOrganizationId);
    let organization: ProviderSeedPromotionWriteSet["organization"];
    if (command.targetOrganizationMode === "create") {
      const expected = createSeededOrganization(command, evidence);
      if (!state.account && !state.profile && !state.discovery) {
        organization = Object.freeze({
          mode: "create",
          ...expected,
          createRecords: true,
        });
      } else {
        assertLinkedOrganizationState(state);
        if (!sameSeededOrganization(state, expected)) {
          throw new Error("Approved new Organization identity is no longer available.");
        }
        organization = Object.freeze({
          mode: "create",
          ...expected,
          createRecords: false,
        });
      }
    } else {
      assertLinkedOrganizationState(state);
      const reviewedName = selectedMatchDisplayName(
        evidence,
        command.targetOrganizationId,
      );
      if (
        !reviewedName
        || normalizeOrganizationName(reviewedName)
          !== normalizeOrganizationName(state.profile.displayName)
      ) {
        throw new Error("Approved existing Organization no longer matches comparison evidence.");
      }
      organization = Object.freeze({
        mode: "attach-existing",
        account: state.account,
        profile: state.profile,
        discovery: state.discovery,
        createRecords: false,
      });
    }

    const location = createSourceBackedOrganizationLocation({
      id: command.targetLocationId,
      organizationId: command.targetOrganizationId,
      sourceRecord: evidence.sourceRecord,
      geographyProfile: evidence.geography.profile,
      importedByAdministratorId: command.actorAdministratorId,
      importedAt: command.recordedAt,
    });
    const draft = createProviderSeedDraft({
      id: command.targetProviderResourceId,
      organizationId: command.targetOrganizationId,
      canonicalOrganizationDisplayName: organization.profile.displayName,
      candidate: evidence.candidate,
      sourceRecord: evidence.sourceRecord,
      location,
      geographyProfileFingerprint: command.geographyProfileFingerprint,
      createdByAdministratorId: command.actorAdministratorId,
      createdAt: command.recordedAt,
    });
    const event = createProviderPromotionEvent({
      id: `${command.id}:event`,
      command,
      occurredAt: command.recordedAt,
    });
    const receipt = createProviderPromotionReceipt({
      command,
      status: command.action === "commit-approved-provider-promotion"
        ? "committed"
        : "previewed",
    });
    return Object.freeze({
      command,
      event,
      receipt,
      evidence,
      organization,
      location,
      draft,
      geography: evidence.geography,
    });
  }

  async preview(command: ProviderPromotionCommand): Promise<ProviderPromotionReceipt> {
    if (command.action !== "preview-approved-provider-promotion") {
      throw new Error("Provider promotion preview requires a preview command.");
    }
    const writeSet = await this.buildWriteSet(command);
    return Object.freeze({
      ...writeSet.receipt,
      organizationCreated: false,
      organizationAttached: false,
    });
  }

  async commit(command: ProviderPromotionCommand): Promise<ProviderPromotionReceipt> {
    if (command.action !== "commit-approved-provider-promotion") {
      throw new Error("Provider promotion commit requires a committed command.");
    }
    const writeSet = await this.buildWriteSet(command);
    return this.dependencies.unitOfWork.commit(writeSet);
  }
}
