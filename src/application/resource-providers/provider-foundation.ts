import { createHash, randomUUID } from "node:crypto";

import { authorizeOrganizationOperation, type OrganizationOperationAuthorizationDependencies } from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import { createPlatformAdministrativeAuditEvent } from "../../domain/admin-authorization/admin-audit.ts";
import type { AdminGrantScope } from "../../domain/admin-authorization/grants.ts";
import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import { organizationId, type OrganizationProfile } from "../../domain/organizations/model.ts";
import type { OrganizationProfileRepository } from "../../domain/organizations/repository.ts";
import type { ConfirmedOrganizationLocationRepository, OrganizationServiceGeographyRepository } from "../../domain/organization-location/repository.ts";
import type { OrganizationProfileCompletionRepository } from "../../domain/organization-profile/repository.ts";
import { hydrateEssentialOrganizationProfile } from "../../domain/organization-profile/model.ts";
import {
  createProviderApplication,
  createProviderServiceProfile,
  transitionProviderApplication,
  updateProviderDraft,
  updateProviderServiceProfile,
  type OfficialResourceProviderApplication,
  type OfficialResourceProviderStatus,
  type ProviderApplicationContent,
  type ProviderApplicationEvent,
  type ProviderApplicationEventKind,
  type ProviderServiceProfile,
} from "../../domain/resource-providers/model.ts";
import type { ResourceProviderRepository } from "../../domain/resource-providers/repository.ts";
import { organizationMembershipId } from "../../domain/users/model.ts";

export class ResourceProviderFoundationError extends Error {
  readonly code: "forbidden" | "invalid" | "not-found" | "conflict" | "profile-incomplete";
  constructor(code: ResourceProviderFoundationError["code"], message: string) {
    super(message); this.name = "ResourceProviderFoundationError"; this.code = code;
  }
}

export interface ProviderParticipantScope {
  readonly context: AuthenticatedServerContext | null;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly commandId: string;
}

export interface ProviderAdminScope {
  readonly context: AuthenticatedServerContext;
  readonly authority: PlatformAdministratorAuthorityContext;
  readonly administratorId: string;
  readonly permission: "provider.application.read" | "provider.application.review";
  readonly scope: AdminGrantScope;
  readonly commandId: string;
}

interface ProviderEvidenceOwnershipReader {
  allBelongToOrganization(organizationId: string, assetIds: readonly string[]): Promise<boolean>;
}

export interface ResourceProviderFoundationDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly profiles: OrganizationProfileRepository;
  readonly completions: OrganizationProfileCompletionRepository;
  readonly locations: ConfirmedOrganizationLocationRepository;
  readonly serviceGeographies: OrganizationServiceGeographyRepository;
  readonly evidence: ProviderEvidenceOwnershipReader;
  readonly repository: ResourceProviderRepository;
  readonly now?: () => string;
  readonly id?: () => string;
}

