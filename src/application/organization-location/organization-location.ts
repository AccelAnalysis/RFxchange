import {
  authorizeOrganizationOperation,
  type OrganizationOperationAuthorizationDependencies,
} from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import type { AuthoritativeBoundaryGeometryRepository } from "../../domain/geography/boundary-repository.ts";
import { evaluateGeographyParticipation } from "../../domain/geography/policy.ts";
import { geographyId } from "../../domain/geography/model.ts";
import type {
  GeographyDefinitionRepository,
  GeographyParticipationAuthorizationRepository,
  PrimaryOperatingGeographySelectionRepository,
} from "../../domain/geography/repository.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import type { OrganizationMembershipId } from "../../domain/users/model.ts";
import { organizationMembershipId } from "../../domain/users/model.ts";
import type { OrganizationGeocodingProvider } from "../../domain/organization-location/geocoding.ts";
import {
  changeConfirmedLocationVisibility,
  confirmOrganizationLocationDraft,
  createConfirmedOrganizationLocation,
  createOrganizationGeocodeCandidate,
  createOrganizationLocationDraft,
  createOrganizationLocationEvent,
  createOrganizationServiceGeography,
  geographicPositionWithinBoundary,
  organizationLocationDraftId,
  type ConfirmedOrganizationLocation,
  type OrganizationLocationDraft,
  type OrganizationServiceGeography,
  type StructuredPostalAddress,
} from "../../domain/organization-location/model.ts";
import type { OrganizationLocationRepositories } from "../../domain/organization-location/repository.ts";

export interface OrganizationLocationIdFactory {
  draft(): string;
  event(): string;
  audit(): string;
}

export interface OrganizationLocationServiceDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly selections: PrimaryOperatingGeographySelectionRepository;
  readonly geographies: GeographyDefinitionRepository;
  readonly geographyAuthorizations: GeographyParticipationAuthorizationRepository;
  readonly boundaries: AuthoritativeBoundaryGeometryRepository;
  readonly geocoder: OrganizationGeocodingProvider;
  readonly repositories: OrganizationLocationRepositories;
  readonly ids: OrganizationLocationIdFactory;
  readonly now: () => string;
}

export class OrganizationLocationError extends Error {
  readonly code:
    | "organization-authority-required"
    | "primary-geography-required"
    | "geography-unavailable"
    | "geography-not-permitted"
    | "boundary-unavailable"
    | "geocode-no-candidates"
    | "geocode-outside-primary-geography"
    | "draft-not-found"
    | "draft-scope-mismatch"
    | "candidate-not-confirmed"
    | "service-geography-invalid";

  constructor(code: OrganizationLocationError["code"], message: string) {
    super(message);
    this.name = "OrganizationLocationError";
    this.code = code;
  }
}

export class OrganizationLocationService {
  private readonly dependencies: OrganizationLocationServiceDependencies;

  constructor(dependencies: OrganizationLocationServiceDependencies) {
    this.dependencies = dependencies;
  }

  private async authorize(input: Readonly<{
    context: AuthenticatedServerContext;
    organizationId: OrganizationId;
    membershipId: OrganizationMembershipId;
  }>) {
    const decision = await authorizeOrganizationOperation(
      {
        context: input.context,
        organizationId: input.organizationId,
        membershipId: input.membershipId,
        permission: "organization.profile.manage",
      },
      this.dependencies.authorization,
    );
    if (!decision.allowed) {
      throw new OrganizationLocationError(
        "organization-authority-required",
        `Organization location mutation denied: ${decision.reason}.`,
      );
    }
    return decision;
  }

  private async primaryGeography(context: AuthenticatedServerContext) {
    const selection = await this.dependencies.selections.getByUserId(context.user.id);
    if (!selection) {
      throw new OrganizationLocationError(
        "primary-geography-required",
        "A persisted primary operating geography is required.",
      );
    }
    const geography = await this.dependencies.geographies.getById(selection.geographyId);
    if (!geography) {
      throw new OrganizationLocationError(
        "geography-unavailable",
        "The selected canonical geography no longer exists.",
      );
    }
    const grants = await this.dependencies.geographyAuthorizations.listByUserAndGeography(
      context.user.id,
      geography.id,
    );
    const participation = evaluateGeographyParticipation(
      geography,
      context.user.id,
      "organization-activation",
      grants,
      this.dependencies.now(),
    );
    if (!participation.allowed) {
      throw new OrganizationLocationError(
        "geography-not-permitted",
        `Organization location is not permitted in the selected geography: ${participation.reason}.`,
      );
    }
    return Object.freeze({ selection, geography });
  }

