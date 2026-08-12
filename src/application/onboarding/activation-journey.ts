import type { AuthenticationAccountSecurityReader } from "../auth/authorize-organization-operation.ts";
import { participantLifecycleDestination } from "../auth/participant-lifecycle-destination.ts";
import type {
  AcquisitionIntentKind,
  AcquisitionSourceChannel,
} from "../../domain/acquisition/model.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import type { PrimaryOperatingGeographyService } from "../geography/primary-operating-geography.ts";
import type { OrganizationMarkerActivationService } from "../geography/organization-marker-activation.ts";
import type { OrganizationAuthorityService } from "../organization-claims/organization-authority.ts";
import type { OrganizationLocationService } from "../organization-location/organization-location.ts";
import type { EssentialOrganizationProfileService } from "../organization-profile/essential-profile.ts";
import type { OrganizationResolutionService } from "../organization-resolution/organization-resolution.ts";
import { ParticipantCreatedOrganizationAuthorityService } from "./participant-created-authority.ts";
import type { GeographyDefinition } from "../../domain/geography/model.ts";
import type {
  GeographyDefinitionRepository,
  PrimaryOperatingGeographySelectionRepository,
} from "../../domain/geography/repository.ts";
import {
  accessJourneyId,
  advanceAccessLifecycle,
  associateAccessJourneyWithUser,
  createAccessLifecycle,
  type AccessLifecycleRecord,
} from "../../domain/lifecycle/model.ts";
import type { AccessLifecycleRepository } from "../../domain/lifecycle/repository.ts";
import {
  createActivationJourneyContext,
  createActivationLegalAcceptance,
  isCurrentActivationLegalAcceptance,
  updateActivationJourneyContext,
  type ActivationJourneyContext,
} from "../../domain/onboarding/model.ts";
import type { ActivationJourneyContextRepository } from "../../domain/onboarding/repository.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import type { OrganizationAuthorityClaimRepository } from "../../domain/organization-claims/repository.ts";
import {
  createOrganizationAuthorityEvidence,
} from "../../domain/organization-claims/model.ts";
import {
  createOrganizationCapability,
  type OrganizationProfileCompletion,
} from "../../domain/organization-profile/model.ts";
import type { OrganizationProfileCompletionRepository } from "../../domain/organization-profile/repository.ts";
import type { OrganizationResolutionRepository } from "../../domain/organization-resolution/repository.ts";
import {
  normalizeOrganizationIdentity,
  type OrganizationIdentityInput,
} from "../../domain/organization-resolution/model.ts";
import {
  structuredPostalAddress,
  type ConfirmedOrganizationLocation,
  type OrganizationLocationDraft,
} from "../../domain/organization-location/model.ts";
import type {
  ConfirmedOrganizationLocationRepository,
  OrganizationServiceGeographyRepository,
} from "../../domain/organization-location/repository.ts";
import type { OrganizationMarkerActivation } from "../../domain/organization-markers/model.ts";
import type { OrganizationMarkerActivationRepository } from "../../domain/organization-markers/repository.ts";
import { orientationJourneyIdForAccessJourney } from "../../domain/orientation/model.ts";
import type { OrientationJourneyRepository } from "../../domain/orientation/repository.ts";
import type {
  OrganizationAccountRepository,
  OrganizationProfileRepository,
} from "../../domain/organizations/repository.ts";
import { organizationMembershipId } from "../../domain/users/model.ts";
import type { OrganizationMembershipRepository } from "../../domain/users/repository.ts";

export type ActivationJourneyStep =
  | "legal"
  | "geography"
  | "orientation"
  | "organization"
  | "email-verification"
  | "authority-review"
  | "location"
  | "profile"
  | "marker"
  | "complete";

