import { createHash } from "node:crypto";

import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import { opportunityDeadlineState, opportunityWatchId } from "../../domain/rfx/discovery.ts";
import {
  calculateOpportunityFit,
  normalizePursuitAssessment,
  opportunityFitSnapshotId,
  opportunityPursuitId,
  type MatchExplanation,
  type OpportunityFitSnapshot,
  type OpportunityPursuit,
  type OpportunityPursuitCommandReceipt,
  type OpportunityPursuitEvent,
  type OpportunityPursuitRepository,
  type PursuitAssessment,
  type PursuitDecision,
} from "../../domain/rfx/pursuit.ts";
import type { OrganizationMembershipId, UserId } from "../../domain/users/model.ts";
import { authorizeOrganizationOperation, type OrganizationOperationAuthorizationDependencies } from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";

export class OpportunityPursuitError extends Error {
  constructor(readonly code: "invalid" | "forbidden" | "not-found" | "conflict" | "dependency-unavailable", message: string) {
    super(message);
    this.name = "OpportunityPursuitError";
  }
}

export interface OpportunityPursuitScope {
  readonly context: AuthenticatedServerContext;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
}

export interface OpportunityPursuitWorkspace {
  readonly explanation: MatchExplanation;
  readonly fitSnapshotId: string;
  readonly pursuit: OpportunityPursuit | null;
  readonly stale: boolean;
  readonly canManage: boolean;
}

function stable(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) throw new OpportunityPursuitError("invalid", `${label} is invalid.`);
  return normalized;
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function opaque(prefix: string, ...values: readonly string[]): string {
  return `${prefix}_${createHash("sha256").update(values.join(":"), "utf8").digest("hex").slice(0, 40)}`;
}

function decision(value: string): PursuitDecision {
  if (value === "watch" || value === "pursue" || value === "decline") return value;
  throw new OpportunityPursuitError("invalid", "Pursuit decision is unsupported.");
}

export class OpportunityPursuitService {
  private readonly now: () => string;

  constructor(private readonly dependencies: Readonly<{
    authorization: OrganizationOperationAuthorizationDependencies;
    repository: OpportunityPursuitRepository;
    now?: () => string;
  }>) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  private async authorize(scope: OpportunityPursuitScope) {
    if (scope.context.user.id !== scope.userId) throw new OpportunityPursuitError("forbidden", "Pursuit access is unavailable.");
    const authority = await authorizeOrganizationOperation({ context: scope.context, organizationId: scope.organizationId, membershipId: scope.membershipId, permission: "response.create" }, this.dependencies.authorization);
    if (!authority.allowed) throw new OpportunityPursuitError("forbidden", "Pursuit access is unavailable.");
    return authority;
  }

  private async calculate(scope: OpportunityPursuitScope, referenceInput: string): Promise<Readonly<{ explanation: MatchExplanation; snapshot: OpportunityFitSnapshot }>> {
    const reference = stable(referenceInput, "Opportunity reference");
    const projection = await this.dependencies.repository.getProjection(reference);
    if (!projection || projection.mode !== "published" || !projection.publishedAt || opportunityDeadlineState(projection, this.now()) === "passed") throw new OpportunityPursuitError("not-found", "Opportunity is unavailable.");
    if (!projection.requirementIndex || !projection.issuerOrganizationIndexKey) throw new OpportunityPursuitError("dependency-unavailable", "This opportunity predates the governed fit index and cannot yet be assessed.");
    if (projection.issuerOrganizationIndexKey === String(scope.organizationId)) throw new OpportunityPursuitError("forbidden", "The issuing organization cannot pursue its own opportunity.");
    const [claims, serviceGeographyIds] = await Promise.all([
      this.dependencies.repository.listCapabilityClaims(scope.organizationId),
      this.dependencies.repository.getServiceGeographyIds(scope.organizationId),
    ]);
    const calculatedAt = this.now();
    const explanation = calculateOpportunityFit({ organizationId: scope.organizationId, projection, claims, serviceGeographyIds, calculatedAt });
    const id = opportunityFitSnapshotId({ organizationId: String(scope.organizationId), reference, projectionVersion: projection.aggregateVersion, projectionDigest: projection.digest, capabilityInputDigest: explanation.organizationCapabilityInputDigest });
    const snapshot: OpportunityFitSnapshot = Object.freeze({ schemaVersion: 1, id, organizationId: scope.organizationId, opportunityReference: reference, explanation, recordedAt: calculatedAt });
    await this.dependencies.repository.recordFit(snapshot);
    return Object.freeze({ explanation, snapshot });
  }

  async explain(scope: OpportunityPursuitScope, reference: string): Promise<Readonly<{ explanation: MatchExplanation; fitSnapshotId: string }>> {
    await this.authorize(scope);
    const result = await this.calculate(scope, reference);
    return Object.freeze({ explanation: result.explanation, fitSnapshotId: result.snapshot.id });
  }

