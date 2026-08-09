import { createHash, randomUUID } from "node:crypto";

import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import type { AuthoritativeBoundaryGeometryRepository } from "../../domain/geography/boundary-repository.ts";
import type { GeographyDefinitionRepository } from "../../domain/geography/repository.ts";
import { geographyId } from "../../domain/geography/model.ts";
import {
  changeAdditionalLocationPublication,
  changeProfileAssetPublication,
  confirmAdditionalLocationDraft,
  createAdditionalLocationDraft,
  createOrganizationCredential,
  createOrganizationProfileAsset,
  projectPublicAdditionalLocation,
  projectOwnerAdditionalLocation,
  projectPublicCredential,
  projectPublicProfileAsset,
  retireAdditionalLocation,
  retireOrganizationCredential,
  retireProfileAsset,
  type OrganizationEnrichmentCommandReceipt,
  type OrganizationEnrichmentEvent,
  type OrganizationEnrichmentEventKind,
} from "../../domain/organization-enrichment/model.ts";
import type { OrganizationEnrichmentRepository } from "../../domain/organization-enrichment/repository.ts";
import {
  createOrganizationGeocodeCandidate,
  geographicPositionWithinBoundary,
  type StructuredPostalAddress,
} from "../../domain/organization-location/model.ts";
import type { OrganizationGeocodingProvider } from "../../domain/organization-location/geocoding.ts";
import { localityDerivedCoordinate } from "../../domain/organization-markers/model.ts";
import type { ConfirmedOrganizationLocationRepository } from "../../domain/organization-location/repository.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import {
  deleteStoredAssetMetadata,
  storedAssetId,
  type StoredAsset,
} from "../../domain/storage/model.ts";
import type { StoredAssetRepository } from "../../domain/storage/repository.ts";
import { organizationMembershipId } from "../../domain/users/model.ts";
import {
  authorizeOrganizationOperation,
  type OrganizationOperationAuthorizationDependencies,
} from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import type { PrivateObjectStore } from "../storage/store-organization-asset.ts";

export class OrganizationEnrichmentError extends Error {
  readonly code: "forbidden" | "invalid" | "not-found" | "conflict" | "geography-unavailable";
  constructor(code: OrganizationEnrichmentError["code"], message: string) {
    super(message);
    this.name = "OrganizationEnrichmentError";
    this.code = code;
  }
}

export interface OrganizationEnrichmentDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly repository: OrganizationEnrichmentRepository;
  readonly storedAssets: StoredAssetRepository;
  readonly objects: PrivateObjectStore;
  readonly primaryLocations: ConfirmedOrganizationLocationRepository;
  readonly geographies: GeographyDefinitionRepository;
  readonly boundaries: AuthoritativeBoundaryGeometryRepository;
  readonly geocoder: OrganizationGeocodingProvider;
  readonly now?: () => string;
  readonly id?: () => string;
}

export interface OrganizationEnrichmentCommandScope {
  readonly context: AuthenticatedServerContext | null;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly commandId: string;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function state(value: unknown): Readonly<Record<string, unknown>> {
  if (!value || typeof value !== "object") return Object.freeze({});
  return Object.freeze({ ...(value as Record<string, unknown>) });
}

export class OrganizationEnrichmentService {
  private readonly dependencies: OrganizationEnrichmentDependencies;
  private readonly now: () => string;
  private readonly id: () => string;

  constructor(dependencies: OrganizationEnrichmentDependencies) {
    this.dependencies = dependencies;
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.id = dependencies.id ?? randomUUID;
  }

  private async authorize(scope: OrganizationEnrichmentCommandScope) {
    const decision = await authorizeOrganizationOperation({
      context: scope.context,
      organizationId: organizationId(scope.organizationId),
      membershipId: organizationMembershipId(scope.membershipId),
      permission: "organization.profile.manage",
    }, this.dependencies.authorization);
    if (!decision.allowed) {
      throw new OrganizationEnrichmentError("forbidden", `Organization enrichment denied: ${decision.reason}.`);
    }
    return decision;
  }

  private async replay(scope: OrganizationEnrichmentCommandScope, action: OrganizationEnrichmentEventKind, requestFingerprint: string) {
    const prior = await this.dependencies.repository.getCommand(scope.commandId);
    if (!prior) return null;
    if (String(prior.organizationId) !== scope.organizationId || prior.action !== action || prior.requestFingerprint !== requestFingerprint) {
      throw new OrganizationEnrichmentError("conflict", "The command identity was already used for another enrichment update.");
    }
    return prior;
  }

