import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import {
  authorizeOrganizationOperation,
  type OrganizationOperationAuthorizationDependencies,
} from "../auth/authorize-organization-operation.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import { evaluateGeographyParticipation } from "../../domain/geography/policy.ts";
import type {
  GeographyDefinitionRepository,
  GeographyParticipationAuthorizationRepository,
} from "../../domain/geography/repository.ts";
import type { AccessRestrictionRepository } from "../../domain/lifecycle/repository.ts";
import type {
  ConfirmedOrganizationLocation,
} from "../../domain/organization-location/model.ts";
import type {
  ConfirmedOrganizationLocationRepository,
} from "../../domain/organization-location/repository.ts";
import type {
  OrganizationProfileCompletionRepository,
} from "../../domain/organization-profile/repository.ts";
import {
  createOrganizationMarkerEvent,
  evaluateOrganizationMarkerActivation,
  type OrganizationMarkerActivation,
} from "../../domain/organization-markers/model.ts";
import type {
  OrganizationMarkerRepositories,
} from "../../domain/organization-markers/repository.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type { OrganizationMembershipId } from "../../domain/users/model.ts";

export interface MarkerActivationDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly geographies: GeographyDefinitionRepository;
  readonly geographyAuthorizations: GeographyParticipationAuthorizationRepository;
  readonly locations: ConfirmedOrganizationLocationRepository;
  readonly completions: OrganizationProfileCompletionRepository;
  readonly restrictions: AccessRestrictionRepository;
  readonly markers: OrganizationMarkerRepositories;
}

export class OrganizationMarkerActivationService {
  private readonly dependencies: MarkerActivationDependencies;

  constructor(dependencies: MarkerActivationDependencies) {
    this.dependencies = dependencies;
  }

  async recalculate(input: Readonly<{
    context: AuthenticatedServerContext | null;
    organizationId: OrganizationId;
    membershipId: OrganizationMembershipId;
    eventId: string;
    auditEventId: string;
    reason: string;
    now: string;
  }>): Promise<OrganizationMarkerActivation> {
    const authorization = await authorizeOrganizationOperation(
      {
        context: input.context,
        organizationId: input.organizationId,
        membershipId: input.membershipId,
        permission: "organization.profile.manage",
      },
      this.dependencies.authorization,
    );
    if (!authorization.allowed) {
      throw new Error(`Organization marker recalculation denied: ${authorization.reason}.`);
    }

    const [location, completion, prior, restriction] = await Promise.all([
      this.dependencies.locations.getByOrganizationId(input.organizationId),
      this.dependencies.completions.getByOrganizationId(input.organizationId),
      this.dependencies.markers.activations.getByOrganizationId(input.organizationId),
      this.dependencies.restrictions.getForOrganization(input.organizationId),
    ]);
    if (!location) {
      throw new Error("Organization marker recalculation requires a confirmed canonical location.");
    }
    const geography = await this.dependencies.geographies.getById(location.geographyId);
    if (!geography) {
      throw new Error("Organization marker geography no longer exists.");
    }
    const geographyAuthorizations =
      await this.dependencies.geographyAuthorizations.listByUserAndGeography(
        authorization.context.user.id,
        geography.id,
      );
    const participation = evaluateGeographyParticipation(
      geography,
      authorization.context.user.id,
      "organization-activation",
      geographyAuthorizations,
      input.now,
    );
    const activation = evaluateOrganizationMarkerActivation({
      organization: authorization.organization,
      relationshipAuthorized: true,
      geography,
      participation,
      location: location as ConfirmedOrganizationLocation,
      profileCompletion: completion,
      restriction,
      prior,
      now: input.now,
    });
    const transitioned = prior?.status !== activation.status;
    const event = transitioned
      ? createOrganizationMarkerEvent({
          id: input.eventId,
          activation,
          priorStatus: prior?.status ?? null,
          reason: input.reason,
          now: input.now,
        })
      : null;
    const auditEvent = transitioned
      ? createOrganizationActionAuditEvent(
          authorization.context.user,
          authorization.membership,
          authorization.organization,
          {
            id: input.auditEventId,
            action:
              activation.status === "active"
                ? "organization.marker.activated"
                : "organization.marker.deactivated",
            occurredAt: input.now,
          },
        )
      : null;
    await this.dependencies.markers.unitOfWork.save({
      activation,
      event,
      auditEvent,
    });
    return activation;
  }
}
