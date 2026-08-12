import { createHash } from "node:crypto";

import { authorizeOrganizationOperation } from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import type { AmacsCatalogPort } from "../amacs/catalog.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import {
  changeRfxRequestFamily,
  createRfxDraft,
  requestFamilySnapshotFromAmacs,
  RFX_AMACS_RELEASE_VERSION,
  RFX_AMACS_SOURCE_COMMIT,
  rfxId,
  type RequestFamilySnapshot,
  type RfxAggregate,
  type RfxCommandReceipt,
  type RfxEvent,
} from "../../domain/rfx/model.ts";
import {
  RfxPersistenceConflictError,
  type RfxRepository,
} from "../../domain/rfx/repository.ts";
import type { OrganizationMembershipId } from "../../domain/users/model.ts";
import type { OrganizationOperationAuthorizationDependencies } from "../auth/authorize-organization-operation.ts";

export type RfxDraftErrorCode = "invalid" | "forbidden" | "not-found" | "conflict" | "dependency-unavailable";

export class RfxDraftError extends Error {
  readonly code: RfxDraftErrorCode;

  constructor(code: RfxDraftErrorCode, message: string) {
    super(message);
    this.name = "RfxDraftError";
    this.code = code;
  }
}

export interface RfxCommandScope {
  readonly context: AuthenticatedServerContext | null;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly commandId: string;
}

export interface RfxRequestFamilyOption {
  readonly id: string;
  readonly label: string;
  readonly purpose: string;
  readonly lifecycle: readonly string[];
}

export interface RfxDraftServiceDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly catalog: AmacsCatalogPort;
  readonly repository: RfxRepository;
  readonly now?: () => string;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function stable(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new RfxDraftError("invalid", `${label} is invalid.`);
  }
  return normalized;
}

function deterministicId(prefix: string, commandId: string, organizationId: string): string {
  return `${prefix}_${createHash("sha256").update(`${organizationId}:${commandId}`).digest("hex").slice(0, 40)}`;
}

export class RfxDraftService {
  private readonly dependencies: RfxDraftServiceDependencies;
  private readonly now: () => string;