  private async persist(input: Readonly<{
    scope: OrganizationEnrichmentCommandScope;
    authorization: Awaited<ReturnType<OrganizationEnrichmentService["authorize"]>>;
    action: OrganizationEnrichmentEventKind;
    resultId: string;
    requestFingerprint: string;
    priorState?: unknown;
    newState: unknown;
    record: Parameters<OrganizationEnrichmentRepository["save"]>[0]["record"];
    now: string;
  }>) {
    const command: OrganizationEnrichmentCommandReceipt = Object.freeze({
      id: input.scope.commandId, organizationId: input.authorization.organization.id,
      action: input.action, resultId: input.resultId, requestFingerprint: input.requestFingerprint,
      actorUserId: input.authorization.context.user.id, recordedAt: input.now,
    });
    const event: OrganizationEnrichmentEvent = Object.freeze({
      id: `enrichment_event_${this.id()}`, organizationId: input.authorization.organization.id,
      actorUserId: input.authorization.context.user.id, actorMembershipId: input.authorization.membership.id,
      kind: input.action, subjectId: input.resultId, commandId: input.scope.commandId,
      priorState: input.priorState ? state(input.priorState) : null, newState: state(input.newState), occurredAt: input.now,
    });
    await this.dependencies.repository.save({
      command, event,
      auditEvent: createOrganizationActionAuditEvent(
        input.authorization.context.user, input.authorization.membership, input.authorization.organization,
        { id: `audit_${this.id()}`, action: `organization.enrichment.${input.action}`, occurredAt: input.now },
      ),
      record: input.record,
    });
    return command;
  }

  async snapshot(rawOrganizationId: string) {
    const organization = organizationId(rawOrganizationId);
    const [credentials, profileAssets, additionalLocations] = await Promise.all([
      this.dependencies.repository.listCredentials(organization),
      this.dependencies.repository.listProfileAssets(organization),
      this.dependencies.repository.listAdditionalLocations(organization),
    ]);
    const publicCredentials = credentials.flatMap((record) => projectPublicCredential(record) ?? []);
    const publicAssets = profileAssets.flatMap((record) => projectPublicProfileAsset(record) ?? []);
    const geographyIds = [...new Set(additionalLocations.map((record) => record.geographyId))];
    const definitions = await Promise.all(geographyIds.map((id) => this.dependencies.geographies.getById(geographyId(id))));
    const geographyById = new Map(definitions.flatMap((definition) => definition ? [[String(definition.id), definition] as const] : []));
    const boundaries = await Promise.all(definitions.flatMap((definition) => definition
      ? [this.dependencies.boundaries.getByGeographyId(definition.id)] : []));
    const boundaryById = new Map(boundaries.flatMap((boundary) => boundary ? [[String(boundary.geographyId), boundary] as const] : []));
    const publicAdditionalLocations = additionalLocations.flatMap((record) => {
      const geography = geographyById.get(record.geographyId);
      return geography ? projectPublicAdditionalLocation(record, geography) ?? [] : [];
    });
    const mapAdditionalLocations = additionalLocations.flatMap((record) => {
      const geography = geographyById.get(record.geographyId);
      const boundary = boundaryById.get(record.geographyId);
      const projection = geography ? projectOwnerAdditionalLocation(record, geography) : null;
      if (!projection || !geography || !boundary) return [];
      return [Object.freeze({
        ...projection,
        coordinate: projection.coordinate ?? localityDerivedCoordinate(
          `${String(record.organizationId)}:${record.id}`,
          geography,
          boundary.geometry,
          { radiusScale: 1.35 },
        ),
      })];
    });
    return Object.freeze({ credentials, profileAssets, additionalLocations,
      publicCredentials: Object.freeze(publicCredentials), publicAssets: Object.freeze(publicAssets),
      publicAdditionalLocations: Object.freeze(publicAdditionalLocations),
      mapAdditionalLocations: Object.freeze(mapAdditionalLocations) });
  }