function fingerprint(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

function profileUpdatedAt(profile: OrganizationProfile): string {
  const value = profile.updatedAt;
  return typeof value === "string" ? value : new Date(value).toISOString();
}

export class ResourceProviderFoundationService {
  private readonly dependencies: ResourceProviderFoundationDependencies;
  private readonly now: () => string;
  private readonly id: () => string;
  constructor(dependencies: ResourceProviderFoundationDependencies) {
    this.dependencies = dependencies;
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.id = dependencies.id ?? randomUUID;
  }

  private async authorizeParticipant(scope: ProviderParticipantScope) {
    const decision = await authorizeOrganizationOperation({ context: scope.context, organizationId: organizationId(scope.organizationId), membershipId: organizationMembershipId(scope.membershipId), permission: "resource.manage" }, this.dependencies.authorization);
    if (!decision.allowed) throw new ResourceProviderFoundationError("forbidden", `Resource Provider access denied: ${decision.reason}.`);
    return decision;
  }

  private async authoritativeReferences(organizationIdValue: string) {
    const id = organizationId(organizationIdValue);
    const [profile, completion, location, serviceGeography] = await Promise.all([
      this.dependencies.profiles.getByOrganizationId(id), this.dependencies.completions.getByOrganizationId(id),
      this.dependencies.locations.getByOrganizationId(id), this.dependencies.serviceGeographies.getByOrganizationId(id),
    ]);
    if (!profile || !location || !serviceGeography) throw new ResourceProviderFoundationError("profile-incomplete", "Complete the organization profile, confirmed location, and service geography first.");
    if (!completion || completion.status !== "active") throw new ResourceProviderFoundationError("profile-incomplete", "Profile Complete is required before requesting Resource Provider status.");
    return Object.freeze({
      profile,
      references: Object.freeze({ organizationId: id, profileId: profile.id, locationId: location.id, serviceGeographyId: serviceGeography.id, sourceProfileUpdatedAt: profileUpdatedAt(profile), sourceLocationUpdatedAt: String(location.updatedAt), sourceServiceGeographyUpdatedAt: String(serviceGeography.updatedAt) }),
      location,
      serviceGeography,
    });
  }

  private event(input: Readonly<{ application: OfficialResourceProviderApplication; kind: ProviderApplicationEventKind; from: OfficialResourceProviderApplication["status"] | null; actorKind: "participant" | "administrator"; actorId: string; commandId: string; note?: string | null; now: string }>): ProviderApplicationEvent {
    return Object.freeze({ id: `provider_event_${this.id()}` as ProviderApplicationEvent["id"], applicationId: input.application.id, organizationId: input.application.organizationId, kind: input.kind, fromStatus: input.from, toStatus: input.application.status, aggregateVersion: input.application.version, actorKind: input.actorKind, actorId: input.actorId, note: input.note?.trim() || null, commandId: input.commandId, occurredAt: input.now });
  }

  private async replay(scope: ProviderParticipantScope | ProviderAdminScope, action: ProviderApplicationEventKind, requestFingerprint: string, expectedOrganizationId: string) {
    const prior = await this.dependencies.repository.getCommand(scope.commandId);
    if (!prior) return null;
    if (prior.action !== action || prior.requestFingerprint !== requestFingerprint) throw new ResourceProviderFoundationError("conflict", "This command identity was already used for another Resource Provider action.");
    if (String(prior.organizationId) !== expectedOrganizationId) throw new ResourceProviderFoundationError("forbidden", "This Resource Provider command belongs to another organization.");
    const application = await this.dependencies.repository.getApplicationByOrganizationId(prior.organizationId);
    if (!application) throw new ResourceProviderFoundationError("not-found", "The prior Resource Provider result is unavailable.");
    return Object.freeze({ replayed: true as const, receipt: prior, application });
  }

  async participantSnapshot(scope: Omit<ProviderParticipantScope, "commandId">) {
    const authorization = await this.authorizeParticipant({ ...scope, commandId: "snapshot" });
    const authoritative = await this.authoritativeReferences(scope.organizationId);
    const [application, providerStatus, serviceProfile] = await Promise.all([
      this.dependencies.repository.getApplicationByOrganizationId(authorization.organization.id),
      this.dependencies.repository.getStatusByOrganizationId(authorization.organization.id),
      this.dependencies.repository.getServiceProfileByOrganizationId(authorization.organization.id),
    ]);
    const history = application ? await this.dependencies.repository.listEvents(application.id) : [];
    const essential = hydrateEssentialOrganizationProfile(authoritative.profile);
    return Object.freeze({ organization: Object.freeze({ id: String(authorization.organization.id), displayName: authoritative.profile.displayName, profileId: String(authoritative.profile.id), website: essential.website, primaryContact: essential.mainContact, locationId: String(authoritative.location.id), serviceGeographyId: String(authoritative.serviceGeography.id) }), application, providerStatus, serviceProfile, history });
  }

  async saveDraft(scope: ProviderParticipantScope, input: Readonly<{ expectedVersion: number | null; content: ProviderApplicationContent; response?: string | null }>) {
    const requestFingerprint = fingerprint(input);
    const action = input.response?.trim() ? "response-saved" : "draft-saved";
    const authorization = await this.authorizeParticipant(scope);
    const prior = await this.replay(scope, action, requestFingerprint, scope.organizationId); if (prior) return prior;
    if (!(await this.dependencies.evidence.allBelongToOrganization(scope.organizationId, input.content.evidenceAssetIds))) throw new ResourceProviderFoundationError("forbidden", "One or more evidence references belong to another organization or are unavailable.");
    const authoritative = await this.authoritativeReferences(scope.organizationId);
    const current = await this.dependencies.repository.getApplicationByOrganizationId(authorization.organization.id);
    const now = this.now();
    let application: OfficialResourceProviderApplication;
    try {
      if (!current || current.status === "denied") {
        if (input.expectedVersion !== null && input.expectedVersion !== (current?.version ?? null)) throw new Error("Provider application changed; reload the current version.");
        const created = createProviderApplication({ organizationId: authorization.organization.id, references: authoritative.references, content: input.content, applicant: { userId: authorization.context.user.id, membershipId: authorization.membership.id }, now, applicationNumber: (current?.applicationNumber ?? 0) + 1 });
        application = current ? Object.freeze({ ...created, version: current.version + 1 }) : created;
      } else {
        if (input.expectedVersion === null) throw new Error("Expected application version is required.");
        application = updateProviderDraft({ current, expectedVersion: input.expectedVersion, references: authoritative.references, content: input.content, applicant: { userId: authorization.context.user.id, membershipId: authorization.membership.id }, response: input.response, now });
      }
    } catch (error) { throw new ResourceProviderFoundationError("conflict", error instanceof Error ? error.message : "Provider application draft could not be saved."); }
    const receipt = Object.freeze({ id: scope.commandId, applicationId: application.id, organizationId: application.organizationId, action, requestFingerprint, resultingVersion: application.version, recordedAt: now });
    await this.dependencies.repository.saveParticipant({ application, expectedVersion: current?.version ?? null, event: this.event({ application, kind: action, from: current?.status ?? null, actorKind: "participant", actorId: String(authorization.context.user.id), commandId: scope.commandId, now }), command: receipt, audit: createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: action === "response-saved" ? "resource-provider.application.response-saved" : "resource-provider.application.saved", occurredAt: now }) });
    return Object.freeze({ replayed: false as const, receipt, application });
  }

  async participantTransition(scope: ProviderParticipantScope, input: Readonly<{ action: "submitted" | "resubmitted"; expectedVersion: number }>) {
    const requestFingerprint = fingerprint(input); const authorization = await this.authorizeParticipant(scope);
    const prior = await this.replay(scope, input.action, requestFingerprint, scope.organizationId); if (prior) return prior;
    await this.authoritativeReferences(scope.organizationId);
    const current = await this.dependencies.repository.getApplicationByOrganizationId(authorization.organization.id);
    if (!current) throw new ResourceProviderFoundationError("not-found", "Resource Provider application is unavailable.");
    const now = this.now(); let application: OfficialResourceProviderApplication;
    try { application = transitionProviderApplication({ current, expectedVersion: input.expectedVersion, action: input.action, now }); }
    catch (error) { throw new ResourceProviderFoundationError("conflict", error instanceof Error ? error.message : "Provider application could not transition."); }
    const receipt = Object.freeze({ id: scope.commandId, applicationId: application.id, organizationId: application.organizationId, action: input.action, requestFingerprint, resultingVersion: application.version, recordedAt: now });
    await this.dependencies.repository.saveParticipant({ application, expectedVersion: current.version, event: this.event({ application, kind: input.action, from: current.status, actorKind: "participant", actorId: String(authorization.context.user.id), commandId: scope.commandId, now }), command: receipt, audit: createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: `resource-provider.application.${input.action}`, occurredAt: now }) });
    return Object.freeze({ replayed: false as const, receipt, application });
  }

  async updateServiceProfile(scope: ProviderParticipantScope, input: Readonly<Omit<Parameters<typeof updateProviderServiceProfile>[0], "current" | "actor" | "now" | "serviceGeographyId">>) {
    const requestFingerprint = fingerprint(input); const authorization = await this.authorizeParticipant(scope);
    const prior = await this.replay(scope, "service-profile-updated", requestFingerprint, scope.organizationId); if (prior) return prior;
    const authoritative = await this.authoritativeReferences(scope.organizationId);
    const [application, current] = await Promise.all([this.dependencies.repository.getApplicationByOrganizationId(authorization.organization.id), this.dependencies.repository.getServiceProfileByOrganizationId(authorization.organization.id)]);
    if (!application || application.status !== "approved" || !current) throw new ResourceProviderFoundationError("forbidden", "An approved Official Resource Provider application is required.");
    const now = this.now(); let serviceProfile: ProviderServiceProfile;
    try { serviceProfile = updateProviderServiceProfile({ ...input, current, serviceGeographyId: authoritative.serviceGeography.id, actor: { userId: authorization.context.user.id, membershipId: authorization.membership.id }, now }); }
    catch (error) { throw new ResourceProviderFoundationError("conflict", error instanceof Error ? error.message : "Provider service profile could not be updated."); }
    const receipt = Object.freeze({ id: scope.commandId, applicationId: application.id, organizationId: application.organizationId, action: "service-profile-updated" as const, requestFingerprint, resultingVersion: serviceProfile.version, recordedAt: now });
    await this.dependencies.repository.saveParticipant({ application, expectedVersion: application.version, serviceProfile, event: this.event({ application, kind: "service-profile-updated", from: application.status, actorKind: "participant", actorId: String(authorization.context.user.id), commandId: scope.commandId, now }), command: receipt, audit: createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: "resource-provider.profile.updated", occurredAt: now }) });
    return Object.freeze({ replayed: false as const, receipt, application, serviceProfile });
  }

  private assertAdmin(scope: ProviderAdminScope, permission: ProviderAdminScope["permission"], organizationIdValue?: string) {
    if (scope.permission !== permission || !scope.authority.effectivePermissions.some((value) => String(value) === permission)) throw new ResourceProviderFoundationError("forbidden", `Administrative ${permission} permission is required.`);
    const value = String(scope.scope.value);
    if (organizationIdValue && value !== "GLOBAL" && value !== `ORGANIZATION:${organizationIdValue}`) throw new ResourceProviderFoundationError("forbidden", "Administrative grant does not cover this organization.");
  }

  async adminQueue(scope: ProviderAdminScope) {
    this.assertAdmin(scope, "provider.application.read");
    const applications = await this.dependencies.repository.listApplications();
    const value = String(scope.scope.value);
    return Object.freeze(applications.filter((application) => value === "GLOBAL" || value === `ORGANIZATION:${application.organizationId}`).map((application) => Object.freeze({ id: String(application.id), organizationId: String(application.organizationId), status: application.status, version: application.version, categories: application.content.categories, submittedAt: application.submittedAt, updatedAt: application.updatedAt })));
  }

  async adminDetail(scope: ProviderAdminScope, organizationIdValue: string) {
    this.assertAdmin(scope, "provider.application.read", organizationIdValue);
    const application = await this.dependencies.repository.getApplicationByOrganizationId(organizationId(organizationIdValue));
    if (!application) throw new ResourceProviderFoundationError("not-found", "Resource Provider application is unavailable.");
    const [profile, location, serviceGeography, completion, history, providerStatus, serviceProfile] = await Promise.all([this.dependencies.profiles.getByOrganizationId(application.organizationId), this.dependencies.locations.getByOrganizationId(application.organizationId), this.dependencies.serviceGeographies.getByOrganizationId(application.organizationId), this.dependencies.completions.getByOrganizationId(application.organizationId), this.dependencies.repository.listEvents(application.id), this.dependencies.repository.getStatusByOrganizationId(application.organizationId), this.dependencies.repository.getServiceProfileByOrganizationId(application.organizationId)]);
    const essential = profile ? hydrateEssentialOrganizationProfile(profile) : null;
    return Object.freeze({ application, organization: profile ? Object.freeze({ id: String(application.organizationId), displayName: profile.displayName, profileId: String(profile.id), website: essential?.website ?? null, primaryContact: essential?.mainContact ?? null }) : null, location: location ? Object.freeze({ id: String(location.id), geographyId: String(location.geographyId), visibility: location.visibility }) : null, serviceGeography: serviceGeography ? Object.freeze({ id: String(serviceGeography.id), geographyIds: serviceGeography.serviceGeographyIds.map(String) }) : null, profileComplete: completion?.status === "active", history, providerStatus, serviceProfile });
  }

  async adminTransition(scope: ProviderAdminScope, input: Readonly<{ organizationId: string; action: "review-started" | "information-requested" | "approved" | "denied"; expectedVersion: number; note?: string | null }>) {
    this.assertAdmin(scope, "provider.application.review", input.organizationId);
    const requestFingerprint = fingerprint(input); const prior = await this.replay(scope, input.action, requestFingerprint, input.organizationId); if (prior) return prior;
    const current = await this.dependencies.repository.getApplicationByOrganizationId(organizationId(input.organizationId));
    if (!current) throw new ResourceProviderFoundationError("not-found", "Resource Provider application is unavailable.");
    const now = this.now(); let application: OfficialResourceProviderApplication;
    try { application = transitionProviderApplication({ current, expectedVersion: input.expectedVersion, action: input.action, note: input.note, administratorId: scope.administratorId, now }); }
    catch (error) { throw new ResourceProviderFoundationError("conflict", error instanceof Error ? error.message : "Provider review action could not be completed."); }
    const receipt = Object.freeze({ id: scope.commandId, applicationId: application.id, organizationId: application.organizationId, action: input.action, requestFingerprint, resultingVersion: application.version, recordedAt: now });
    const approved = input.action === "approved";
    const status: OfficialResourceProviderStatus | null = approved ? Object.freeze({ id: String(application.organizationId), organizationId: application.organizationId, status: "official-resource-provider", sourceApplicationId: application.id, sourceApplicationVersion: application.version, approvedAt: now, approvedByAdministratorId: scope.administratorId }) : null;
    const serviceProfile = approved ? createProviderServiceProfile(application, now) : null;
    const audit = createPlatformAdministrativeAuditEvent(scope.authority, { id: `admin_audit_${this.id()}`, permissionsExercised: ["provider.application.review"], target: { organizationId: input.organizationId, objectType: "official-resource-provider-application", objectId: String(application.id) }, action: `provider.application.${input.action}`, priorState: { status: current.status, version: current.version }, newState: { status: application.status, version: application.version }, reason: input.note?.trim() || `Provider application ${input.action}.`, occurredAt: now, securityContext: { authenticationSubject: scope.context.authentication.subject, provider: scope.context.authentication.provider, reauthenticatedAt: scope.context.authentication.authenticatedAt }, evidenceReferences: application.content.evidenceAssetIds });
    await this.dependencies.repository.saveAdministrative({ application, expectedVersion: current.version, event: this.event({ application, kind: input.action, from: current.status, actorKind: "administrator", actorId: scope.administratorId, commandId: scope.commandId, note: input.note, now }), command: receipt, audit, status, serviceProfile });
    return Object.freeze({ replayed: false as const, receipt, application, providerStatus: status, serviceProfile });
  }
}
