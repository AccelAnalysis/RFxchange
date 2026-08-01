import {
  authorizeOrganizationOperation,
  type OrganizationOperationAuthorizationDependencies,
} from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import type { GeographyDefinitionRepository } from "../../domain/geography/repository.ts";
import {
  projectPublicOrganizationLocation,
  type ConfirmedOrganizationLocation,
  type OrganizationServiceGeography,
} from "../../domain/organization-location/model.ts";
import type {
  ConfirmedOrganizationLocationRepository,
  OrganizationServiceGeographyRepository,
} from "../../domain/organization-location/repository.ts";
import {
  createOrganizationProfileEvent,
  evaluateOrganizationProfileCompletion,
  hydrateEssentialOrganizationProfile,
  projectPublicEssentialOrganizationProfile,
  updateEssentialOrganizationProfile,
  type EssentialOrganizationProfile,
  type OrganizationCapability,
  type OrganizationProfileCompletion,
  type PublicEssentialOrganizationProfile,
} from "../../domain/organization-profile/model.ts";
import type {
  EssentialOrganizationProfileRepositories,
} from "../../domain/organization-profile/repository.ts";
import { organizationId, type OrganizationId } from "../../domain/organizations/model.ts";
import type { OrganizationProfileRepository } from "../../domain/organizations/repository.ts";
import {
  organizationMembershipId,
  type OrganizationMembershipId,
} from "../../domain/users/model.ts";

export interface EssentialOrganizationProfileIdFactory {
  event(): string;
  audit(): string;
}

export interface EssentialOrganizationProfileServiceDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly profiles: OrganizationProfileRepository;
  readonly locations: ConfirmedOrganizationLocationRepository;
  readonly serviceGeographies: OrganizationServiceGeographyRepository;
  readonly geographies: GeographyDefinitionRepository;
  readonly repositories: EssentialOrganizationProfileRepositories;
  readonly ids: EssentialOrganizationProfileIdFactory;
  readonly now: () => string;
}

export interface EssentialOrganizationProfileUpdate {
  readonly displayName: string;
  /** Optional legacy enrichment; never required for Profile Complete. */
  readonly organizationType?: string | null;
  readonly website: Readonly<{
    disposition: "available" | "not-applicable";
    url?: string | null;
    explanation?: string | null;
  }>;
  readonly mainContact: Readonly<{
    displayName: string;
    roleTitle: string;
    email: string;
    phone?: string | null;
    publiclyVisible: boolean;
  }>;
  readonly capabilities: readonly OrganizationCapability[];
  /** Optional legacy metadata; activation no longer collects or requires it. */
  readonly participationRoles?: readonly string[];
  /** Optional legacy metadata; activation no longer collects it. */
  readonly businessObjectives?: readonly string[];
}

export class EssentialOrganizationProfileError extends Error {
  readonly code:
    | "organization-authority-required"
    | "profile-not-found"
    | "profile-scope-mismatch"
    | "location-not-found"
    | "geography-not-found"
    | "completion-not-found";

  constructor(
    code: EssentialOrganizationProfileError["code"],
    message: string,
  ) {
    super(message);
    this.name = "EssentialOrganizationProfileError";
    this.code = code;
  }
}

export class EssentialOrganizationProfileService {
  private readonly dependencies: EssentialOrganizationProfileServiceDependencies;

