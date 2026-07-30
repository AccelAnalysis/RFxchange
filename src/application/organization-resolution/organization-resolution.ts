import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import type {
  PrimaryOperatingGeographySelection,
} from "../../domain/geography/model.ts";
import type { PrimaryOperatingGeographySelectionRepository } from "../../domain/geography/repository.ts";
import {
  accessJourneyId,
  advanceAccessLifecycle,
  type AccessLifecycleRecord,
} from "../../domain/lifecycle/model.ts";
import type { AccessLifecycleRepository } from "../../domain/lifecycle/repository.ts";
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
  createOrganizationEntityKeyReservation,
  createOrganizationResolutionRecord,
  normalizeOrganizationIdentity,
  projectUnclaimedOrganizationProfile,
  strongOrganizationEntityKeys,
  type OrganizationIdentityInput,
  type OrganizationMatchCandidate,
  type OrganizationResolutionRecord,
  type UnclaimedOrganizationPublicProfile,
} from "../../domain/organization-resolution/model.ts";
import {
  evaluateOrganizationCreationSafety,
  matchOrganizations,
  type OrganizationCreationSafety,
} from "../../domain/organization-resolution/matching.ts";
import type {
  OrganizationDiscoveryRepository,
  OrganizationResolutionRepository,
  OrganizationResolutionUnitOfWork,
} from "../../domain/organization-resolution/repository.ts";
import { OrganizationEntityKeyConflictError } from "../../domain/organization-resolution/repository.ts";

export type OrganizationResolutionErrorCode =
  | "access-journey-not-found"
  | "access-journey-not-owned"
  | "invalid-lifecycle-state"
  | "primary-geography-required"
  | "provisional-geography-mismatch"
  | "organization-already-resolved"
  | "organization-candidate-not-found"
  | "candidate-review-invalid"
  | "organization-record-incomplete"
  | "new-organization-blocked"
  | "strong-identity-conflict"
  | "seeded-profile-not-found";

export class OrganizationResolutionError extends Error {
  readonly code: OrganizationResolutionErrorCode;
  readonly conflictingOrganizationIds?: readonly string[];

  constructor(
    code: OrganizationResolutionErrorCode,
    message: string,
    conflictingOrganizationIds?: readonly string[],
  ) {
    super(message);
    this.name = "OrganizationResolutionError";
    this.code = code;
    this.conflictingOrganizationIds = conflictingOrganizationIds
      ? Object.freeze([...conflictingOrganizationIds])
      : undefined;
  }
}

export interface OrganizationResolutionIdFactory {
  resolution(): string;
  organization(): string;
  profile(): string;
  discovery(): string;
  entityKey(canonicalValue: string): string;
}

export interface OrganizationResolutionServiceDependencies {
  readonly lifecycle: AccessLifecycleRepository;
  readonly geographySelections: PrimaryOperatingGeographySelectionRepository;
  readonly accounts: OrganizationAccountRepository;
  readonly profiles: OrganizationProfileRepository;
  readonly discovery: OrganizationDiscoveryRepository;
  readonly resolutions: OrganizationResolutionRepository;
  readonly unitOfWork: OrganizationResolutionUnitOfWork;
  readonly ids: OrganizationResolutionIdFactory;
  readonly now: () => string;
}

export interface OrganizationResolutionSearchResult {
  readonly provisionalIdentity: OrganizationIdentityInput;
  readonly selection: PrimaryOperatingGeographySelection;
  readonly candidates: readonly OrganizationMatchCandidate[];
  readonly creationSafety: OrganizationCreationSafety;
}

export interface OrganizationResolutionResult {
  readonly resolution: OrganizationResolutionRecord;
  readonly organization: OrganizationAccount;
  readonly profile: OrganizationProfile;
  readonly lifecycle: AccessLifecycleRecord;
  readonly authorityEstablished: false;
  readonly organizationVerified: false;
}

function requireOwnedGeographySelectedJourney(
  journey: AccessLifecycleRecord | null,
  context: AuthenticatedServerContext,
): AccessLifecycleRecord {
  if (!journey) {
    throw new OrganizationResolutionError(
      "access-journey-not-found",
      "Access journey was not found.",
    );
  }
  if (!journey.userId || journey.userId !== context.user.id) {
    throw new OrganizationResolutionError(
      "access-journey-not-owned",
      "Access journey is not bound to the authenticated RFxchange user.",
    );
  }
  if (journey.state !== "geography-selected") {
    throw new OrganizationResolutionError(
      "invalid-lifecycle-state",
      "Organization resolution requires the geography-selected lifecycle state.",
    );
  }
  return journey;
}