  async workspace(scope: OpportunityPursuitScope, reference: string): Promise<OpportunityPursuitWorkspace> {
    await this.authorize(scope);
    const result = await this.calculate(scope, reference);
    const pursuit = await this.dependencies.repository.getPursuit(opportunityPursuitId(String(scope.organizationId), result.explanation.opportunityReference));
    const stale = Boolean(pursuit && (pursuit.reviewedFitSnapshotId !== result.snapshot.id || pursuit.reviewedProjectionDigest !== result.explanation.opportunityProjectionDigest || pursuit.reviewedCapabilityInputDigest !== result.explanation.organizationCapabilityInputDigest));
    return Object.freeze({ explanation: result.explanation, fitSnapshotId: result.snapshot.id, pursuit, stale, canManage: true });
  }

  async save(scope: OpportunityPursuitScope, input: Readonly<{
    commandId: string;
    reference: string;
    expectedVersion: number | null;
    expectedFitSnapshotId: string;
    decision: string;
    assessment: Partial<Record<keyof PursuitAssessment, Readonly<{ state?: string; note?: string }>>>;
  }>): Promise<Readonly<{ pursuit: OpportunityPursuit; replayed: boolean }>> {
    const authority = await this.authorize(scope);
    const commandId = stable(input.commandId, "Command identity");
    const expectedFitSnapshotId = stable(input.expectedFitSnapshotId, "Fit snapshot identity");
    const result = await this.calculate(scope, input.reference);
    if (result.snapshot.id !== expectedFitSnapshotId) throw new OpportunityPursuitError("conflict", "Opportunity fit changed; review the current explanation before saving.");
    const id = opportunityPursuitId(String(scope.organizationId), result.explanation.opportunityReference);
    const assessment = normalizePursuitAssessment(input.assessment);
    const nextDecision = decision(input.decision);
    const requestFingerprint = hash({ action: "pursuit.save", organizationId: scope.organizationId, reference: result.explanation.opportunityReference, expectedVersion: input.expectedVersion, expectedFitSnapshotId, decision: nextDecision, assessment });
    const prior = await this.dependencies.repository.getCommand(commandId);
    if (prior) {
      if (prior.requestFingerprint !== requestFingerprint || prior.pursuitId !== id) throw new OpportunityPursuitError("conflict", "Command identity was reused for different intent.");
      const replay = await this.dependencies.repository.getPursuit(id);
      if (!replay || replay.version < prior.resultingVersion) throw new OpportunityPursuitError("dependency-unavailable", "Pursuit replay is temporarily unavailable.");
      return Object.freeze({ pursuit: replay, replayed: true });
    }
    const existing = await this.dependencies.repository.getPursuit(id);
    const expectedVersion = input.expectedVersion === null ? null : Number(input.expectedVersion);
    if ((!existing && expectedVersion !== null) || (existing && expectedVersion !== existing.version)) throw new OpportunityPursuitError("conflict", `Pursuit changed${existing ? `; current version is ${existing.version}` : ""}.`);
    const now = this.now();
    const pursuit: OpportunityPursuit = Object.freeze({
      schemaVersion: 1, id, organizationId: scope.organizationId, opportunityReference: result.explanation.opportunityReference,
      decision: nextDecision, assessment, reviewedFitSnapshotId: result.snapshot.id,
      reviewedProjectionVersion: result.explanation.opportunityProjectionVersion,
      reviewedProjectionDigest: result.explanation.opportunityProjectionDigest,
      reviewedCapabilityInputDigest: result.explanation.organizationCapabilityInputDigest,
      fitPolicyVersion: result.explanation.policyVersion, version: (existing?.version ?? 0) + 1,
      createdByUserId: existing?.createdByUserId ?? scope.userId, createdByMembershipId: existing?.createdByMembershipId ?? scope.membershipId,
      updatedByUserId: scope.userId, updatedByMembershipId: scope.membershipId,
      createdAt: existing?.createdAt ?? now, updatedAt: now,
    });
    const eventId = opaque("opppursuitevent", String(scope.organizationId), commandId);
    const command: OpportunityPursuitCommandReceipt = Object.freeze({ schemaVersion: 1, id: commandId, organizationId: scope.organizationId, action: "pursuit.save", requestFingerprint, pursuitId: id, resultingVersion: pursuit.version, recordedAt: now });
    const event: OpportunityPursuitEvent = Object.freeze({ schemaVersion: 1, id: eventId, organizationId: scope.organizationId, actorUserId: scope.userId, actorMembershipId: scope.membershipId, kind: existing ? "pursuit-updated" : "pursuit-created", pursuitId: id, pursuitVersion: pursuit.version, decision: nextDecision, commandId, occurredAt: now });
    const audit = createOrganizationActionAuditEvent(authority.context.user, authority.membership, authority.organization, { id: opaque("audit", String(scope.organizationId), commandId), action: existing ? "opportunity.pursuit-updated" : "opportunity.pursuit-created", occurredAt: now });
    try {
      const saved = await this.dependencies.repository.savePursuit({ record: pursuit, expectedVersion, expectedFitSnapshotId, actingUserWatchId: opportunityWatchId(String(scope.organizationId), String(scope.userId), result.explanation.opportunityReference), command, event, audit });
      return Object.freeze({ pursuit, replayed: saved === "replayed" });
    } catch (error) {
      throw new OpportunityPursuitError("conflict", error instanceof Error ? error.message : "Pursuit changed before persistence.");
    }
  }
}
