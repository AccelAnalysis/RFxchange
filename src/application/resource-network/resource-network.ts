import { createHash, randomUUID } from "node:crypto";

import { authorizeOrganizationOperation, type OrganizationOperationAuthorizationDependencies } from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import { createTransactionalEmailRequest } from "../../domain/communications/transactional-email.ts";
import type { AuthoritativeGeoJsonGeometry } from "../../domain/geography/boundary.ts";
import type { GeographyDefinition } from "../../domain/geography/model.ts";
import type { GeographyDefinitionRepository } from "../../domain/geography/repository.ts";
import type { AccessRestrictionRepository } from "../../domain/lifecycle/repository.ts";
import type { OrganizationServiceGeographyRepository } from "../../domain/organization-location/repository.ts";
import type { OrganizationProfileCompletionRepository } from "../../domain/organization-profile/repository.ts";
import { organizationId, type OrganizationId } from "../../domain/organizations/model.ts";
import type { OrganizationProfileRepository } from "../../domain/organizations/repository.ts";
import type { ReferralRepository } from "../../domain/referrals/repository.ts";
import type { ResourceProviderRepository } from "../../domain/resource-providers/repository.ts";
import {
  createProviderPublication,
  createProviderRequestMessage,
  createProviderResource,
  publicProviderResource,
  projectProviderRequestMessage,
  updateProviderPublication,
  updateProviderResource,
  type ProviderAcquisitionInvitation,
  type ProviderDiscoveryProjection,
  type ProviderNetworkCommandReceipt,
  type ProviderNetworkEvent,
  type ProviderNetworkEventKind,
  type ProviderResource,
  type ProviderResourceKind,
  type ProviderResourceVisibility,
} from "../../domain/resource-network/model.ts";
import type { ResourceNetworkRepository } from "../../domain/resource-network/repository.ts";
import { organizationMembershipId } from "../../domain/users/model.ts";
import { PROVIDER_ACQUISITION_EVENT, resourceNetworkTransactionalEmailCatalog } from "./resource-network-templates.ts";
import { matchesResourceDiscoveryTerms, resourceDiscoveryTerms } from "./resource-discovery-query.ts";

export class ResourceNetworkError extends Error {
  readonly code: "forbidden" | "invalid" | "not-found" | "conflict";
  constructor(code: ResourceNetworkError["code"], message: string) { super(message); this.name = "ResourceNetworkError"; this.code = code; }
}

export interface ResourceNetworkScope {
  readonly context: AuthenticatedServerContext | null;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly commandId: string;
}

export interface ResourceNetworkAcquisitionIssuer {
  issueProvider(input: Readonly<{ providerOrganizationId: string; invitationId: string }>): Promise<Readonly<{ contextId: string; serializedToken: string }>>;
  issuePublicOpportunity(input: Readonly<{ reference: string }>): Promise<Readonly<{ contextId: string; serializedToken: string }>>;
}

export interface ResourceNetworkDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly providers: ResourceProviderRepository;
  readonly network: ResourceNetworkRepository;
  readonly profiles: OrganizationProfileRepository;
  readonly completions: OrganizationProfileCompletionRepository;
  readonly serviceGeographies: OrganizationServiceGeographyRepository;
  readonly restrictions: AccessRestrictionRepository;
  readonly geographies: GeographyDefinitionRepository;
  readonly referrals: ReferralRepository;
  readonly acquisition: ResourceNetworkAcquisitionIssuer;
  readonly publicOrigin: string;
  readonly now?: () => string;
  readonly id?: () => string;
}

export interface ProviderMarkerProjection {
  readonly organizationId: string;
  readonly marker: Readonly<{
    id: string;
    coordinate: readonly [number, number];
    accessibleLocationLabel: string;
    privacyTreatment: "exact" | "approximate";
  }>;
}