export class OrganizationResolutionService {
  private readonly dependencies: OrganizationResolutionServiceDependencies;

  constructor(dependencies: OrganizationResolutionServiceDependencies) {
    this.dependencies = dependencies;
  }

  async publicUnclaimedProfile(
    requestedOrganizationId: string,
  ): Promise<UnclaimedOrganizationPublicProfile> {
    const record = await this.dependencies.discovery.getByOrganizationId(
      organizationId(requestedOrganizationId),
    );
    if (!record || record.origin !== "seeded") {
      throw new OrganizationResolutionError(
        "seeded-profile-not-found",
        "Public unclaimed organization profile was not found.",
      );
    }
    return projectUnclaimedOrganizationProfile(record);
  }

  async search(input: Readonly<{
    context: AuthenticatedServerContext;
    accessJourneyId: string;
    provisionalIdentity: OrganizationIdentityInput;
    reviewedCandidateOrganizationIds?: readonly string[];
  }>): Promise<OrganizationResolutionSearchResult> {
    const journeyId = accessJourneyId(input.accessJourneyId);
    const journey = requireOwnedGeographySelectedJourney(
      await this.dependencies.lifecycle.getById(journeyId),
      input.context,
    );
    const existingResolution =
      await this.dependencies.resolutions.getByAccessJourneyId(journey.id);
    if (existingResolution) {
      throw new OrganizationResolutionError(
        "organization-already-resolved",
        "This access journey already resolved an organization.",
      );
    }

    const selection = await this.dependencies.geographySelections.getByUserId(
      input.context.user.id,
    );
    if (!selection || selection.accessJourneyId !== journey.id) {
      throw new OrganizationResolutionError(
        "primary-geography-required",
        "A current server-authorized primary geography is required.",
      );
    }
    if (
      input.provisionalIdentity.geographyId &&
      input.provisionalIdentity.geographyId !== selection.geographyId
    ) {
      throw new OrganizationResolutionError(
        "provisional-geography-mismatch",
        "Provisional organization geography cannot override the canonical selection.",
      );
    }

    const provisionalIdentity = normalizeOrganizationIdentity({
      ...input.provisionalIdentity,
      geographyId: selection.geographyId,
    });
    const records = await this.dependencies.discovery.listByGeographyId(
      selection.geographyId,
    );
    const candidates = matchOrganizations(provisionalIdentity, records);
    const reviewed = (input.reviewedCandidateOrganizationIds ?? []).map(
      organizationId,
    );
    const candidateIds = new Set(candidates.map((candidate) => candidate.organizationId));
    const invalidReviewed = reviewed.filter((reviewedId) => !candidateIds.has(reviewedId));
    if (invalidReviewed.length > 0) {
      throw new OrganizationResolutionError(
        "candidate-review-invalid",
        "Candidate review evidence references an organization outside the current search results.",
        invalidReviewed,
      );
    }
    return Object.freeze({
      provisionalIdentity,
      selection,
      candidates,
      creationSafety: evaluateOrganizationCreationSafety(candidates, reviewed),
    });
  }

  async selectExisting(input: Readonly<{
    context: AuthenticatedServerContext;
    accessJourneyId: string;
    provisionalIdentity: OrganizationIdentityInput;
    organizationId: string;
    decisionReason: string;
  }>): Promise<OrganizationResolutionResult> {
    const search = await this.search(input);
    const selectedOrganizationId = organizationId(input.organizationId);
    const candidate = search.candidates.find(
      (value) => value.organizationId === selectedOrganizationId,
    );
    if (!candidate) {
      throw new OrganizationResolutionError(
        "organization-candidate-not-found",
        "Selected organization is not a current explainable match candidate.",
      );
    }
    const [organization, profile] = await Promise.all([
      this.dependencies.accounts.getById(candidate.organizationId),
      this.dependencies.profiles.getById(candidate.profileId),
    ]);
    if (
      !organization ||
      !profile ||
      profile.organizationId !== organization.id
    ) {
      throw new OrganizationResolutionError(
        "organization-record-incomplete",
        "Matched organization account/profile relationship is incomplete.",
      );
    }

    const now = this.dependencies.now();
    const resolution = createOrganizationResolutionRecord({
      id: this.dependencies.ids.resolution(),
      userId: input.context.user.id,
      accessJourneyId: search.selection.accessJourneyId,
      organizationId: organization.id,
      profileId: profile.id,
      disposition: "existing-organization-selected",
      provisionalIdentity: search.provisionalIdentity,
      matchEvidence: candidate.evidence,
      decisionReason: input.decisionReason,
      reviewedCandidateOrganizationIds: [organization.id],
      now,
    });
    const lifecycle = advanceAccessLifecycle(
      requireOwnedGeographySelectedJourney(
        await this.dependencies.lifecycle.getById(search.selection.accessJourneyId),
        input.context,
      ),
      "organization-resolved",
      now,
    );
    await this.dependencies.unitOfWork.selectExisting({
      resolution,
      lifecycle,
    });
    return Object.freeze({
      resolution,
      organization,
      profile,
      lifecycle,
      authorityEstablished: false as const,
      organizationVerified: false as const,
    });
  }