  async upsertCredential(scope: OrganizationEnrichmentCommandScope, input: Readonly<{
    id: string; kind: string; label: string; issuer: string; identifierValue?: string | null;
    issuedOn?: string | null; effectiveOn?: string | null; expiresOn?: string | null;
    sourceLabel: string; sourceUrl?: string | null; evidenceAssetIds?: readonly string[]; visibility: string;
  }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const replay = await this.replay(scope, "credential-upserted", requestFingerprint);
    if (replay) return Object.freeze({ id: replay.resultId, replayed: true });
    const existing = await this.dependencies.repository.getCredential(input.id);
    if (existing && existing.organizationId !== authorization.organization.id) {
      throw new OrganizationEnrichmentError("forbidden", "Credential belongs to another organization.");
    }
    const evidenceAssetIds = Object.freeze((input.evidenceAssetIds ?? []).map(storedAssetId));
    const evidence = await Promise.all(evidenceAssetIds.map((id) => this.dependencies.storedAssets.getById(id)));
    if (evidence.some((asset) => !asset || asset.organizationId !== authorization.organization.id || asset.status !== "active")) {
      throw new OrganizationEnrichmentError("invalid", "Every credential evidence asset must be active and owned by this organization.");
    }
    const now = this.now();
    let record;
    try {
      record = createOrganizationCredential({ ...input, organizationId: authorization.organization.id,
        evidenceAssetIds, userId: authorization.context.user.id, membershipId: authorization.membership.id,
        now, existing });
    } catch (error) {
      throw new OrganizationEnrichmentError("invalid", error instanceof Error ? error.message : "Credential is invalid.");
    }
    await this.persist({ scope, authorization, action: "credential-upserted", resultId: record.id,
      requestFingerprint, priorState: existing, newState: record,
      record: { kind: "credential", value: record }, now });
    return Object.freeze({ record, replayed: false });
  }

  async retireCredential(scope: OrganizationEnrichmentCommandScope, input: Readonly<{ id: string }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const replay = await this.replay(scope, "credential-retired", requestFingerprint);
    if (replay) return Object.freeze({ id: replay.resultId, replayed: true });
    const existing = await this.dependencies.repository.getCredential(input.id);
    if (!existing || existing.organizationId !== authorization.organization.id) {
      throw new OrganizationEnrichmentError("not-found", "Credential was not found for this organization.");
    }
    const now = this.now();
    const record = retireOrganizationCredential(existing, now);
    await this.persist({ scope, authorization, action: "credential-retired", resultId: record.id,
      requestFingerprint, priorState: existing, newState: record, record: { kind: "credential", value: record }, now });
    return Object.freeze({ record, replayed: false });
  }

  async registerProfileAsset(scope: OrganizationEnrichmentCommandScope, input: Readonly<{
    id: string; storedAssetId: string; kind: string; title: string; description?: string | null; altText?: string | null;
  }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const replay = await this.replay(scope, "asset-registered", requestFingerprint);
    if (replay) return Object.freeze({ id: replay.resultId, replayed: true });
    const stored = await this.dependencies.storedAssets.getById(storedAssetId(input.storedAssetId));
    if (!stored || stored.organizationId !== authorization.organization.id || stored.status !== "active" || stored.sensitivity !== "standard") {
      throw new OrganizationEnrichmentError("invalid", "Profile asset must reference an active non-sensitive object owned by this organization.");
    }
    const expectedCategory = input.kind === "logo" ? "organization-logo"
      : input.kind === "document" ? "organization-document" : "organization-media";
    if (stored.category !== expectedCategory) {
      throw new OrganizationEnrichmentError("invalid", `Profile asset kind requires ${expectedCategory} storage.`);
    }
    const existing = await this.dependencies.repository.getProfileAsset(input.id);
    if (existing) throw new OrganizationEnrichmentError("conflict", "Profile asset identity already exists.");
    const now = this.now();
    let record;
    try {
      record = createOrganizationProfileAsset({ ...input, organizationId: authorization.organization.id,
        storedAssetId: stored.id, userId: authorization.context.user.id, membershipId: authorization.membership.id, now });
    } catch (error) {
      throw new OrganizationEnrichmentError("invalid", error instanceof Error ? error.message : "Profile asset is invalid.");
    }
    await this.persist({ scope, authorization, action: "asset-registered", resultId: record.id,
      requestFingerprint, newState: record, record: { kind: "profile-asset", value: record }, now });
    return Object.freeze({ record, replayed: false });
  }

  async setAssetPublication(scope: OrganizationEnrichmentCommandScope, input: Readonly<{ id: string; publish: boolean }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const replay = await this.replay(scope, "asset-publication-changed", requestFingerprint);
    if (replay) return Object.freeze({ id: replay.resultId, replayed: true });
    const existing = await this.dependencies.repository.getProfileAsset(input.id);
    if (!existing || existing.organizationId !== authorization.organization.id) {
      throw new OrganizationEnrichmentError("not-found", "Profile asset was not found for this organization.");
    }
    const stored = await this.dependencies.storedAssets.getById(existing.storedAssetId);
    if (!stored || stored.status !== "active" || stored.sensitivity !== "standard") {
      throw new OrganizationEnrichmentError("invalid", "Only an active non-sensitive source object may be published.");
    }
    const now = this.now();
    const record = changeProfileAssetPublication(existing, input.publish, now);
    await this.persist({ scope, authorization, action: "asset-publication-changed", resultId: record.id,
      requestFingerprint, priorState: existing, newState: record, record: { kind: "profile-asset", value: record }, now });
    return Object.freeze({ record, replayed: false });
  }