function fingerprint(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function email(value: string): string { const normalized = value.trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 320) throw new Error("Invitation email is invalid."); return normalized; }
function text(value: string, label: string, maximum: number): string { const normalized = value.trim().replace(/\s+/g, " "); if (!normalized || normalized.length > maximum) throw new Error(`${label} is required and cannot exceed ${maximum} characters.`); return normalized; }

function event(input: Readonly<{ id: string; organizationId: OrganizationId; objectType: ProviderNetworkEvent["objectType"]; objectId: string; kind: ProviderNetworkEventKind; version: number; actorUserId: ProviderNetworkEvent["actorUserId"]; actorMembershipId: ProviderNetworkEvent["actorMembershipId"]; commandId: string; now: string }>): ProviderNetworkEvent {
  return Object.freeze({ id: input.id, organizationId: input.organizationId, objectType: input.objectType, objectId: input.objectId, kind: input.kind, aggregateVersion: input.version, actorUserId: input.actorUserId, actorMembershipId: input.actorMembershipId, commandId: input.commandId, occurredAt: input.now });
}

function command(input: Readonly<{ id: string; organizationId: OrganizationId; objectId: string; action: ProviderNetworkEventKind; requestFingerprint: string; version: number; now: string }>): ProviderNetworkCommandReceipt {
  return Object.freeze({ id: input.id, organizationId: input.organizationId, objectId: input.objectId, action: input.action, requestFingerprint: input.requestFingerprint, resultingVersion: input.version, recordedAt: input.now });
}

export class ResourceNetworkService {
  private readonly now: () => string;
  private readonly id: () => string;
  constructor(private readonly dependencies: ResourceNetworkDependencies) { this.now = dependencies.now ?? (() => new Date().toISOString()); this.id = dependencies.id ?? randomUUID; }

  private async authorize(scope: ResourceNetworkScope, permission: "resource.manage" | "referral.manage") {
    const decision = await authorizeOrganizationOperation({ context: scope.context, organizationId: organizationId(scope.organizationId), membershipId: organizationMembershipId(scope.membershipId), permission }, this.dependencies.authorization);
    if (!decision.allowed) throw new ResourceNetworkError("forbidden", `Resource Network access denied: ${decision.reason}.`);
    return decision;
  }

  private async providerSource(organizationIdValue: OrganizationId) {
    const [status, profile, publication, completion, serviceGeography, restriction, organizationProfile] = await Promise.all([
      this.dependencies.providers.getStatusByOrganizationId(organizationIdValue),
      this.dependencies.providers.getServiceProfileByOrganizationId(organizationIdValue),
      this.dependencies.network.getPublication(organizationIdValue),
      this.dependencies.completions.getByOrganizationId(organizationIdValue),
      this.dependencies.serviceGeographies.getByOrganizationId(organizationIdValue),
      this.dependencies.restrictions.getForOrganization(organizationIdValue),
      this.dependencies.profiles.getByOrganizationId(organizationIdValue),
    ]);
    return Object.freeze({ status, profile, publication, completion, serviceGeography, restriction, organizationProfile });
  }

  async inspectProviderEligibility(input: Readonly<{ organizationId: OrganizationId; serviceId?: string | null; publicationVersion?: number | null; serviceGeographyId?: string | null }>): Promise<Readonly<{ eligible: boolean; displayName: string | null }>> {
    const source = await this.providerSource(input.organizationId);
    const serviceIds = source.profile?.services.map((service) => service.id) ?? [];
    const eligible = Boolean(source.status?.status === "official-resource-provider" && source.profile?.status === "active" && source.publication?.status === "published" && source.publication.sourceProfileVersion === source.profile.version && source.completion?.status === "active" && source.serviceGeography && (!source.restriction || source.restriction.state === "none") && source.organizationProfile && (!input.serviceId || source.publication.visibleServiceIds.includes(input.serviceId) && serviceIds.includes(input.serviceId)) && (!input.publicationVersion || source.publication.version === input.publicationVersion) && (!input.serviceGeographyId || source.serviceGeography.serviceGeographyIds.map(String).includes(input.serviceGeographyId)));
    return Object.freeze({ eligible, displayName: eligible ? source.organizationProfile?.displayName ?? null : null });
  }