  constructor(dependencies: EssentialOrganizationProfileServiceDependencies) {
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
      throw new EssentialOrganizationProfileError(
        "organization-authority-required",
        `Essential profile mutation denied: ${decision.reason}.`,
      );
    }
    return decision;
  }

  private async currentInputs(organizationIdValue: OrganizationId) {
    const [profile, location, serviceGeographies, completion] = await Promise.all([
      this.dependencies.profiles.getByOrganizationId(organizationIdValue),
      this.dependencies.locations.getByOrganizationId(organizationIdValue),
      this.dependencies.serviceGeographies.getByOrganizationId(organizationIdValue),
      this.dependencies.repositories.completions.getByOrganizationId(
        organizationIdValue,
      ),
    ]);
    if (!profile) {
      throw new EssentialOrganizationProfileError(
        "profile-not-found",
        "The durable organization profile does not exist.",
      );
    }
    if (profile.organizationId !== organizationIdValue) {
      throw new EssentialOrganizationProfileError(
        "profile-scope-mismatch",
        "The durable profile belongs to another organization.",
      );
    }
    return Object.freeze({
      profile,
      location,
      serviceGeographies,
      completion,
    });
  }

  private async persist(input: Readonly<{
    context: AuthenticatedServerContext;
    organizationId: string;
    membershipId: string;
    update?: EssentialOrganizationProfileUpdate;
    reason: string;
  }>): Promise<Readonly<{
    profile: EssentialOrganizationProfile;
    completion: OrganizationProfileCompletion;
  }>> {
    const organizationIdValue = organizationId(input.organizationId);
    const membershipIdValue = organizationMembershipId(input.membershipId);
    const authorization = await this.authorize({
      context: input.context,
      organizationId: organizationIdValue,
      membershipId: membershipIdValue,
    });
    const current = await this.currentInputs(organizationIdValue);
    const now = this.dependencies.now();
    const profile = input.update
      ? updateEssentialOrganizationProfile(current.profile, {
          ...input.update,
          now,
        })
      : hydrateEssentialOrganizationProfile(current.profile);
    const completion = evaluateOrganizationProfileCompletion({
      profile,
      location: current.location,
      serviceGeographies: current.serviceGeographies,
      prior: current.completion,
      now,
    });
    const kind = input.update
      ? "essential-profile-updated" as const
      : "profile-completion-recalculated" as const;
    const event = createOrganizationProfileEvent({
      id: this.dependencies.ids.event(),
      profile,
      userId: input.context.user.id,
      membershipId: authorization.membership.id,
      kind,
      priorCompletionStatus: current.completion?.status ?? null,
      completion,
      reason: input.reason,
      now,
    });
    const auditEvent = createOrganizationActionAuditEvent(
      input.context.user,
      authorization.membership,
      authorization.organization,
      {
        id: this.dependencies.ids.audit(),
        action: input.update
          ? "organization.profile.essential-updated"
          : "organization.profile.completion-recalculated",
        occurredAt: now,
      },
    );
    await this.dependencies.repositories.unitOfWork.save({
      profile,
      expectedProfileUpdatedAt: current.profile.updatedAt,
      completion,
      event,
      auditEvent,
    });
    return Object.freeze({ profile, completion });
  }

  update(input: Readonly<{
    context: AuthenticatedServerContext;
    organizationId: string;
    membershipId: string;
    profile: EssentialOrganizationProfileUpdate;
    reason: string;
  }>): Promise<Readonly<{
    profile: EssentialOrganizationProfile;
    completion: OrganizationProfileCompletion;
  }>> {
    return this.persist({
      context: input.context,
      organizationId: input.organizationId,
      membershipId: input.membershipId,
      update: input.profile,
      reason: input.reason,
    });
  }

  recalculate(input: Readonly<{
    context: AuthenticatedServerContext;
    organizationId: string;
    membershipId: string;
    reason: string;
  }>): Promise<Readonly<{
    profile: EssentialOrganizationProfile;
    completion: OrganizationProfileCompletion;
  }>> {
    return this.persist(input);
  }

  async publicProfile(
    rawOrganizationId: string,
  ): Promise<PublicEssentialOrganizationProfile> {
    const organizationIdValue = organizationId(rawOrganizationId);
    const [profile, location, completion] = await Promise.all([
      this.dependencies.profiles.getByOrganizationId(organizationIdValue),
      this.dependencies.locations.getByOrganizationId(organizationIdValue),
      this.dependencies.repositories.completions.getByOrganizationId(
        organizationIdValue,
      ),
    ]);
    if (!profile) {
      throw new EssentialOrganizationProfileError(
        "profile-not-found",
        "Organization profile is unavailable.",
      );
    }
    if (!location) {
      throw new EssentialOrganizationProfileError(
        "location-not-found",
        "Confirmed organization location is unavailable.",
      );
    }
    if (!completion) {
      throw new EssentialOrganizationProfileError(
        "completion-not-found",
        "Organization profile completion has not been evaluated.",
      );
    }
    const geography = await this.dependencies.geographies.getById(location.geographyId);
    if (!geography) {
      throw new EssentialOrganizationProfileError(
        "geography-not-found",
        "Canonical location geography is unavailable.",
      );
    }
    return projectPublicEssentialOrganizationProfile({
      profile: hydrateEssentialOrganizationProfile(profile),
      completion,
      location: projectPublicOrganizationLocation(location, geography),
    });
  }
}

export type EssentialProfileLocationInputs = Readonly<{
  location: ConfirmedOrganizationLocation | null;
  serviceGeographies: OrganizationServiceGeography | null;
}>;