  async retireAsset(scope: OrganizationEnrichmentCommandScope, input: Readonly<{ id: string }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const replay = await this.replay(scope, "asset-retired", requestFingerprint);
    if (replay) return Object.freeze({ id: replay.resultId, replayed: true });
    const existing = await this.dependencies.repository.getProfileAsset(input.id);
    if (!existing || existing.organizationId !== authorization.organization.id) {
      throw new OrganizationEnrichmentError("not-found", "Profile asset was not found for this organization.");
    }
    const now = this.now();
    const record = retireProfileAsset(existing, now);
    const stored = await this.dependencies.storedAssets.getById(existing.storedAssetId);
    if (stored && stored.organizationId === authorization.organization.id) {
      await this.dependencies.storedAssets.save(deleteStoredAssetMetadata(stored, now));
    }
    await this.persist({ scope, authorization, action: "asset-retired", resultId: record.id,
      requestFingerprint, priorState: existing, newState: record, record: { kind: "profile-asset", value: record }, now });
    return Object.freeze({ record, replayed: false });
  }

  async beginAdditionalLocation(scope: OrganizationEnrichmentCommandScope, input: Readonly<{
    id: string; draftId?: string; label: string; physicalAddress: StructuredPostalAddress;
    isHomeOrPrivate: boolean; visibility?: string;
  }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const replay = await this.replay(scope, "additional-location-geocoded", requestFingerprint);
    if (replay) return Object.freeze({ id: replay.resultId, replayed: true });
    const primary = await this.dependencies.primaryLocations.getByOrganizationId(authorization.organization.id);
    if (!primary) throw new OrganizationEnrichmentError("geography-unavailable", "A confirmed primary organization location is required.");
    const [geography, boundary] = await Promise.all([
      this.dependencies.geographies.getById(primary.geographyId),
      this.dependencies.boundaries.getByGeographyId(primary.geographyId),
    ]);
    if (!geography || geography.releaseState !== "released" || !boundary) {
      throw new OrganizationEnrichmentError("geography-unavailable", "The primary released locality and authoritative boundary are required.");
    }
    const existing = await this.dependencies.repository.getAdditionalLocation(input.id);
    if (existing && existing.organizationId !== authorization.organization.id) {
      throw new OrganizationEnrichmentError("forbidden", "Additional location belongs to another organization.");
    }
    const draftId = input.draftId ?? `additional_location_draft_${this.id()}`;
    const candidates = (await this.dependencies.geocoder.locate({ address: input.physicalAddress, correlationId: draftId }))
      .filter((candidate) => geographicPositionWithinBoundary(candidate.coordinate, boundary.geometry))
      .map((candidate) => createOrganizationGeocodeCandidate({
        id: `${draftId}:${candidate.providerCandidateId}`, geographyId: primary.geographyId,
        coordinate: candidate.coordinate, matchedAddress: candidate.matchedAddress, quality: candidate.quality,
        provider: candidate.provider, providerReference: candidate.providerReference, benchmark: candidate.benchmark,
        retrievedAt: candidate.retrievedAt,
      }));
    if (candidates.length === 0) {
      throw new OrganizationEnrichmentError("invalid", "No geocode candidate falls inside the organization's authorized primary locality.");
    }
    const now = this.now();
    let draft;
    try {
      draft = createAdditionalLocationDraft({ ...input, id: draftId, locationId: input.id,
        organizationId: authorization.organization.id, requestedByUserId: authorization.context.user.id,
        membershipId: authorization.membership.id, geographyId: String(primary.geographyId), candidates, now });
    } catch (error) {
      throw new OrganizationEnrichmentError("invalid", error instanceof Error ? error.message : "Additional location is invalid.");
    }
    await this.persist({ scope, authorization, action: "additional-location-geocoded", resultId: draft.id,
      requestFingerprint, newState: { state: draft.state, locationId: draft.locationId, geographyId: draft.geographyId,
        visibility: draft.visibility, candidateCount: draft.candidates.length }, record: { kind: "location-draft", value: draft }, now });
    return Object.freeze({ draft, replayed: false });
  }