  async ownerSnapshot(scope: Omit<ResourceNetworkScope, "commandId">) {
    const authorization = await this.authorize({ ...scope, commandId: "snapshot" }, "resource.manage");
    const [source, resources, invitations] = await Promise.all([
      this.providerSource(authorization.organization.id),
      this.dependencies.network.listResourcesByOrganization(authorization.organization.id),
      this.dependencies.network.listInvitationsByOrganization(authorization.organization.id),
    ]);
    return Object.freeze({ providerStatus: source.status, serviceProfile: source.profile, serviceGeography: source.serviceGeography, publication: source.publication, resources, invitations });
  }

  async discover(input: Readonly<{ viewerOrganizationId?: string | null; selectedGeography: GeographyDefinition; selectedGeometry: AuthoritativeGeoJsonGeometry; query?: string | null; modality?: string | null; language?: string | null; availability?: string | null; markers?: readonly ProviderMarkerProjection[] }>) {
    const [publications, allResources] = await Promise.all([
      this.dependencies.network.listPublishedPublications(),
      this.dependencies.network.listPublishedResources(),
    ]);
    const terms = resourceDiscoveryTerms(input.query);
    const markers = new Map((input.markers ?? []).map((value) => [value.organizationId, value.marker]));
    const projections = await Promise.all(publications.map(async (publication): Promise<ProviderDiscoveryProjection | null> => {
      if (String(publication.organizationId) === input.viewerOrganizationId) return null;
      const source = await this.providerSource(publication.organizationId);
      if (source.status?.status !== "official-resource-provider" || source.profile?.status !== "active" || !source.serviceGeography || !source.organizationProfile || source.completion?.status !== "active" || source.restriction?.state && source.restriction.state !== "none") return null;
      if (source.publication?.status !== "published" || source.publication.version !== publication.version || publication.sourceProfileVersion !== source.profile.version) return null;
      if (!source.serviceGeography.serviceGeographyIds.map(String).includes(String(input.selectedGeography.id))) return null;
      if (input.selectedGeography.releaseState === "restricted" || input.selectedGeography.releaseState === "visible-unreleased") return null;
      const services = source.profile.services.filter((service) => publication.visibleServiceIds.includes(service.id));
      if (!services.length) return null;
      if (input.modality && !source.profile.modalities.includes(input.modality as never)) return null;
      if (input.language && !source.profile.languages.some((language) => language.toLowerCase() === input.language?.toLowerCase())) return null;
      if (input.availability && source.profile.availability !== input.availability) return null;
      const providerValues = [source.organizationProfile.displayName, source.profile.categories.join(" "), source.profile.populationsServed, source.profile.eligibility, ...services.flatMap((service) => [service.name, service.description])];
      const matchingResourceValues = allResources
        .filter((resource) => resource.organizationId === publication.organizationId && resource.geographyIds.includes(String(input.selectedGeography.id)))
        .map((resource) => [resource.title, resource.summary, resource.description, resource.eligibility]);
      const matched = (
        matchesResourceDiscoveryTerms(providerValues, terms)
        || matchingResourceValues.some((resourceValues) => matchesResourceDiscoveryTerms([...providerValues, ...resourceValues], terms))
      ) ? terms : [];
      if (terms.length && matched.length !== terms.length) return null;
      const reasons = Object.freeze([...(matched.length ? [`Matched ${matched.join(", ")}`] : ["Serves this locality"]), `Service territory: ${input.selectedGeography.name}`, source.profile.availability === "unknown" ? "Availability is currently unknown" : `Availability: ${source.profile.availability}`]);
      return Object.freeze({ organizationId: publication.organizationId, displayName: source.organizationProfile.displayName, publicationVersion: publication.version, sourceProfileVersion: source.profile.version, categories: source.profile.categories, services: Object.freeze(services.map((service) => Object.freeze({ id: service.id, name: service.name, description: service.description, availability: service.availability }))), populationsServed: source.profile.populationsServed, eligibility: source.profile.eligibility, intakeMethod: source.profile.intakeMethod, modalities: source.profile.modalities, languages: source.profile.languages, availability: source.profile.availability, territory: Object.freeze({ geographyId: String(input.selectedGeography.id), name: input.selectedGeography.name, releaseState: input.selectedGeography.releaseState, geometry: input.selectedGeometry as ProviderDiscoveryProjection["territory"]["geometry"] }), marker: markers.get(String(publication.organizationId)) ?? null, match: Object.freeze({ score: matched.length * 20 + (source.profile.availability === "available" ? 5 : 0), reasons }), publishedAt: publication.publishedAt!, updatedAt: publication.updatedAt });
    }));
    const providers = Object.freeze(projections.flatMap((projection) => projection ? [projection] : []).sort((left, right) => right.match.score - left.match.score || left.displayName.localeCompare(right.displayName)));
    const resources = Object.freeze((await Promise.all(allResources.map(async (resource) => {
      if (!resource.geographyIds.includes(String(input.selectedGeography.id))) return null;
      const provider = providers.find((candidate) => candidate.organizationId === resource.organizationId);
      if (!provider) return null;
      const projection = publicProviderResource(resource, provider.displayName, this.now());
      if (!projection || !terms.length) return projection;
      const values = [
        projection.title,
        projection.summary,
        projection.description,
        projection.eligibility,
        projection.providerDisplayName,
        provider.categories.join(" "),
        provider.populationsServed,
        provider.eligibility,
        ...provider.services.flatMap((service) => [service.name, service.description]),
      ];
      return matchesResourceDiscoveryTerms(values, terms) ? projection : null;
    }))).flatMap((resource) => resource ? [resource] : []));
    return Object.freeze({ providers, resources, query: Object.freeze({ text: input.query?.trim() ?? "", modality: input.modality ?? null, language: input.language ?? null, availability: input.availability ?? null }) });
  }

