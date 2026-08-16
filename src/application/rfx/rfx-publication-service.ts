import { createHash } from "node:crypto";

import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import type { GeographyDefinitionRepository } from "../../domain/geography/repository.ts";
import type { ConfirmedOrganizationLocationRepository } from "../../domain/organization-location/repository.ts";
import type { OrganizationId, OrganizationProfile } from "../../domain/organizations/model.ts";
import type { OrganizationProfileRepository } from "../../domain/organizations/repository.ts";
import type { RfxAggregate, RfxCommandReceipt, RfxEvent } from "../../domain/rfx/model.ts";
import { rfxId } from "../../domain/rfx/model.ts";
import {
  evaluatePublicationReadiness,
  projectResponderOpportunity,
  publishedAggregate,
  rfxPublicationReference,
  rfxPublicationSnapshotId,
  type PublicationLocalitySnapshot,
  type RfxPublicationAudience,
  type RfxPublicationSnapshot,
} from "../../domain/rfx/publication.ts";
import {
  RfxPersistenceConflictError,
  type RfxRepository,
} from "../../domain/rfx/repository.ts";
import type { OrganizationMembershipId } from "../../domain/users/model.ts";
import {
  authorizeOrganizationOperation,
  type OrganizationOperationAuthorizationDependencies,
} from "../auth/authorize-organization-operation.ts";
import { evaluateRfxCapability } from "./rfx-capability-policy.ts";
import {
  RfxDraftError,
  type RfxCommandScope,
} from "./rfx-draft-service.ts";

export interface RfxPublicationServiceDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly repository: RfxRepository;
  readonly profiles: OrganizationProfileRepository;
  readonly locations: ConfirmedOrganizationLocationRepository;
  readonly geographies: GeographyDefinitionRepository;
  readonly now?: () => string;
}

function stable(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized))
    throw new RfxDraftError("invalid", `${label} is invalid.`);
  return normalized;
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function deterministicId(prefix: string, ...values: readonly string[]): string {
  return `${prefix}_${createHash("sha256").update(values.join(":"), "utf8").digest("hex").slice(0, 40)}`;
}

function audience(value: string): RfxPublicationAudience {
  if (value !== "public" && value !== "authenticated-participants")
    throw new RfxDraftError("invalid", "Publication audience is unsupported.");
  return value;
}

function localityIds(aggregate: RfxAggregate): readonly string[] {
  const location = aggregate.package?.performanceLocation;
  if (!location) return Object.freeze([]);
  return Object.freeze([
    ...new Set(
      (location.mode === "multiple" ? location.locations : [location]).map(
        (item) => item.localityId,
      ),
    ),
  ]);
}

export class RfxPublicationService {
  private readonly dependencies: RfxPublicationServiceDependencies;
  private readonly now: () => string;