  constructor(dependencies: RfxDraftServiceDependencies) {
    this.dependencies = dependencies;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  private async authorize(scope: Omit<RfxCommandScope, "commandId">) {
    let organizationId: OrganizationId;
    let membershipId: OrganizationMembershipId;
    try {
      organizationId = scope.organizationId as OrganizationId;
      membershipId = scope.membershipId as OrganizationMembershipId;
    } catch {
      throw new RfxDraftError("forbidden", "RFx workspace access is unavailable.");
    }
    const decision = await authorizeOrganizationOperation({
      context: scope.context,
      organizationId,
      membershipId,
      permission: "rfx.create",
    }, this.dependencies.authorization);
    if (!decision.allowed) {
      throw new RfxDraftError("forbidden", `RFx workspace access is unavailable (${decision.reason}).`);
    }
    return decision;
  }

  private async familySnapshot(requestFamilyId: string, selectedAt: string): Promise<RequestFamilySnapshot> {
    const familyId = stable(requestFamilyId, "Request type");
    try {
      const [release, record] = await Promise.all([
        this.dependencies.catalog.getRelease(),
        this.dependencies.catalog.getRequestFamily(familyId),
      ]);
      if (!record) throw new RfxDraftError("invalid", "The selected request type is unavailable.");
      return requestFamilySnapshotFromAmacs({ release, record, selectedAt });
    } catch (error) {
      if (error instanceof RfxDraftError) throw error;
      throw new RfxDraftError("invalid", error instanceof Error ? error.message : "The selected request type is unavailable.");
    }
  }

  async requestFamilies(): Promise<readonly RfxRequestFamilyOption[]> {
    const [release, records] = await Promise.all([
      this.dependencies.catalog.getRelease(),
      this.dependencies.catalog.listRequestFamilies(),
    ]);
    if (
      release.version !== RFX_AMACS_RELEASE_VERSION
      || release.sourceCommit !== RFX_AMACS_SOURCE_COMMIT
    ) {
      throw new RfxDraftError("dependency-unavailable", "The governed request-type catalog is unavailable.");
    }
    return Object.freeze(records.flatMap((record) => {
      if (
        record.status !== "active"
        || typeof record.request_family_id !== "string"
        || typeof record.preferred_label !== "string"
        || typeof record.purpose !== "string"
        || !Array.isArray(record.lifecycle)
        || !record.lifecycle.every((item) => typeof item === "string")
      ) return [];
      return [Object.freeze({
        id: record.request_family_id,
        label: record.preferred_label,
        purpose: record.purpose,
        lifecycle: Object.freeze([...record.lifecycle]) as readonly string[],
      })];
    }).sort((left, right) => left.label.localeCompare(right.label)));
  }

  async workspace(scope: Omit<RfxCommandScope, "commandId">) {
    const authorization = await this.authorize(scope);
    const [drafts, requestFamilies] = await Promise.all([
      this.dependencies.repository.listByIssuerOrganizationId(authorization.organization.id),
      this.requestFamilies(),
    ]);
    return Object.freeze({ drafts, requestFamilies });
  }

  async createDraft(scope: RfxCommandScope, input: Readonly<{ requestFamilyId: string }>) {
    const commandId = stable(scope.commandId, "Command identity");
    const authorization = await this.authorize(scope);
    const requestFingerprint = fingerprint({
      action: "create-draft",
      issuerOrganizationId: authorization.organization.id,
      requestFamilyId: input.requestFamilyId,
      creationSource: { kind: "blank", schemaVersion: 1 },
    });
    const existingCommand = await this.dependencies.repository.getCommand(commandId);
    if (existingCommand) {
      if (
        existingCommand.issuerOrganizationId !== authorization.organization.id
        || existingCommand.action !== "create-draft"
        || existingCommand.requestFingerprint !== requestFingerprint
      ) throw new RfxDraftError("conflict", "Command identity was already used for different RFx intent.");
      const existing = await this.dependencies.repository.getById(existingCommand.rfxId);
      if (!existing || existing.issuerOrganizationId !== authorization.organization.id) {
        throw new RfxDraftError("dependency-unavailable", "The committed RFx draft is temporarily unavailable.");
      }
      return Object.freeze({ aggregate: existing, receipt: existingCommand, replayed: true as const });
    }

    const now = this.now();
    const requestFamily = await this.familySnapshot(input.requestFamilyId, now);
    const aggregate = createRfxDraft({
      id: deterministicId("rfx", commandId, String(authorization.organization.id)),
      issuerOrganizationId: authorization.organization.id,
      requestFamily,
      actorUserId: authorization.context.user.id,
      actorMembershipId: authorization.membership.id,
      now,
    });
    const event: RfxEvent = Object.freeze({
      id: deterministicId("rfxevent", commandId, String(authorization.organization.id)),
      rfxId: aggregate.id,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      kind: "rfx-draft-created",
      aggregateVersion: aggregate.version,
      actorUserId: authorization.context.user.id,
      actorMembershipId: authorization.membership.id,
      commandId,
      requestFamily,
      priorRequestFamily: null,
      occurredAt: now,
    });
    const receipt: RfxCommandReceipt = Object.freeze({
      id: commandId,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      rfxId: aggregate.id,
      action: "create-draft",
      requestFingerprint,
      resultingVersion: aggregate.version,
      recordedAt: now,
    });
    try {
      const persistence = await this.dependencies.repository.save({
        aggregate,
        expectedVersion: null,
        event,
        command: receipt,
        audit: createOrganizationActionAuditEvent(
          authorization.context.user,
          authorization.membership,
          authorization.organization,
          { id: deterministicId("audit", commandId, String(authorization.organization.id)), action: "rfx.draft-created", occurredAt: now },
        ),
      });
      if (persistence === "replayed") {
        const [committedAggregate, committedReceipt] = await Promise.all([
          this.dependencies.repository.getById(aggregate.id),
          this.dependencies.repository.getCommand(commandId),
        ]);
        if (
          !committedAggregate
          || committedAggregate.issuerOrganizationId !== authorization.organization.id
          || !committedReceipt
          || committedReceipt.issuerOrganizationId !== authorization.organization.id
          || committedReceipt.rfxId !== aggregate.id
          || committedReceipt.action !== "create-draft"
          || committedReceipt.requestFingerprint !== requestFingerprint
        ) {
          throw new RfxDraftError("dependency-unavailable", "The committed RFx draft is temporarily unavailable.");
        }
        return Object.freeze({ aggregate: committedAggregate, receipt: committedReceipt, replayed: true as const });
      }
      return Object.freeze({ aggregate, receipt, replayed: false as const });
    } catch (error) {
      if (error instanceof RfxPersistenceConflictError) throw new RfxDraftError("conflict", error.message);
      throw error;
    }
  }

  async changeRequestFamily(scope: RfxCommandScope, input: Readonly<{
    rfxId: string;
    expectedVersion: number;
    requestFamilyId: string;
  }>) {
    const commandId = stable(scope.commandId, "Command identity");
    const authorization = await this.authorize(scope);
    const aggregateId = rfxId(input.rfxId);
    const requestFingerprint = fingerprint({
      action: "change-request-family",
      issuerOrganizationId: authorization.organization.id,
      rfxId: aggregateId,
      expectedVersion: input.expectedVersion,
      requestFamilyId: input.requestFamilyId,
    });
    const existingCommand = await this.dependencies.repository.getCommand(commandId);
    if (existingCommand) {
      if (
        existingCommand.issuerOrganizationId !== authorization.organization.id
        || existingCommand.rfxId !== aggregateId
        || existingCommand.action !== "change-request-family"
        || existingCommand.requestFingerprint !== requestFingerprint
      ) throw new RfxDraftError("conflict", "Command identity was already used for different RFx intent.");
      const existing = await this.dependencies.repository.getById(existingCommand.rfxId);
      if (!existing || existing.issuerOrganizationId !== authorization.organization.id) {
        throw new RfxDraftError("dependency-unavailable", "The committed RFx draft is temporarily unavailable.");
      }
      return Object.freeze({ aggregate: existing, receipt: existingCommand, replayed: true as const });
    }

    const current = await this.dependencies.repository.getById(aggregateId);
    if (!current || current.issuerOrganizationId !== authorization.organization.id) {
      throw new RfxDraftError("not-found", "The requested RFx draft is unavailable.");
    }
    if (!Number.isInteger(input.expectedVersion) || input.expectedVersion !== current.version) {
      throw new RfxDraftError("conflict", `RFx changed; current version is ${current.version}.`);
    }
    const now = this.now();
    const requestFamily = await this.familySnapshot(input.requestFamilyId, now);
    let aggregate: RfxAggregate;
    try {
      aggregate = changeRfxRequestFamily({
        aggregate: current,
        expectedVersion: input.expectedVersion,
        requestFamily,
        actorUserId: authorization.context.user.id,
        actorMembershipId: authorization.membership.id,
        now,
      });
    } catch (error) {
      throw new RfxDraftError(
        error instanceof Error && /current version/.test(error.message) ? "conflict" : "invalid",
        error instanceof Error ? error.message : "The request type change is invalid.",
      );
    }
    const event: RfxEvent = Object.freeze({
      id: deterministicId("rfxevent", commandId, String(authorization.organization.id)),
      rfxId: aggregate.id,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      kind: "rfx-request-family-changed",
      aggregateVersion: aggregate.version,
      actorUserId: authorization.context.user.id,
      actorMembershipId: authorization.membership.id,
      commandId,
      requestFamily,
      priorRequestFamily: current.requestFamily,
      occurredAt: now,
    });
    const receipt: RfxCommandReceipt = Object.freeze({
      id: commandId,
      issuerOrganizationId: aggregate.issuerOrganizationId,
      rfxId: aggregate.id,
      action: "change-request-family",
      requestFingerprint,
      resultingVersion: aggregate.version,
      recordedAt: now,
    });
    try {
      const persistence = await this.dependencies.repository.save({
        aggregate,
        expectedVersion: input.expectedVersion,
        event,
        command: receipt,
        audit: createOrganizationActionAuditEvent(
          authorization.context.user,
          authorization.membership,
          authorization.organization,
          { id: deterministicId("audit", commandId, String(authorization.organization.id)), action: "rfx.request-family-changed", occurredAt: now },
        ),
      });
      if (persistence === "replayed") {
        const [committedAggregate, committedReceipt] = await Promise.all([
          this.dependencies.repository.getById(aggregate.id),
          this.dependencies.repository.getCommand(commandId),
        ]);
        if (
          !committedAggregate
          || committedAggregate.issuerOrganizationId !== authorization.organization.id
          || !committedReceipt
          || committedReceipt.issuerOrganizationId !== authorization.organization.id
          || committedReceipt.rfxId !== aggregate.id
          || committedReceipt.action !== "change-request-family"
          || committedReceipt.requestFingerprint !== requestFingerprint
        ) {
          throw new RfxDraftError("dependency-unavailable", "The committed RFx draft is temporarily unavailable.");
        }
        return Object.freeze({ aggregate: committedAggregate, receipt: committedReceipt, replayed: true as const });
      }
      return Object.freeze({ aggregate, receipt, replayed: false as const });
    } catch (error) {
      if (error instanceof RfxPersistenceConflictError) throw new RfxDraftError("conflict", error.message);
      throw error;
    }
  }
}