  async createNew(input: Readonly<{
    context: AuthenticatedServerContext;
    accessJourneyId: string;
    provisionalIdentity: OrganizationIdentityInput;
    reviewedCandidateOrganizationIds: readonly string[];
    decisionReason: string;
  }>): Promise<OrganizationResolutionResult> {
    const search = await this.search({
      ...input,
      reviewedCandidateOrganizationIds: input.reviewedCandidateOrganizationIds,
    });
    if (!search.creationSafety.allowed) {
      throw new OrganizationResolutionError(
        "new-organization-blocked",
        `New organization creation blocked: ${search.creationSafety.reason}.`,
        search.creationSafety.organizationIds,
      );
    }

    const now = this.dependencies.now();
    const account = createOrganizationAccount({
      id: this.dependencies.ids.organization(),
      now,
    });
    const profile = createOrganizationProfile(account, {
      id: this.dependencies.ids.profile(),
      displayName: search.provisionalIdentity.displayName,
      now,
    });
    const provenance = createOrganizationDataProvenance({
      kind: "participant-provided",
      sourceLabel: "Participant onboarding",
      sourceRecordId: search.selection.accessJourneyId,
      observedAt: now,
    });
    const discovery = createOrganizationDiscoveryRecord(account, profile, {
      id: this.dependencies.ids.discovery(),
      origin: "participant-created",
      identity: search.provisionalIdentity,
      provenance,
      publicAddress: false,
      publicDomain: false,
      publicPhone: false,
      publicGovernmentIdentifiers: false,
      now,
    });
    const resolution = createOrganizationResolutionRecord({
      id: this.dependencies.ids.resolution(),
      userId: input.context.user.id,
      accessJourneyId: search.selection.accessJourneyId,
      organizationId: account.id,
      profileId: profile.id,
      disposition: "new-organization-created",
      provisionalIdentity: search.provisionalIdentity,
      decisionReason: input.decisionReason,
      reviewedCandidateOrganizationIds: input.reviewedCandidateOrganizationIds.map(
        organizationId,
      ),
      now,
    });
    const entityKeys = strongOrganizationEntityKeys(
      search.provisionalIdentity,
    ).map((key) =>
      createOrganizationEntityKeyReservation({
        id: this.dependencies.ids.entityKey(
          `${key.kind}:${key.canonicalValue}`,
        ),
        organizationId: account.id,
        keyKind: key.kind,
        canonicalValue: key.canonicalValue,
        now,
      }),
    );
    const lifecycle = advanceAccessLifecycle(
      requireOwnedGeographySelectedJourney(
        await this.dependencies.lifecycle.getById(search.selection.accessJourneyId),
        input.context,
      ),
      "organization-resolved",
      now,
    );

    try {
      await this.dependencies.unitOfWork.createNew({
        account,
        profile,
        discovery,
        resolution,
        entityKeys,
        lifecycle,
      });
    } catch (error) {
      if (error instanceof OrganizationEntityKeyConflictError) {
        throw new OrganizationResolutionError(
          "strong-identity-conflict",
          "Strong organization identity is already attached to another organization.",
          error.conflictingOrganizationIds,
        );
      }
      throw error;
    }
    return Object.freeze({
      resolution,
      organization: account,
      profile,
      lifecycle,
      authorityEstablished: false as const,
      organizationVerified: false as const,
    });
  }
}