  async confirmAdditionalLocation(scope: OrganizationEnrichmentCommandScope, input: Readonly<{ draftId: string; candidateId: string }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const replay = await this.replay(scope, "additional-location-confirmed", requestFingerprint);
    if (replay) return Object.freeze({ id: replay.resultId, replayed: true });
    const draft = await this.dependencies.repository.getAdditionalLocationDraft(input.draftId);
    if (!draft || draft.organizationId !== authorization.organization.id || draft.requestedByUserId !== authorization.context.user.id || draft.membershipId !== authorization.membership.id) {
      throw new OrganizationEnrichmentError("not-found", "Additional-location draft does not match the current organization workspace.");
    }
    const primary = await this.dependencies.primaryLocations.getByOrganizationId(authorization.organization.id);
    if (!primary || String(primary.geographyId) !== draft.geographyId) {
      throw new OrganizationEnrichmentError("conflict", "Primary geography changed before location confirmation; start again.");
    }
    const existing = await this.dependencies.repository.getAdditionalLocation(draft.locationId);
    if (existing) throw new OrganizationEnrichmentError("conflict", "Additional location identity already exists.");
    const now = this.now();
    let result;
    try {
      result = confirmAdditionalLocationDraft({ draft, candidateId: input.candidateId,
        userId: authorization.context.user.id, membershipId: authorization.membership.id, now });
    } catch (error) {
      throw new OrganizationEnrichmentError("invalid", error instanceof Error ? error.message : "Location candidate could not be confirmed.");
    }
    await this.persist({ scope, authorization, action: "additional-location-confirmed", resultId: result.location.id,
      requestFingerprint, priorState: draft, newState: result.location,
      record: { kind: "location-confirmation", draft: result.draft, value: result.location }, now });
    return Object.freeze({ record: result.location, replayed: false });
  }

  async setLocationPublication(scope: OrganizationEnrichmentCommandScope, input: Readonly<{ id: string; publish: boolean }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const replay = await this.replay(scope, "additional-location-publication-changed", requestFingerprint);
    if (replay) return Object.freeze({ id: replay.resultId, replayed: true });
    const existing = await this.dependencies.repository.getAdditionalLocation(input.id);
    if (!existing || existing.organizationId !== authorization.organization.id) {
      throw new OrganizationEnrichmentError("not-found", "Additional location was not found for this organization.");
    }
    const primary = await this.dependencies.primaryLocations.getByOrganizationId(authorization.organization.id);
    if (!primary || String(primary.geographyId) !== existing.geographyId) {
      throw new OrganizationEnrichmentError("geography-unavailable", "Additional location no longer matches the authorized primary locality.");
    }
    const now = this.now();
    const record = changeAdditionalLocationPublication(existing, input.publish, now);
    await this.persist({ scope, authorization, action: "additional-location-publication-changed", resultId: record.id,
      requestFingerprint, priorState: existing, newState: record, record: { kind: "additional-location", value: record }, now });
    return Object.freeze({ record, replayed: false });
  }

  async retireLocation(scope: OrganizationEnrichmentCommandScope, input: Readonly<{ id: string }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const replay = await this.replay(scope, "additional-location-retired", requestFingerprint);
    if (replay) return Object.freeze({ id: replay.resultId, replayed: true });
    const existing = await this.dependencies.repository.getAdditionalLocation(input.id);
    if (!existing || existing.organizationId !== authorization.organization.id) {
      throw new OrganizationEnrichmentError("not-found", "Additional location was not found for this organization.");
    }
    const now = this.now();
    const record = retireAdditionalLocation(existing, now);
    await this.persist({ scope, authorization, action: "additional-location-retired", resultId: record.id,
      requestFingerprint, priorState: existing, newState: record, record: { kind: "additional-location", value: record }, now });
    return Object.freeze({ record, replayed: false });
  }

  async readPublishedAsset(profileAssetId: string): Promise<Readonly<{ profile: ReturnType<typeof projectPublicProfileAsset>; stored: StoredAsset; contentType: string; bytes: Uint8Array }>> {
    const record = await this.dependencies.repository.getProfileAsset(profileAssetId);
    const profile = record ? projectPublicProfileAsset(record) : null;
    if (!record || !profile) throw new OrganizationEnrichmentError("not-found", "Published organization asset was not found.");
    const stored = await this.dependencies.storedAssets.getById(record.storedAssetId);
    if (!stored || stored.status !== "active" || stored.organizationId !== record.organizationId || stored.sensitivity !== "standard") {
      throw new OrganizationEnrichmentError("not-found", "Published organization asset is unavailable.");
    }
    const object = await this.dependencies.objects.get(stored.objectPath);
    if (object.contentType !== stored.contentType || object.bytes.byteLength !== stored.sizeBytes) {
      throw new OrganizationEnrichmentError("conflict", "Published asset no longer matches its integrity metadata.");
    }
    return Object.freeze({ profile, stored, contentType: object.contentType, bytes: object.bytes });
  }
}