  async beginConfirmation(input: Readonly<{
    context: AuthenticatedServerContext;
    organizationId: string;
    membershipId: string;
    physicalAddress: StructuredPostalAddress;
    mailingAddress?: StructuredPostalAddress | null;
    isHomeOrPrivate: boolean;
    visibility?: string;
    reason: string;
  }>): Promise<OrganizationLocationDraft> {
    const organizationIdValue = organizationId(input.organizationId);
    const membershipIdValue = organizationMembershipId(input.membershipId);
    const [authorized, primary] = await Promise.all([
      this.authorize({
        context: input.context,
        organizationId: organizationIdValue,
        membershipId: membershipIdValue,
      }),
      this.primaryGeography(input.context),
    ]);
    const boundary = await this.dependencies.boundaries.getByGeographyId(primary.geography.id);
    if (!boundary) {
      throw new OrganizationLocationError(
        "boundary-unavailable",
        "Authoritative boundary geometry is required to validate a geocode candidate.",
      );
    }
    const draftId = this.dependencies.ids.draft();
    const providerCandidates = await this.dependencies.geocoder.locate({
      address: input.physicalAddress,
      correlationId: draftId,
    });
    if (providerCandidates.length === 0) {
      throw new OrganizationLocationError(
        "geocode-no-candidates",
        "The address did not produce a geocode candidate.",
      );
    }
    const candidates = providerCandidates
      .filter((candidate) =>
        geographicPositionWithinBoundary(candidate.coordinate, boundary.geometry)
      )
      .map((candidate) =>
        createOrganizationGeocodeCandidate({
          id: `${draftId}:${candidate.providerCandidateId}`,
          geographyId: primary.geography.id,
          coordinate: candidate.coordinate,
          matchedAddress: candidate.matchedAddress,
          quality: candidate.quality,
          provider: candidate.provider,
          providerReference: candidate.providerReference,
          benchmark: candidate.benchmark,
          retrievedAt: candidate.retrievedAt,
        })
      );
    if (candidates.length === 0) {
      throw new OrganizationLocationError(
        "geocode-outside-primary-geography",
        "No geocode candidate falls within the authoritative selected locality.",
      );
    }
    const now = this.dependencies.now();
    const draft = createOrganizationLocationDraft({
      id: draftId,
      organizationId: organizationIdValue,
      requestedByUserId: input.context.user.id,
      membershipId: membershipIdValue,
      primaryGeographyId: primary.geography.id,
      physicalAddress: input.physicalAddress,
      mailingAddress: input.mailingAddress,
      isHomeOrPrivate: input.isHomeOrPrivate,
      visibility: input.visibility,
      candidates,
      now,
    });
    const event = createOrganizationLocationEvent({
      id: this.dependencies.ids.event(),
      organizationId: organizationIdValue,
      userId: input.context.user.id,
      membershipId: membershipIdValue,
      kind: "address-geocoded",
      subjectId: draft.id,
      newState: {
        state: draft.state,
        primaryGeographyId: draft.primaryGeographyId,
        candidateCount: draft.candidates.length,
        visibility: draft.visibility,
      },
      reason: input.reason,
      now,
    });
    await this.dependencies.repositories.drafts.save(draft, event);
    void authorized;
    return draft;
  }

  async confirm(input: Readonly<{
    context: AuthenticatedServerContext;
    organizationId: string;
    membershipId: string;
    draftId: string;
    candidateId: string;
    reason: string;
  }>): Promise<ConfirmedOrganizationLocation> {
    const organizationIdValue = organizationId(input.organizationId);
    const membershipIdValue = organizationMembershipId(input.membershipId);
    const [authorized, primary, draft] = await Promise.all([
      this.authorize({
        context: input.context,
        organizationId: organizationIdValue,
        membershipId: membershipIdValue,
      }),
      this.primaryGeography(input.context),
      this.dependencies.repositories.drafts.getById(
        organizationLocationDraftId(input.draftId),
      ),
    ]);
    if (!draft) {
      throw new OrganizationLocationError("draft-not-found", "Location draft was not found.");
    }
    if (
      draft.organizationId !== organizationIdValue ||
      draft.requestedByUserId !== input.context.user.id ||
      draft.membershipId !== membershipIdValue ||
      draft.primaryGeographyId !== primary.geography.id
    ) {
      throw new OrganizationLocationError(
        "draft-scope-mismatch",
        "Location draft does not match the authenticated organization and geography scope.",
      );
    }
    let confirmation: ReturnType<typeof confirmOrganizationLocationDraft>;
    try {
      confirmation = confirmOrganizationLocationDraft(
        draft,
        input.candidateId,
        this.dependencies.now(),
      );
    } catch (error) {
      throw new OrganizationLocationError(
        "candidate-not-confirmed",
        error instanceof Error ? error.message : "Location candidate could not be confirmed.",
      );
    }
    const now = this.dependencies.now();
    const location = createConfirmedOrganizationLocation({
      draft: confirmation.draft,
      candidate: confirmation.candidate,
      confirmedByUserId: input.context.user.id,
      confirmedByMembershipId: membershipIdValue,
      now,
    });
    const event = createOrganizationLocationEvent({
      id: this.dependencies.ids.event(),
      organizationId: organizationIdValue,
      userId: input.context.user.id,
      membershipId: membershipIdValue,
      kind: "location-confirmed",
      subjectId: location.id,
      newState: {
        geographyId: location.geographyId,
        visibility: location.visibility,
        geocodeQuality: location.geocodeQuality,
        confirmed: true,
      },
      reason: input.reason,
      now,
    });
    const auditEvent = createOrganizationActionAuditEvent(
      input.context.user,
      authorized.membership,
      authorized.organization,
      {
        id: this.dependencies.ids.audit(),
        action: "organization.location.confirmed",
        occurredAt: now,
      },
    );
    await this.dependencies.repositories.unitOfWork.confirm({
      draft: confirmation.draft,
      location,
      event,
      auditEvent,
    });
    return location;
  }