  constructor(dependencies: RfxPublicationServiceDependencies) {
    this.dependencies = dependencies;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  private async authorize(
    scope: Omit<RfxCommandScope, "commandId">,
    permission: "rfx.create" | "rfx.publish",
  ) {
    const decision = await authorizeOrganizationOperation(
      {
        context: scope.context,
        organizationId: scope.organizationId as OrganizationId,
        membershipId: scope.membershipId as OrganizationMembershipId,
        permission,
      },
      this.dependencies.authorization,
    );
    return decision;
  }

  private async issuerAggregate(
    scope: Omit<RfxCommandScope, "commandId">,
    id: string,
  ): Promise<Readonly<{ aggregate: RfxAggregate; profile: OrganizationProfile | null }>> {
    const workspace = await this.authorize(scope, "rfx.create");
    if (!workspace.allowed)
      throw new RfxDraftError("forbidden", "RFx workspace access is unavailable.");
    const aggregate = await this.dependencies.repository.getById(rfxId(id));
    if (!aggregate || aggregate.issuerOrganizationId !== workspace.organization.id)
      throw new RfxDraftError("not-found", "The requested RFx draft is unavailable.");
    const profile = await this.dependencies.profiles.getByOrganizationId(workspace.organization.id);
    return Object.freeze({ aggregate, profile });
  }

  private async localityAuthority(
    aggregate: RfxAggregate,
  ): Promise<readonly PublicationLocalitySnapshot[]> {
    const ids = localityIds(aggregate);
    const records = await Promise.all(ids.map((id) => this.dependencies.geographies.getById(id as never)));
    const snapshots = records.flatMap((record) => {
      if (!record || record.releaseState !== "released") return [];
      return [Object.freeze({
        id: String(record.id),
        label: record.name,
        indexKey: `${record.countryCode.toLowerCase()}:${String(record.id)}`,
        authorityUpdatedAt: String(record.updatedAt),
      })];
    });
    const performanceLocation = aggregate.package?.performanceLocation;
    if (performanceLocation) {
      const items = performanceLocation.mode === "multiple"
        ? performanceLocation.locations
        : [performanceLocation];
      if (items.some((item) => item.mode !== "locality")) {
        const confirmed = await this.dependencies.locations.getByOrganizationId(
          aggregate.issuerOrganizationId,
        );
        if (
          !confirmed ||
          items.some((item) =>
            item.mode !== "locality" &&
            ((item.mode !== "exact-address" && item.organizationLocationId !== String(confirmed.id)) ||
              item.localityId !== String(confirmed.geographyId)),
          )
        ) return Object.freeze([]);
      }
    }
    return Object.freeze(snapshots);
  }

  async readinessAndPreview(
    scope: Omit<RfxCommandScope, "commandId">,
    input: Readonly<{ rfxId: string; audience: string }>,
  ) {
    const requestedAudience = audience(input.audience);
    const [{ aggregate, profile }, publishDecision] = await Promise.all([
      this.issuerAggregate(scope, input.rfxId),
      this.authorize(scope, "rfx.publish"),
    ]);
    const evaluatedAt = this.now();
    const localities = await this.localityAuthority(aggregate);
    const readiness = evaluatePublicationReadiness({
      aggregate,
      audience: requestedAudience,
      evaluatedAt,
      localities,
      publishAuthorized: publishDecision.allowed,
      issuerDisplayNameAvailable: Boolean(profile?.displayName.trim()),
    });
    const reference = rfxPublicationReference(aggregate.id);
    const preview = readiness.status === "ready"
      ? projectResponderOpportunity({
          aggregate,
          issuerDisplayName: profile?.displayName ?? "",
          localities,
          audience: requestedAudience,
          reference,
          mode: "preview",
        })
      : null;
    return Object.freeze({
      readiness,
      preview,
      capability: evaluateRfxCapability("basic-issuance"),
      advancedCapability: evaluateRfxCapability("advanced:issuance-tools"),
    });
  }

  async currentPublication(
    scope: Omit<RfxCommandScope, "commandId">,
    input: Readonly<{ rfxId: string }>,
  ) {
    const { aggregate } = await this.issuerAggregate(scope, input.rfxId);
    if (aggregate.lifecycleState !== "published")
      throw new RfxDraftError("not-found", "The requested RFx publication is unavailable.");
    const projection = await this.dependencies.repository.getProjection(
      rfxPublicationReference(aggregate.id),
    );
    if (
      !projection ||
      projection.reference !== rfxPublicationReference(aggregate.id) ||
      projection.aggregateVersion !== aggregate.version
    )
      throw new RfxDraftError("dependency-unavailable", "The committed RFx publication is temporarily unavailable.");
    return Object.freeze({ aggregate, projection });
  }

  async publish(
    scope: RfxCommandScope,
    input: Readonly<{
      rfxId: string;
      expectedVersion: number;
      previewDigest: string;
      audience: string;
    }>,
  ) {
    const commandId = stable(scope.commandId, "Command identity");
    const requestedAudience = audience(input.audience);
    const aggregateId = rfxId(input.rfxId);
    const publishDecision = await this.authorize(scope, "rfx.publish");
    if (!publishDecision.allowed)
      throw new RfxDraftError("forbidden", "RFx publication access is unavailable.");
    const requestFingerprint = digest({
      action: "publish",
      issuerOrganizationId: publishDecision.organization.id,
      rfxId: aggregateId,
      expectedVersion: input.expectedVersion,
      previewDigest: input.previewDigest,
      audience: requestedAudience,
    });
    const existingCommand = await this.dependencies.repository.getCommand(commandId);
    if (existingCommand) {
      if (
        existingCommand.issuerOrganizationId !== publishDecision.organization.id ||
        existingCommand.rfxId !== aggregateId ||
        existingCommand.action !== "publish" ||
        existingCommand.requestFingerprint !== requestFingerprint
      ) throw new RfxDraftError("conflict", "Command identity was already used for different RFx intent.");
      const [aggregate, snapshot, projection] = await Promise.all([
        this.dependencies.repository.getById(aggregateId),
        this.dependencies.repository.getPublicationSnapshot(
          rfxPublicationSnapshotId(aggregateId),
        ),
        this.dependencies.repository.getProjection(
          rfxPublicationReference(aggregateId),
        ),
      ]);
      if (
        !aggregate ||
        aggregate.issuerOrganizationId !== publishDecision.organization.id ||
        !snapshot ||
        snapshot.issuerOrganizationId !== publishDecision.organization.id ||
        !projection
      )
        throw new RfxDraftError("dependency-unavailable", "The committed RFx publication is temporarily unavailable.");
      return Object.freeze({ aggregate, snapshot, projection, receipt: existingCommand, replayed: true as const });
    }

    const current = await this.dependencies.repository.getById(aggregateId);
    if (!current || current.issuerOrganizationId !== publishDecision.organization.id)
      throw new RfxDraftError("not-found", "The requested RFx draft is unavailable.");
    if (!Number.isInteger(input.expectedVersion) || current.version !== input.expectedVersion)
      throw new RfxDraftError("conflict", `RFx changed; current version is ${current.version}.`);
    const [profile, localities] = await Promise.all([
      this.dependencies.profiles.getByOrganizationId(publishDecision.organization.id),
      this.localityAuthority(current),
    ]);
    const now = this.now();
    const readiness = evaluatePublicationReadiness({
      aggregate: current,
      audience: requestedAudience,
      evaluatedAt: now,
      localities,
      publishAuthorized: true,
      issuerDisplayNameAvailable: Boolean(profile?.displayName.trim()),
    });
    if (readiness.status !== "ready" || !profile)
      throw new RfxDraftError("invalid", "RFx publication readiness has blocking findings.");
    const reference = rfxPublicationReference(current.id);
    const preview = projectResponderOpportunity({
      aggregate: current,
      issuerDisplayName: profile.displayName,
      localities,
      audience: requestedAudience,
      reference,
      mode: "preview",
    });
    if (preview.digest !== input.previewDigest)
      throw new RfxDraftError("conflict", "RFx preview changed before publication.");
    const aggregate = publishedAggregate(current, {
      userId: publishDecision.context.user.id,
      membershipId: publishDecision.membership.id,
    }, now);
    const projection = projectResponderOpportunity({
      aggregate,
      issuerDisplayName: profile.displayName,
      localities,
      audience: requestedAudience,
      reference,
      mode: "published",
      publishedAt: now,
    });
    if (projection.digest !== preview.digest)
      throw new RfxDraftError("dependency-unavailable", "Published projection parity failed.");
    const snapshot: RfxPublicationSnapshot = Object.freeze({
      schemaVersion: 1,
      id: rfxPublicationSnapshotId(aggregate.id),
      reference,
      rfxId: aggregate.id,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      audience: requestedAudience,
      aggregateVersion: aggregate.version,
      aggregate,
      amacsReleaseVersion: aggregate.requestFamily.amacsReleaseVersion,
      amacsSourceCommit: aggregate.requestFamily.amacsSourceCommit,
      projectionDigest: projection.digest,
      publishedAt: now,
    });
    const event: RfxEvent = Object.freeze({
      id: deterministicId("rfxevent", String(publishDecision.organization.id), commandId),
      rfxId: aggregate.id,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      kind: "rfx-published",
      aggregateVersion: aggregate.version,
      actorUserId: publishDecision.context.user.id,
      actorMembershipId: publishDecision.membership.id,
      commandId,
      requestFamily: aggregate.requestFamily,
      priorRequestFamily: null,
      package: aggregate.package,
      priorPackage: current.package,
      definition: aggregate.definition,
      priorDefinition: current.definition,
      occurredAt: now,
    });
    const receipt: RfxCommandReceipt = Object.freeze({
      id: commandId,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      rfxId: aggregate.id,
      action: "publish",
      requestFingerprint,
      resultingVersion: aggregate.version,
      recordedAt: now,
    });
    try {
      const result = await this.dependencies.repository.publish({
        aggregate,
        expectedVersion: current.version,
        expectedGeographies: localities.map((item) => Object.freeze({
          id: item.id,
          authorityUpdatedAt: item.authorityUpdatedAt,
        })),
        authentication: Object.freeze({
          provider: publishDecision.context.authentication.provider,
          subject: publishDecision.context.authentication.subject,
          authenticatedAt: publishDecision.context.authentication.authenticatedAt,
        }),
        event,
        command: receipt,
        audit: createOrganizationActionAuditEvent(
          publishDecision.context.user,
          publishDecision.membership,
          publishDecision.organization,
          {
            id: deterministicId("audit", String(publishDecision.organization.id), commandId),
            action: "rfx.published",
            occurredAt: now,
          },
        ),
        snapshot,
        projection,
      });
      return Object.freeze({ aggregate, snapshot, projection, receipt, replayed: result === "replayed" });
    } catch (error) {
      if (error instanceof RfxPersistenceConflictError)
        throw new RfxDraftError("conflict", error.message);
      throw error;
    }
  }
}