export interface ActivationJourneyState {
  readonly accessJourneyId: string;
  readonly lifecycleState: AccessLifecycleRecord["state"];
  readonly nextStep: ActivationJourneyStep;
  readonly provisionalOrganizationName: string;
  readonly legalAccepted: boolean;
  readonly orientationBridgeAcknowledged: boolean;
  readonly emailVerified: boolean;
  readonly releasedGeographies: readonly Readonly<{
    id: string;
    name: string;
    type: string;
  }>[];
  readonly selectedGeography: Readonly<{
    id: string;
    name: string;
  }> | null;
  readonly organization: Readonly<{
    id: string;
    displayName: string;
  }> | null;
  readonly profileSeed: Readonly<{
    websiteDisposition: "available" | "not-applicable" | null;
    websiteUrl: string | null;
    phone: string | null;
    contactName: string;
    contactEmail: string;
  }>;
  readonly membershipId: string | null;
  readonly location: Readonly<{
    geographyId: string;
    visibility: string;
  }> | null;
  readonly profileCompletion: Readonly<{
    status: string;
    missingRequirements: readonly string[];
  }> | null;
  readonly marker: Readonly<{
    status: string;
    geographyId: string;
  }> | null;
  readonly controlledPlatformUrl: string | null;
  readonly orientationImplementationPending: boolean;
  readonly acquisitionContext: Readonly<{
    readonly id: string;
    readonly kind: AcquisitionIntentKind;
    readonly subjectReference: string | null;
    readonly sourceChannel: AcquisitionSourceChannel;
    readonly status: "preserved";
  }> | null;
}

export interface ActivationJourneyDependencies {
  readonly contexts: ActivationJourneyContextRepository;
  readonly lifecycle: AccessLifecycleRepository;
  readonly definitions: GeographyDefinitionRepository;
  readonly selections: PrimaryOperatingGeographySelectionRepository;
  readonly releasedGeographies: readonly GeographyDefinition[];
  readonly geography: PrimaryOperatingGeographyService;
  readonly resolution: OrganizationResolutionService;
  readonly resolutions: OrganizationResolutionRepository;
  readonly participantCreatedAuthority: ParticipantCreatedOrganizationAuthorityService;
  readonly claims: OrganizationAuthorityService;
  readonly claimRepository: OrganizationAuthorityClaimRepository;
  readonly location: OrganizationLocationService;
  readonly locations: ConfirmedOrganizationLocationRepository;
  readonly serviceGeographies: OrganizationServiceGeographyRepository;
  readonly profile: EssentialOrganizationProfileService;
  readonly completions: OrganizationProfileCompletionRepository;
  readonly marker: OrganizationMarkerActivationService;
  readonly markerActivations: OrganizationMarkerActivationRepository;
  readonly accounts: OrganizationAccountRepository;
  readonly profiles: OrganizationProfileRepository;
  readonly memberships: OrganizationMembershipRepository;
  readonly orientations: OrientationJourneyRepository;
  readonly accountSecurity: AuthenticationAccountSecurityReader;
  readonly ids: Readonly<{
    markerEvent(): string;
    markerAudit(): string;
  }>;
  readonly now: () => string;
}

export class ActivationJourneyError extends Error {
  readonly code:
    | "activation-context-required"
    | "legal-acceptance-required"
    | "orientation-position-required"
    | "organization-required"
    | "organization-authority-required"
    | "email-verification-required"
    | "location-required"
    | "profile-complete-required"
    | "marker-not-active";

  constructor(code: ActivationJourneyError["code"], message: string) {
    super(message);
    this.name = "ActivationJourneyError";
    this.code = code;
  }
}

export class ActivationRequestValidationError extends Error {
  readonly code = "request-invalid" as const;

  constructor(message: string) {
    super(message);
    this.name = "ActivationRequestValidationError";
  }
}

function validatedOrganizationIdentity(
  input: OrganizationIdentityInput,
): OrganizationIdentityInput {
  try {
    return normalizeOrganizationIdentity(input);
  } catch (error) {
    throw new ActivationRequestValidationError(
      error instanceof Error ? error.message : "Organization identity is invalid.",
    );
  }
}

function validatedOrganizationIds(values: readonly string[]): readonly string[] {
  try {
    return Object.freeze(values.map((value) => String(organizationId(value))));
  } catch (error) {
    throw new ActivationRequestValidationError(
      error instanceof Error ? error.message : "Organization identifier is invalid.",
    );
  }
}

function validatedAuthorityEvidence(
  input: Parameters<typeof createOrganizationAuthorityEvidence>[0],
) {
  try {
    return createOrganizationAuthorityEvidence(input);
  } catch (error) {
    throw new ActivationRequestValidationError(
      error instanceof Error ? error.message : "Organization authority evidence is invalid.",
    );
  }
}