  async changeVisibility(input: Readonly<{
    context: AuthenticatedServerContext;
    organizationId: string;
    membershipId: string;
    visibility: string;
    reason: string;
  }>): Promise<ConfirmedOrganizationLocation> {
    const organizationIdValue = organizationId(input.organizationId);
    const membershipIdValue = organizationMembershipId(input.membershipId);
    const [authorized, existing] = await Promise.all([
      this.authorize({
        context: input.context,
        organizationId: organizationIdValue,
        membershipId: membershipIdValue,
      }),
      this.dependencies.repositories.locations.getByOrganizationId(organizationIdValue),
    ]);
    if (!existing) {
      throw new OrganizationLocationError(
        "candidate-not-confirmed",
        "A confirmed canonical location is required before visibility may change.",
      );
    }
    const now = this.dependencies.now();
    const location = changeConfirmedLocationVisibility(existing, input.visibility, now);
    const event = createOrganizationLocationEvent({
      id: this.dependencies.ids.event(),
      organizationId: organizationIdValue,
      userId: input.context.user.id,
      membershipId: membershipIdValue,
      kind: "visibility-changed",
      subjectId: location.id,
      priorState: { visibility: existing.visibility },
      newState: { visibility: location.visibility },
      reason: input.reason,
      now,
    });
    const auditEvent = createOrganizationActionAuditEvent(
      input.context.user,
      authorized.membership,
      authorized.organization,
      {
        id: this.dependencies.ids.audit(),
        action: "organization.location.visibility-changed",
        occurredAt: now,
      },
    );
    await this.dependencies.repositories.unitOfWork.changeVisibility({
      location,
      event,
      auditEvent,
    });
    return location;
  }

  async saveServiceGeographies(input: Readonly<{
    context: AuthenticatedServerContext;
    organizationId: string;
    membershipId: string;
    serviceGeographyIds: readonly string[];
    reason: string;
  }>): Promise<OrganizationServiceGeography> {
    const organizationIdValue = organizationId(input.organizationId);
    const membershipIdValue = organizationMembershipId(input.membershipId);
    const [authorized, primary, existing] = await Promise.all([
      this.authorize({
        context: input.context,
        organizationId: organizationIdValue,
        membershipId: membershipIdValue,
      }),
      this.primaryGeography(input.context),
      this.dependencies.repositories.serviceGeographies.getByOrganizationId(
        organizationIdValue,
      ),
    ]);
    const serviceGeographies = [];
    for (const rawId of input.serviceGeographyIds) {
      const geography = await this.dependencies.geographies.getById(
        geographyId(rawId),
      );
      if (!geography) {
        throw new OrganizationLocationError(
          "service-geography-invalid",
          `Unknown canonical service geography: ${rawId}.`,
        );
      }
      const grants = await this.dependencies.geographyAuthorizations.listByUserAndGeography(
        input.context.user.id,
        geography.id,
      );
      const participation = evaluateGeographyParticipation(
        geography,
        input.context.user.id,
        "network-participation",
        grants,
        this.dependencies.now(),
      );
      if (!participation.allowed) {
        throw new OrganizationLocationError(
          "service-geography-invalid",
          `Service geography is not available for participation: ${geography.id}.`,
        );
      }
      serviceGeographies.push(geography.id);
    }
    const now = this.dependencies.now();
    const record = createOrganizationServiceGeography({
      organizationId: organizationIdValue,
      primaryGeographyId: primary.geography.id,
      serviceGeographyIds: serviceGeographies,
      updatedByUserId: input.context.user.id,
      updatedByMembershipId: membershipIdValue,
      now,
    });
    const event = createOrganizationLocationEvent({
      id: this.dependencies.ids.event(),
      organizationId: organizationIdValue,
      userId: input.context.user.id,
      membershipId: membershipIdValue,
      kind: "service-geographies-changed",
      subjectId: record.id,
      priorState: existing
        ? { serviceGeographyIds: existing.serviceGeographyIds }
        : null,
      newState: {
        primaryGeographyId: record.primaryGeographyId,
        serviceGeographyIds: record.serviceGeographyIds,
      },
      reason: input.reason,
      now,
    });
    const auditEvent = createOrganizationActionAuditEvent(
      input.context.user,
      authorized.membership,
      authorized.organization,
      {
        id: this.dependencies.ids.audit(),
        action: "organization.service-geographies.changed",
        occurredAt: now,
      },
    );
    await this.dependencies.repositories.unitOfWork.saveServiceGeographies({
      serviceGeographies: record,
      event,
      auditEvent,
    });
    return record;
  }
}