  async mutatePublication(scope: ResourceNetworkScope, input: Readonly<{ expectedVersion: number | null; visibleServiceIds: readonly string[]; action: "save" | "publish" | "withdraw" }>) {
    const requestFingerprint = fingerprint(input); const authorization = await this.authorize(scope, "resource.manage");
    const prior = await this.dependencies.network.getCommand(scope.commandId); if (prior) return this.replay(prior, authorization.organization.id, input.action === "publish" ? "publication-published" : input.action === "withdraw" ? "publication-withdrawn" : "publication-saved", requestFingerprint);
    const source = await this.providerSource(authorization.organization.id);
    if (source.status?.status !== "official-resource-provider" || !source.profile || source.profile.status !== "active" || source.completion?.status !== "active" || !source.serviceGeography || source.restriction?.state && source.restriction.state !== "none") throw new ResourceNetworkError("forbidden", "Current Official Resource Provider eligibility is required.");
    if (input.visibleServiceIds.some((id) => !source.profile?.services.some((service) => service.id === id))) throw new ResourceNetworkError("invalid", "Provider publication contains an unavailable service.");
    const now = this.now(); let publication;
    try { publication = source.publication ? updateProviderPublication({ current: source.publication, expectedVersion: input.expectedVersion ?? 0, sourceProfileVersion: source.profile.version, visibleServiceIds: input.visibleServiceIds, action: input.action, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, now }) : createProviderPublication({ organizationId: authorization.organization.id, sourceProfileVersion: source.profile.version, visibleServiceIds: input.visibleServiceIds, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, now }); }
    catch (error) { throw new ResourceNetworkError("conflict", error instanceof Error ? error.message : "Provider publication could not be changed."); }
    if (!source.publication && input.action !== "save") publication = updateProviderPublication({ current: publication, expectedVersion: 1, sourceProfileVersion: source.profile.version, visibleServiceIds: input.visibleServiceIds, action: input.action, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, now });
    const kind = input.action === "publish" ? "publication-published" : input.action === "withdraw" ? "publication-withdrawn" : "publication-saved";
    const receipt = command({ id: scope.commandId, organizationId: authorization.organization.id, objectId: publication.id, action: kind, requestFingerprint, version: publication.version, now });
    await this.dependencies.network.savePublication({ publication, expectedVersion: source.publication?.version ?? null, event: event({ id: `resnet_event_${this.id()}`, organizationId: authorization.organization.id, objectType: "provider-publication", objectId: publication.id, kind, version: publication.version, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, commandId: scope.commandId, now }), command: receipt, audit: createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: `provider.discovery.${input.action}`, occurredAt: now }) });
    return Object.freeze({ replayed: false as const, receipt, publication });
  }

  private replay(prior: ProviderNetworkCommandReceipt, organizationIdValue: OrganizationId, action: ProviderNetworkEventKind, requestFingerprint: string) {
    if (prior.organizationId !== organizationIdValue || prior.action !== action || prior.requestFingerprint !== requestFingerprint) throw new ResourceNetworkError("conflict", "This command identity was already used for another Resource Network action.");
    return Object.freeze({ replayed: true as const, receipt: prior });
  }

  async createResource(scope: ResourceNetworkScope, input: Readonly<{ kind: ProviderResourceKind; title: string; summary: string; description: string; serviceIds: readonly string[]; geographyIds: readonly string[]; modalities: readonly string[]; eligibility: string; intakeUrl?: string | null; startsAt?: string | null; endsAt?: string | null; visibility: ProviderResourceVisibility }>) {
    const requestFingerprint = fingerprint(input); const authorization = await this.authorize(scope, "resource.manage"); const prior = await this.dependencies.network.getCommand(scope.commandId); if (prior) return this.replay(prior, authorization.organization.id, "resource-saved", requestFingerprint);
    const source = await this.providerSource(authorization.organization.id); if (source.status?.status !== "official-resource-provider" || source.profile?.status !== "active" || source.completion?.status !== "active" || !source.serviceGeography || source.restriction?.state && source.restriction.state !== "none") throw new ResourceNetworkError("forbidden", "Current Official Resource Provider eligibility is required.");
    if (input.serviceIds.some((id) => !source.profile?.services.some((service) => service.id === id)) || input.geographyIds.some((id) => !source.serviceGeography?.serviceGeographyIds.map(String).includes(id))) throw new ResourceNetworkError("invalid", "Resource service or geography is outside the current provider profile.");
    const now = this.now(); let resource: ProviderResource;
    try { resource = createProviderResource({ ...input, id: `provider_resource_${this.id()}`, organizationId: authorization.organization.id, modalities: input.modalities as never, actorUserId: authorization.context.user.id, now }); } catch (error) { throw new ResourceNetworkError("invalid", error instanceof Error ? error.message : "Provider resource is invalid."); }
    const receipt = command({ id: scope.commandId, organizationId: authorization.organization.id, objectId: resource.id, action: "resource-saved", requestFingerprint, version: resource.version, now });
    await this.dependencies.network.saveResource({ resource, expectedVersion: null, event: event({ id: `resnet_event_${this.id()}`, organizationId: authorization.organization.id, objectType: "provider-resource", objectId: resource.id, kind: "resource-saved", version: resource.version, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, commandId: scope.commandId, now }), command: receipt, audit: createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: "provider.resource.saved", occurredAt: now }) });
    return Object.freeze({ replayed: false as const, receipt, resource });
  }

  async transitionResource(scope: ResourceNetworkScope, input: Readonly<{ resourceId: string; expectedVersion: number; action: "publish" | "withdraw" }>) {
    const requestFingerprint = fingerprint(input); const authorization = await this.authorize(scope, "resource.manage"); const kind = input.action === "publish" ? "resource-published" : "resource-withdrawn"; const prior = await this.dependencies.network.getCommand(scope.commandId); if (prior) return this.replay(prior, authorization.organization.id, kind, requestFingerprint);
    const [source, current] = await Promise.all([this.providerSource(authorization.organization.id), this.dependencies.network.getResource(input.resourceId)]); if (source.status?.status !== "official-resource-provider" || source.profile?.status !== "active" || source.completion?.status !== "active" || !source.serviceGeography || source.restriction?.state && source.restriction.state !== "none") throw new ResourceNetworkError("forbidden", "Current Official Resource Provider eligibility is required."); if (!current || current.organizationId !== authorization.organization.id) throw new ResourceNetworkError("not-found", "Provider resource is unavailable.");
    const now = this.now(); let resource; try { resource = updateProviderResource({ current, expectedVersion: input.expectedVersion, action: input.action, actorUserId: authorization.context.user.id, now }); } catch (error) { throw new ResourceNetworkError("conflict", error instanceof Error ? error.message : "Provider resource could not transition."); }
    const receipt = command({ id: scope.commandId, organizationId: authorization.organization.id, objectId: resource.id, action: kind, requestFingerprint, version: resource.version, now });
    await this.dependencies.network.saveResource({ resource, expectedVersion: current.version, event: event({ id: `resnet_event_${this.id()}`, organizationId: authorization.organization.id, objectType: "provider-resource", objectId: resource.id, kind, version: resource.version, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, commandId: scope.commandId, now }), command: receipt, audit: createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: `provider.resource.${input.action}`, occurredAt: now }) });
    return Object.freeze({ replayed: false as const, receipt, resource });
  }

  async messages(scope: Omit<ResourceNetworkScope, "commandId">, referralId: string) {
    const authorization = await this.authorize({ ...scope, commandId: "messages" }, "referral.manage"); const referral = await this.dependencies.referrals.getById(referralId); if (!referral || referral.purpose !== "provider-connection" || ![referral.senderOrganizationId, referral.attachedRecipientOrganizationId].includes(authorization.organization.id)) throw new ResourceNetworkError("not-found", "Provider request messages are unavailable."); return Object.freeze((await this.dependencies.network.listMessages(referralId)).map(projectProviderRequestMessage));
  }

  async addMessage(scope: ResourceNetworkScope, input: Readonly<{ referralId: string; body: string }>) {
    const requestFingerprint = fingerprint(input); const authorization = await this.authorize(scope, "referral.manage"); const prior = await this.dependencies.network.getCommand(scope.commandId); if (prior) return this.replay(prior, authorization.organization.id, "request-message-added", requestFingerprint);
    const referral = await this.dependencies.referrals.getById(input.referralId); if (!referral || referral.purpose !== "provider-connection" || !referral.attachedRecipientOrganizationId || ![referral.senderOrganizationId, referral.attachedRecipientOrganizationId].includes(authorization.organization.id)) throw new ResourceNetworkError("not-found", "Provider request is unavailable."); if (!["sent", "accepted", "contacted"].includes(referral.status)) throw new ResourceNetworkError("conflict", "Messages are unavailable in the current provider request state."); const provider = await this.inspectProviderEligibility({ organizationId: referral.attachedRecipientOrganizationId }); if (!provider.eligible) throw new ResourceNetworkError("conflict", "The provider is no longer eligible for new request communication.");
    const now = this.now(); const message = createProviderRequestMessage({ id: `provider_message_${this.id()}`, referralId: referral.id, requesterOrganizationId: referral.senderOrganizationId, providerOrganizationId: referral.attachedRecipientOrganizationId, authorOrganizationId: authorization.organization.id, authorUserId: authorization.context.user.id, body: input.body, now }); const receipt = command({ id: scope.commandId, organizationId: authorization.organization.id, objectId: message.id, action: "request-message-added", requestFingerprint, version: 1, now });
    await this.dependencies.network.appendMessage({ message, event: event({ id: `resnet_event_${this.id()}`, organizationId: authorization.organization.id, objectType: "provider-request", objectId: referral.id, kind: "request-message-added", version: referral.version, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, commandId: scope.commandId, now }), command: receipt, audit: createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: "provider.request.message-added", occurredAt: now }) });
    return Object.freeze({ replayed: false as const, receipt, message });
  }

  async invite(scope: ResourceNetworkScope, input: Readonly<{ recipientLabel: string; recipientEmail: string; subjectKind: "profile-completion" | "public-opportunity"; subjectReference?: string | null; invitationContext: string }>) {
    const requestFingerprint = fingerprint(input); const authorization = await this.authorize(scope, "resource.manage"); const prior = await this.dependencies.network.getCommand(scope.commandId); if (prior) return this.replay(prior, authorization.organization.id, "provider-invitation-issued", requestFingerprint); const source = await this.providerSource(authorization.organization.id); if (source.status?.status !== "official-resource-provider" || source.profile?.status !== "active" || source.completion?.status !== "active" || !source.serviceGeography || !source.organizationProfile || source.restriction?.state && source.restriction.state !== "none") throw new ResourceNetworkError("forbidden", "Current Official Resource Provider eligibility is required.");
    const invitationId = `provider_invitation_${this.id()}`; const issued = input.subjectKind === "public-opportunity" ? await this.dependencies.acquisition.issuePublicOpportunity({ reference: input.subjectReference ?? "" }) : await this.dependencies.acquisition.issueProvider({ providerOrganizationId: String(authorization.organization.id), invitationId }); const now = this.now(); const recipientLabel = text(input.recipientLabel, "Invitation recipient", 160); const recipientEmail = email(input.recipientEmail); const subjectReference = input.subjectKind === "public-opportunity" ? text(input.subjectReference ?? "", "Public opportunity reference", 191) : invitationId; const reference = resourceNetworkTransactionalEmailCatalog.referenceForEvent(PROVIDER_ACQUISITION_EVENT, 1); const continueUrl = `${this.dependencies.publicOrigin}/api/acquisition/provider?token=${encodeURIComponent(issued.serializedToken)}`;
    const communication = createTransactionalEmailRequest({ id: `provider-invite-message-${fingerprint(invitationId).slice(0, 40)}`, purpose: reference.purpose, recipientEmail, recipientDisplayName: recipientLabel, eventKey: reference.eventKey, eventVersion: reference.eventVersion, templateKey: reference.templateKey, templateVersion: reference.templateVersion, variables: { recipient_name: recipientLabel, provider_organization: source.organizationProfile.displayName, invitation_context: text(input.invitationContext, "Invitation context", 600), continue_url: continueUrl }, correlationId: `provider-invitation:${invitationId}`, idempotencyKey: `provider-invitation:${invitationId}`, requestedAt: now, organizationId: String(authorization.organization.id), userId: String(authorization.context.user.id), relatedObjectType: "provider-acquisition-invitation", relatedObjectId: invitationId, tags: ["provider", input.subjectKind] });
    const invitation: ProviderAcquisitionInvitation = Object.freeze({ id: invitationId, organizationId: authorization.organization.id, recipientLabel, recipientEmail, subjectKind: input.subjectKind, subjectReference, acquisitionContextId: issued.contextId, communication, deliveryStatus: "queued", attemptCount: 0, lastErrorCode: null, createdByUserId: authorization.context.user.id, createdAt: now, updatedAt: now }); const receipt = command({ id: scope.commandId, organizationId: authorization.organization.id, objectId: invitation.id, action: "provider-invitation-issued", requestFingerprint, version: 1, now });
    await this.dependencies.network.saveInvitation({ invitation, event: event({ id: `resnet_event_${this.id()}`, organizationId: authorization.organization.id, objectType: "provider-invitation", objectId: invitation.id, kind: "provider-invitation-issued", version: 1, actorUserId: authorization.context.user.id, actorMembershipId: authorization.membership.id, commandId: scope.commandId, now }), command: receipt, audit: createOrganizationActionAuditEvent(authorization.context.user, authorization.membership, authorization.organization, { id: `audit_${this.id()}`, action: "provider.acquisition.invitation-issued", occurredAt: now }) });
    return Object.freeze({ replayed: false as const, receipt, invitation });
  }
}