function publicGeographies(definitions: readonly GeographyDefinition[]) {
  return Object.freeze(
    definitions
      .filter((definition) => definition.releaseState === "released")
      .map((definition) =>
        Object.freeze({
          id: String(definition.id),
          name: definition.name,
          type: definition.type,
        }),
      ),
  );
}

function normalizedWebsiteUrl(value: string): string {
  const normalized = value.trim();
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(normalized)
    ? normalized
    : `https://${normalized}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new ActivationRequestValidationError(
      "Organization website must be a valid URL.",
    );
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new ActivationRequestValidationError(
      "Organization website must use HTTP or HTTPS.",
    );
  }
  parsed.hash = "";
  return parsed.toString();
}

function domainFromWebsite(websiteUrl: string | null): string | null {
  if (!websiteUrl) return null;
  const hostname = new URL(websiteUrl).hostname.toLowerCase().replace(/^www\./, "");
  return hostname || null;
}

export class ActivationJourneyService {
  constructor(private readonly dependencies: ActivationJourneyDependencies) {}

  private async contextFor(context: AuthenticatedServerContext): Promise<ActivationJourneyContext> {
    const activation = await this.dependencies.contexts.getByUserId(context.user.id);
    if (!activation) {
      throw new ActivationJourneyError(
        "activation-context-required",
        "The authenticated user does not have an activation journey.",
      );
    }
    return activation;
  }

  private async journeyFor(activation: ActivationJourneyContext): Promise<AccessLifecycleRecord> {
    const lifecycle = await this.dependencies.lifecycle.getById(
      accessJourneyId(activation.accessJourneyId),
    );
    if (!lifecycle || lifecycle.userId !== activation.userId) {
      throw new ActivationJourneyError(
        "activation-context-required",
        "The activation lifecycle record is unavailable or belongs to another user.",
      );
    }
    return lifecycle;
  }

  async bootstrap(
    context: AuthenticatedServerContext,
    provisionalOrganizationName: string,
  ): Promise<ActivationJourneyState> {
    let activation = await this.dependencies.contexts.getByUserId(context.user.id);
    if (!activation) {
      // Released-geography initialization is creation work, not returning-user authentication work.
      // First-time setup may ensure the released definitions exist, in parallel; resume/login skips it.
      await Promise.all(
        this.dependencies.releasedGeographies.map(async (geography) => {
          const existing = await this.dependencies.definitions.getById(geography.id);
          if (!existing) await this.dependencies.definitions.save(geography);
        }),
      );

      activation = createActivationJourneyContext({
        userId: context.user.id,
        provisionalOrganizationName,
        now: this.dependencies.now(),
      });
      let lifecycle = createAccessLifecycle({
        id: activation.accessJourneyId,
        now: activation.createdAt,
      });
      lifecycle = advanceAccessLifecycle(lifecycle, "account-started", activation.createdAt);
      lifecycle = associateAccessJourneyWithUser(lifecycle, context.user.id, activation.createdAt);
      lifecycle = advanceAccessLifecycle(lifecycle, "account-activated", activation.createdAt);
      await this.dependencies.lifecycle.save(lifecycle);
      await this.dependencies.contexts.save(activation);
    } else if (
      provisionalOrganizationName.trim() &&
      provisionalOrganizationName.trim() !== activation.provisionalOrganizationName
    ) {
      activation = updateActivationJourneyContext(activation, {
        provisionalOrganizationName,
        now: this.dependencies.now(),
      });
      await this.dependencies.contexts.save(activation);
    }
    return this.stateFor(context, activation);
  }

  async acceptLegal(context: AuthenticatedServerContext): Promise<ActivationJourneyState> {
    const activation = await this.contextFor(context);
    const updated = updateActivationJourneyContext(activation, {
      legalAcceptance: createActivationLegalAcceptance(this.dependencies.now()),
      now: this.dependencies.now(),
    });
    await this.dependencies.contexts.save(updated);
    return this.stateFor(context, updated);
  }

  async selectGeography(
    context: AuthenticatedServerContext,
    geographyId: string,
  ): Promise<ActivationJourneyState> {
    const activation = await this.contextFor(context);
    if (!isCurrentActivationLegalAcceptance(activation.legalAcceptance)) {
      throw new ActivationJourneyError(
        "legal-acceptance-required",
        "The legal acceptance step must be completed before selecting a home locality.",
      );
    }
    await this.dependencies.geography.select({
      context,
      accessJourneyId: activation.accessJourneyId,
      geographyId,
    });
    return this.stateFor(context, activation);
  }

  async acknowledgeOrientationPosition(
    context: AuthenticatedServerContext,
  ): Promise<ActivationJourneyState> {
    const activation = await this.contextFor(context);
    await this.dependencies.geography.requireForOrientation({
      context,
      accessJourneyId: activation.accessJourneyId,
    });
    const now = this.dependencies.now();
    const updated = updateActivationJourneyContext(activation, {
      orientationBridgeAcknowledgedAt: now,
      now,
    });
    await this.dependencies.contexts.save(updated);
    return this.stateFor(context, updated);
  }

  private async persistIdentitySeed(
    activation: ActivationJourneyContext,
    input: Readonly<{
      website?: string;
      websiteNotApplicable?: boolean;
      phone?: string;
    }>,
  ): Promise<ActivationJourneyContext> {
    const website = input.website?.trim() ?? "";
    const websiteUrl = input.websiteNotApplicable || !website
      ? null
      : normalizedWebsiteUrl(website);
    const phone = input.phone?.trim() || null;
    if (phone && !/^[+0-9().\-\s]{7,40}$/.test(phone)) {
      throw new ActivationRequestValidationError(
        "Organization contact phone is malformed.",
      );
    }
    const updated = updateActivationJourneyContext(activation, {
      organizationIdentitySeed: {
        websiteDisposition: input.websiteNotApplicable
          ? "not-applicable"
          : websiteUrl
            ? "available"
            : null,
        websiteUrl,
        phone,
      },
      now: this.dependencies.now(),
    });
    await this.dependencies.contexts.save(updated);
    return updated;
  }

  async searchOrganizations(
    context: AuthenticatedServerContext,
    input: Readonly<{
      displayName: string;
      website?: string;
      websiteNotApplicable?: boolean;
      phone?: string;
      address?: Readonly<{
        line1: string;
        locality: string;
        region: string;
        postalCode?: string;
        countryCode?: string;
      }>;
    }>,
  ) {
    const activation = await this.contextFor(context);
    if (!activation.orientationBridgeAcknowledgedAt) {
      throw new ActivationJourneyError(
        "orientation-position-required",
        "The canonical orientation position must be acknowledged before organization resolution.",
      );
    }
    validatedOrganizationIdentity({ displayName: input.displayName });
    const seeded = await this.persistIdentitySeed(activation, input);
    const domain = domainFromWebsite(seeded.organizationIdentitySeed.websiteUrl);
    const provisionalIdentity = validatedOrganizationIdentity({
      displayName: input.displayName,
      ...(domain ? { domain } : {}),
      ...(seeded.organizationIdentitySeed.phone
        ? { phone: seeded.organizationIdentitySeed.phone }
        : {}),
      ...(input.address
        ? {
            address: {
              ...input.address,
              countryCode: input.address.countryCode ?? "US",
            },
          }
        : {}),
    });
    return this.dependencies.resolution.search({
      context,
      accessJourneyId: activation.accessJourneyId,
      provisionalIdentity,
    });
  }

  async createOrganization(
    context: AuthenticatedServerContext,
    input: Readonly<{
      displayName: string;
      reviewedCandidateOrganizationIds?: readonly string[];
      website?: string;
      websiteNotApplicable?: boolean;
      phone?: string;
    }>,
  ): Promise<ActivationJourneyState> {
    let activation = await this.contextFor(context);
    if (!activation.orientationBridgeAcknowledgedAt) {
      throw new ActivationJourneyError(
        "orientation-position-required",
        "The canonical orientation position must be acknowledged before organization resolution.",
      );
    }
    const reviewedCandidateOrganizationIds = validatedOrganizationIds(
      input.reviewedCandidateOrganizationIds ?? [],
    );
    validatedOrganizationIdentity({ displayName: input.displayName });
    if (
      input.website !== undefined ||
      input.websiteNotApplicable !== undefined ||
      input.phone !== undefined
    ) {
      activation = await this.persistIdentitySeed(activation, input);
    }
    const domain = domainFromWebsite(activation.organizationIdentitySeed.websiteUrl);
    const provisionalIdentity = validatedOrganizationIdentity({
      displayName: input.displayName,
      ...(domain ? { domain } : {}),
      ...(activation.organizationIdentitySeed.phone
        ? { phone: activation.organizationIdentitySeed.phone }
        : {}),
    });
    const result = await this.dependencies.resolution.createNew({
      context,
      accessJourneyId: activation.accessJourneyId,
      provisionalIdentity,
      reviewedCandidateOrganizationIds,
      decisionReason: "Participant confirmed that none of the reviewed matches is this organization.",
    });
    const authority = await this.dependencies.participantCreatedAuthority.establish({
      context,
      organization: result.organization,
      lifecycle: result.lifecycle,
    });
    const updated = updateActivationJourneyContext(activation, {
      provisionalOrganizationName: result.profile.displayName,
      organizationId: result.organization.id,
      membershipId: authority.membership.id,
      now: this.dependencies.now(),
    });
    await this.dependencies.contexts.save(updated);
    return this.stateFor(context, updated);
  }

  async selectExistingOrganization(
    context: AuthenticatedServerContext,
    input: Readonly<{
      displayName: string;
      organizationId: string;
      domainEmailReference?: string;
    }>,
  ): Promise<ActivationJourneyState> {
    const activation = await this.contextFor(context);
    if (!activation.orientationBridgeAcknowledgedAt) {
      throw new ActivationJourneyError(
        "orientation-position-required",
        "The canonical orientation position must be acknowledged before organization resolution.",
      );
    }
    const provisionalIdentity = validatedOrganizationIdentity({
      displayName: input.displayName,
    });
    const selectedOrganizationId = validatedOrganizationIds([input.organizationId])[0];
    const now = this.dependencies.now();
    const evidence = input.domainEmailReference?.trim()
      ? [
          validatedAuthorityEvidence({
            id: `authority-evidence-${crypto.randomUUID()}`,
            kind: "domain-email",
            reference: input.domainEmailReference.trim(),
            status: "pending",
            submittedAt: now,
          }),
        ]
      : [
          validatedAuthorityEvidence({
            id: `authority-evidence-${crypto.randomUUID()}`,
            kind: "administrative-review",
            reference: "Participant requested authority review during onboarding.",
            status: "pending",
            submittedAt: now,
          }),
        ];
    const result = await this.dependencies.resolution.selectExisting({
      context,
      accessJourneyId: activation.accessJourneyId,
      provisionalIdentity,
      organizationId: selectedOrganizationId,
      decisionReason: "Participant selected this current match as their organization.",
    });
    const selection = await this.dependencies.selections.getByUserId(context.user.id);
    if (!selection) throw new Error("Primary geography selection disappeared during organization claim.");
    await this.dependencies.claims.submit({
      context,
      accessJourneyId: activation.accessJourneyId,
      geographyId: String(selection.geographyId),
      evidence,
      reason: "Existing organization selected; authority must be established separately.",
    });
    const updated = updateActivationJourneyContext(activation, {
      provisionalOrganizationName: result.profile.displayName,
      organizationId: result.organization.id,
      now,
    });
    await this.dependencies.contexts.save(updated);
    return this.stateFor(context, updated);
  }

  async beginLocation(
    context: AuthenticatedServerContext,
    input: Readonly<{
      addressLine1: string;
      addressLine2?: string;
      locality: string;
      regionCode: string;
      postalCode: string;
      isHomeOrPrivate: boolean;
      visibility: string;
    }>,
  ): Promise<Readonly<{
    state: ActivationJourneyState;
    draft: OrganizationLocationDraft;
  }>> {
    const activation = await this.contextFor(context);
    if (!activation.organizationId || !activation.membershipId) {
      throw new ActivationJourneyError(
        "organization-authority-required",
        "Organization authority is required before confirming location.",
      );
    }
    let physicalAddress;
    try {
      physicalAddress = structuredPostalAddress({
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        locality: input.locality,
        regionCode: input.regionCode,
        postalCode: input.postalCode,
        countryCode: "US",
      });
    } catch (error) {
      throw new ActivationRequestValidationError(
        error instanceof Error ? error.message : "Organization location is invalid.",
      );
    }
    const draft = await this.dependencies.location.beginConfirmation({
      context,
      organizationId: String(activation.organizationId),
      membershipId: String(activation.membershipId),
      physicalAddress,
      isHomeOrPrivate: input.isHomeOrPrivate,
      visibility: input.visibility,
      reason: "Participant geocoded organization location during activation.",
    });
    const updated = updateActivationJourneyContext(activation, {
      activeLocationDraftId: String(draft.id),
      now: this.dependencies.now(),
    });
    await this.dependencies.contexts.save(updated);
    return Object.freeze({ state: await this.stateFor(context, updated), draft });
  }

  async confirmLocation(
    context: AuthenticatedServerContext,
    candidateId: string,
  ): Promise<ActivationJourneyState> {
    const activation = await this.contextFor(context);
    if (!activation.organizationId || !activation.membershipId || !activation.activeLocationDraftId) {
      throw new ActivationJourneyError(
        "location-required",
        "A current geocoded location candidate is required before confirmation.",
      );
    }
    const confirmed = await this.dependencies.location.confirm({
      context,
      organizationId: String(activation.organizationId),
      membershipId: String(activation.membershipId),
      draftId: activation.activeLocationDraftId,
      candidateId,
      reason: "Participant confirmed the organization map location during activation.",
    });
    await this.dependencies.location.saveServiceGeographies({
      context,
      organizationId: String(activation.organizationId),
      membershipId: String(activation.membershipId),
      serviceGeographyIds: [String(confirmed.geographyId)],
      reason: "Activation initialized service geography to the confirmed home locality.",
    });
    const updated = updateActivationJourneyContext(activation, {
      activeLocationDraftId: null,
      now: this.dependencies.now(),
    });
    await this.dependencies.contexts.save(updated);
    return this.stateFor(context, updated);
  }

  async saveProfile(
    context: AuthenticatedServerContext,
    input: Readonly<{
      website?: string;
      websiteNotApplicable?: boolean;
      contactRole: string;
      contactPubliclyVisible: boolean;
      capabilityKind: string;
      capabilityCategory: string;
      capabilityOtherCategory?: string;
      capabilityName: string;
      capabilityDescription: string;
    }>,
  ): Promise<ActivationJourneyState> {
    let activation = await this.contextFor(context);
    if (!activation.organizationId || !activation.membershipId) {
      throw new ActivationJourneyError(
        "organization-authority-required",
        "Organization authority is required before essential profile completion.",
      );
    }
    if (
      activation.organizationIdentitySeed.websiteDisposition === null ||
      input.website !== undefined ||
      input.websiteNotApplicable !== undefined
    ) {
      activation = await this.persistIdentitySeed(activation, {
        website: input.website,
        websiteNotApplicable: input.websiteNotApplicable,
        phone: activation.organizationIdentitySeed.phone ?? undefined,
      });
    }
    if (activation.organizationIdentitySeed.websiteDisposition === null) {
      throw new ActivationRequestValidationError(
        "Confirm the organization website or indicate that no public website applies.",
      );
    }
    const organizationId = activation.organizationId;
    const membershipId = activation.membershipId;
    if (!organizationId || !membershipId) {
      throw new ActivationJourneyError(
        "organization-authority-required",
        "Organization authority changed before essential profile completion.",
      );
    }
    const location = await this.dependencies.locations.getByOrganizationId(organizationId);
    if (!location) {
      throw new ActivationJourneyError(
        "location-required",
        "Confirmed organization location is required before essential profile completion.",
      );
    }
    const durableProfile = await this.dependencies.profiles.getByOrganizationId(
      organizationId,
    );
    if (!durableProfile) {
      throw new ActivationJourneyError(
        "organization-required",
        "The durable organization profile is unavailable.",
      );
    }
    let capability;
    try {
      capability = createOrganizationCapability({
        id: `capability-${crypto.randomUUID()}`,
        kind: input.capabilityKind,
        category: input.capabilityCategory,
        otherCategory: input.capabilityOtherCategory,
        name: input.capabilityName,
        description: input.capabilityDescription,
      });
    } catch (error) {
      throw new ActivationRequestValidationError(
        error instanceof Error ? error.message : "Organization capability is invalid.",
      );
    }
    const saved = await this.dependencies.profile.update({
      context,
      organizationId: String(organizationId),
      membershipId: String(membershipId),
      profile: {
        displayName: durableProfile.displayName,
        website: activation.organizationIdentitySeed.websiteDisposition === "not-applicable"
          ? {
              disposition: "not-applicable",
              explanation: "Participant indicated that the organization does not use a public website.",
            }
          : {
              disposition: "available",
              url: activation.organizationIdentitySeed.websiteUrl ?? "",
            },
        mainContact: {
          displayName: context.user.name,
          roleTitle: input.contactRole,
          email: context.user.primaryEmail,
          phone: activation.organizationIdentitySeed.phone,
          publiclyVisible: input.contactPubliclyVisible,
        },
        capabilities: [capability],
      },
      reason: "Participant completed the essential organization profile during activation.",
    });
    if (saved.completion.status !== "active") return this.stateFor(context, activation);

    const marker = await this.dependencies.marker.recalculate({
      context,
      organizationId,
      membershipId,
      eventId: this.dependencies.ids.markerEvent(),
      auditEventId: this.dependencies.ids.markerAudit(),
      reason: "Essential profile completed during activation; recalculate real marker.",
      now: this.dependencies.now(),
    });
    if (marker.status === "active") {
      await this.advanceToControlledPlatform(activation);
    }
    return this.stateFor(context, activation);
  }

  private async advanceToControlledPlatform(activation: ActivationJourneyContext): Promise<void> {
    let lifecycle = await this.journeyFor(activation);
    if (lifecycle.state === "organization-registered") {
      lifecycle = advanceAccessLifecycle(
        lifecycle,
        "organization-activated",
        this.dependencies.now(),
      );
      await this.dependencies.lifecycle.save(lifecycle);
    }
    if (lifecycle.state === "organization-activated") {
      lifecycle = advanceAccessLifecycle(
        lifecycle,
        "controlled-platform",
        this.dependencies.now(),
      );
      await this.dependencies.lifecycle.save(lifecycle);
    }
  }

  private async stateFor(
    context: AuthenticatedServerContext,
    activation: ActivationJourneyContext,
  ): Promise<ActivationJourneyState> {
    const journeyId = accessJourneyId(activation.accessJourneyId);
    const [lifecycle, selection, account, resolution, memberships] = await Promise.all([
      this.dependencies.lifecycle.getById(journeyId),
      this.dependencies.selections.getByUserId(context.user.id),
      this.dependencies.accountSecurity.inspect(context.authentication.subject),
      this.dependencies.resolutions.getByAccessJourneyId(journeyId),
      this.dependencies.memberships.listActiveByUserId(context.user.id),
    ]);
    if (!lifecycle || lifecycle.userId !== activation.userId) {
      throw new ActivationJourneyError(
        "activation-context-required",
        "The activation lifecycle record is unavailable or belongs to another user.",
      );
    }

    const resolvedOrganizationId = activation.organizationId ?? resolution?.organizationId ?? null;
    const [selectedDefinition, organization, profile, location, completion, marker, orientation] = await Promise.all([
      selection
        ? this.dependencies.definitions.getById(selection.geographyId)
        : Promise.resolve(null),
      resolvedOrganizationId
        ? this.dependencies.accounts.getById(resolvedOrganizationId)
        : Promise.resolve(null),
      resolvedOrganizationId
        ? this.dependencies.profiles.getByOrganizationId(resolvedOrganizationId)
        : Promise.resolve(null),
      resolvedOrganizationId
        ? this.dependencies.locations.getByOrganizationId(resolvedOrganizationId)
        : Promise.resolve(null),
      resolvedOrganizationId
        ? this.dependencies.completions.getByOrganizationId(resolvedOrganizationId)
        : Promise.resolve(null),
      resolvedOrganizationId
        ? this.dependencies.markerActivations.getByOrganizationId(resolvedOrganizationId)
        : Promise.resolve(null),
      lifecycle.state === "controlled-platform"
        ? this.dependencies.orientations.getById(orientationJourneyIdForAccessJourney(journeyId))
        : Promise.resolve(null),
    ]);
    const membership = activation.membershipId
      ? memberships.find((candidate) => candidate.id === activation.membershipId) ?? null
      : resolvedOrganizationId
        ? memberships.find((candidate) => candidate.organizationId === resolvedOrganizationId) ?? null
        : null;
    const orientationComplete = Boolean(
      orientation?.status === "completed" &&
      orientation.completedThroughStep === 8 &&
      orientation.userId === context.user.id &&
      String(orientation.accessJourneyId) === String(activation.accessJourneyId) &&
      (!resolvedOrganizationId || String(orientation.organizationId) === String(resolvedOrganizationId)),
    );

    const nextStep = this.nextStep({
      activation,
      lifecycle,
      emailVerified: account.emailVerified,
      selection: selectedDefinition,
      resolutionExists: Boolean(resolution),
      membershipExists: Boolean(membership),
      location,
      completion,
      marker,
    });

    return Object.freeze({
      accessJourneyId: activation.accessJourneyId,
      lifecycleState: lifecycle.state,
      nextStep,
      provisionalOrganizationName: activation.provisionalOrganizationName,
      legalAccepted: isCurrentActivationLegalAcceptance(activation.legalAcceptance),
      orientationBridgeAcknowledged: Boolean(activation.orientationBridgeAcknowledgedAt),
      emailVerified: account.emailVerified,
      releasedGeographies: publicGeographies(this.dependencies.releasedGeographies),
      selectedGeography: selectedDefinition
        ? Object.freeze({ id: String(selectedDefinition.id), name: selectedDefinition.name })
        : null,
      organization: organization && profile
        ? Object.freeze({ id: String(organization.id), displayName: profile.displayName })
        : null,
      profileSeed: Object.freeze({
        websiteDisposition: activation.organizationIdentitySeed.websiteDisposition,
        websiteUrl: activation.organizationIdentitySeed.websiteUrl,
        phone: activation.organizationIdentitySeed.phone,
        contactName: context.user.name,
        contactEmail: context.user.primaryEmail,
      }),
      membershipId: membership ? String(membership.id) : null,
      location: location
        ? Object.freeze({ geographyId: String(location.geographyId), visibility: location.visibility })
        : null,
      profileCompletion: completion
        ? Object.freeze({
            status: completion.status,
            missingRequirements: Object.freeze([...completion.missingRequirements]),
          })
        : null,
      marker: marker
        ? Object.freeze({ status: marker.status, geographyId: String(marker.geographyId) })
        : null,
      controlledPlatformUrl:
        lifecycle.state === "controlled-platform" &&
        resolvedOrganizationId &&
        !orientationComplete &&
        activation.acquisitionContext &&
        activation.acquisitionContext.intent.kind !== "direct"
          ? "/acquisition/continue"
          : participantLifecycleDestination(
              lifecycle.state,
              resolvedOrganizationId ? String(resolvedOrganizationId) : null,
              orientationComplete,
            ),
      orientationImplementationPending: false,
      acquisitionContext: activation.acquisitionContext
        ? Object.freeze({
            id: activation.acquisitionContext.id,
            kind: activation.acquisitionContext.intent.kind,
            subjectReference: activation.acquisitionContext.intent.subjectReference,
            sourceChannel: activation.acquisitionContext.source.channel,
            status: "preserved" as const,
          })
        : null,
    });
  }

  async state(context: AuthenticatedServerContext): Promise<ActivationJourneyState> {
    const activation = await this.contextFor(context);
    return this.stateFor(context, activation);
  }

  private nextStep(input: Readonly<{
    activation: ActivationJourneyContext;
    lifecycle: AccessLifecycleRecord;
    emailVerified: boolean;
    selection: GeographyDefinition | null;
    resolutionExists: boolean;
    membershipExists: boolean;
    location: ConfirmedOrganizationLocation | null;
    completion: OrganizationProfileCompletion | null;
    marker: OrganizationMarkerActivation | null;
  }>): ActivationJourneyStep {
    if (!isCurrentActivationLegalAcceptance(input.activation.legalAcceptance)) return "legal";
    if (!input.selection) return "geography";
    if (!input.activation.orientationBridgeAcknowledgedAt) return "orientation";
    if (!input.resolutionExists) return "organization";
    if (!input.membershipExists) {
      return input.emailVerified ? "authority-review" : "email-verification";
    }
    if (!input.location) return "location";
    if (!input.completion || input.completion.status !== "active") return "profile";
    if (!input.marker || input.marker.status !== "active") return "marker";
    return input.lifecycle.state === "controlled-platform" || input.lifecycle.state === "open-platform"
      ? "complete"
      : "marker";
  }
}
