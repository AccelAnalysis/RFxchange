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
  type OpportunityGapAssessment,
  type OpportunityGapKind,
  type OpportunityGapStatus,
  type OpportunityPursuit,
  type OpportunityPursuitCommandReceipt,
  type OpportunityPursuitEvent,
  type OpportunityPursuitRepository,
  OpportunityPursuitRepositoryError,
  type ParticipantGapStatus,
  type PursuitAssessment,
  type PursuitDecision,
} from "../../domain/rfx/pursuit.ts";
import { governedResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import type { OrganizationMembershipId, UserId } from "../../domain/users/model.ts";
import { authorizeOrganizationOperation, authorizeOrganizationParticipation, type OrganizationOperationAuthorizationDependencies } from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";

export class OpportunityPursuitError extends Error {
  readonly code: "invalid" | "forbidden" | "not-found" | "conflict" | "dependency-unavailable";

  constructor(code: OpportunityPursuitError["code"], message: string) {
    super(message);
    this.code = code;
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
  readonly pursuit: ParticipantOpportunityPursuit | null;
  readonly gaps: readonly ParticipantOpportunityGap[];
  readonly stale: boolean;
  readonly canManage: boolean;
}

export interface ParticipantOpportunityPursuit {
  readonly decision: PursuitDecision;
  readonly assessment: PursuitAssessment;
  readonly version: number;
}

export interface ParticipantOpportunityGap {
  readonly reference: string;
  readonly kind: OpportunityGapKind;
  readonly title: string;
  readonly status: OpportunityGapStatus;
  readonly current: boolean;
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

function participantPursuitView(record: OpportunityPursuit): ParticipantOpportunityPursuit {
  if (!Number.isInteger(record.version) || record.version < 1) throw new OpportunityPursuitError("dependency-unavailable", "Pursuit state is temporarily unavailable.");
  return Object.freeze({
    decision: decision(record.decision),
    assessment: normalizePursuitAssessment(record.assessment),
    version: record.version,
  });
}

function pursuitIsStale(pursuit: OpportunityPursuit | null, result: Readonly<{ explanation: MatchExplanation; snapshot: OpportunityFitSnapshot }>): boolean {
  return Boolean(pursuit && (
    pursuit.reviewedFitSnapshotId !== result.snapshot.id ||
    pursuit.reviewedProjectionVersion !== result.explanation.opportunityProjectionVersion ||
    pursuit.reviewedProjectionDigest !== result.explanation.opportunityProjectionDigest ||
    pursuit.reviewedCapabilityInputDigest !== result.explanation.organizationCapabilityInputDigest ||
    pursuit.fitPolicyVersion !== result.explanation.policyVersion
  ));
}

function requestedGapStatuses(input: Readonly<Record<string, string>> | undefined): Readonly<Record<string, ParticipantGapStatus>> {
  const normalized: Record<string, ParticipantGapStatus> = {};
  for (const [rawReference, rawStatus] of Object.entries(input ?? {}).sort(([left], [right]) => left.localeCompare(right))) {
    const reference = stable(rawReference, "Gap reference");
    if (rawStatus !== "open" && rawStatus !== "acknowledged" && rawStatus !== "deferred") throw new OpportunityPursuitError("invalid", "Gap status is unsupported.");
    if (reference in normalized) throw new OpportunityPursuitError("invalid", "Gap reference is duplicated.");
    normalized[reference] = rawStatus;
  }
  return Object.freeze(normalized);
}

function gapAssessmentRecords(
  explanation: MatchExplanation,
  fitSnapshotId: string,
  pursuit: OpportunityPursuit | null,
  requested?: Readonly<Record<string, ParticipantGapStatus>>,
): readonly OpportunityGapAssessment[] {
  const previous = new Map((pursuit?.gapAssessments ?? []).map((item) => [item.reference, item]));
  const currentReferences = new Set(explanation.gaps.map((item) => item.reference));
  for (const reference of Object.keys(requested ?? {})) if (!currentReferences.has(reference)) throw new OpportunityPursuitError("conflict", "Opportunity gaps changed; review the current facts before saving.");
  const current = explanation.gaps.map((gap): OpportunityGapAssessment => {
    const prior = previous.get(gap.reference);
    const retainedStatus = prior && prior.reviewedExplanationInputDigest === explanation.inputDigest && prior.status !== "resolved-by-current-profile" ? prior.status : "open";
    return Object.freeze({
      reference: gap.reference,
      observationReference: gap.observationReference,
      kind: gap.kind,
      title: gap.title,
      capabilityLabel: gap.capabilityLabel,
      openedExplanationInputDigest: prior?.openedExplanationInputDigest ?? gap.explanationInputDigest,
      reviewedExplanationInputDigest: explanation.inputDigest,
      reviewedFitSnapshotId: fitSnapshotId,
      status: requested?.[gap.reference] ?? retainedStatus,
    });
  });
  const resolved = [...previous.values()].filter((prior) => {
    if (currentReferences.has(prior.reference) || (prior.kind !== "missing-capability" && prior.kind !== "unconfirmed-capability")) return false;
    return explanation.requirementObservations.some((observation) => observation.reference === prior.observationReference && observation.state === "aligned");
  }).map((prior): OpportunityGapAssessment => Object.freeze({ ...prior, reviewedExplanationInputDigest: explanation.inputDigest, reviewedFitSnapshotId: fitSnapshotId, status: "resolved-by-current-profile" }));
  return Object.freeze([...current, ...resolved]);
}

function participantGapViews(records: readonly OpportunityGapAssessment[], explanation: MatchExplanation): readonly ParticipantOpportunityGap[] {
  const currentReferences = new Set(explanation.gaps.map((item) => item.reference));
  return Object.freeze(records.map((item) => Object.freeze({ reference: item.reference, kind: item.kind, title: item.title, status: item.status, current: currentReferences.has(item.reference) })));
}

export class OpportunityPursuitService {
  private readonly now: () => string;
  private readonly dependencies: Readonly<{
    authorization: OrganizationOperationAuthorizationDependencies;
    repository: OpportunityPursuitRepository;
    now?: () => string;
  }>;

  constructor(dependencies: Readonly<{
    authorization: OrganizationOperationAuthorizationDependencies;
    repository: OpportunityPursuitRepository;
    now?: () => string;
  }>) {
    this.dependencies = dependencies;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  private async authorizeRead(scope: OpportunityPursuitScope) {
    if (scope.context.user.id !== scope.userId) throw new OpportunityPursuitError("forbidden", "Pursuit access is unavailable.");
    const authority = await authorizeOrganizationParticipation({ context: scope.context, organizationId: scope.organizationId, membershipId: scope.membershipId }, this.dependencies.authorization);
    if (!authority.allowed) throw new OpportunityPursuitError("forbidden", "Pursuit access is unavailable.");
    return authority;
  }

  private async authorizeWrite(scope: OpportunityPursuitScope) {
    if (scope.context.user.id !== scope.userId) throw new OpportunityPursuitError("forbidden", "Pursuit access is unavailable.");
    const authority = await authorizeOrganizationOperation({ context: scope.context, organizationId: scope.organizationId, membershipId: scope.membershipId, permission: "response.create" }, this.dependencies.authorization);
    if (!authority.allowed) throw new OpportunityPursuitError("forbidden", "Pursuit access is unavailable.");
    return authority;
  }

  private async calculate(scope: OpportunityPursuitScope, referenceInput: string): Promise<Readonly<{ explanation: MatchExplanation; snapshot: OpportunityFitSnapshot }>> {
    const reference = stable(referenceInput, "Opportunity reference");
    const persistedProjection = await this.dependencies.repository.getProjection(reference);
    if (!persistedProjection || persistedProjection.mode !== "published" || !persistedProjection.publishedAt || (persistedProjection.audience !== "public" && persistedProjection.audience !== "authenticated-participants") || opportunityDeadlineState(persistedProjection, this.now()) === "passed") throw new OpportunityPursuitError("not-found", "Opportunity is unavailable.");
    const publicationEvidence = await this.dependencies.repository.getPublicationSnapshotByReference(reference);
    if (!publicationEvidence) throw new OpportunityPursuitError("dependency-unavailable", "The governed fit source for this opportunity is temporarily unavailable.");
    const projection = (() => {
      try {
        return governedResponderOpportunityProjection(persistedProjection, publicationEvidence);
      } catch {
        throw new OpportunityPursuitError("dependency-unavailable", "The governed fit source for this opportunity is temporarily unavailable.");
      }
    })();
    if (projection.issuerOrganizationIndexKey === String(scope.organizationId)) throw new OpportunityPursuitError("forbidden", "The issuing organization cannot pursue its own opportunity.");
    const [claims, serviceGeographyIds] = await Promise.all([
      this.dependencies.repository.listCapabilityClaims(scope.organizationId),
      this.dependencies.repository.getServiceGeographyIds(scope.organizationId),
    ]);
    const calculatedAt = this.now();
    const explanation = calculateOpportunityFit({ organizationId: scope.organizationId, projection, claims, serviceGeographyIds, calculatedAt });
    const id = opportunityFitSnapshotId({ organizationId: String(scope.organizationId), reference, projectionVersion: projection.aggregateVersion, projectionDigest: projection.digest, capabilityInputDigest: explanation.organizationCapabilityInputDigest });
    const snapshot: OpportunityFitSnapshot = Object.freeze({ schemaVersion: 1, id, organizationId: scope.organizationId, opportunityReference: reference, explanation, recordedAt: calculatedAt });
    try {
      await this.dependencies.repository.recordFit(snapshot);
    } catch (error) {
      if (error instanceof OpportunityPursuitRepositoryError) throw new OpportunityPursuitError("dependency-unavailable", error.message);
      throw new OpportunityPursuitError("dependency-unavailable", "Opportunity fit persistence is temporarily unavailable.");
    }
    return Object.freeze({ explanation, snapshot });
  }

  async explain(scope: OpportunityPursuitScope, reference: string): Promise<Readonly<{ explanation: MatchExplanation; fitSnapshotId: string }>> {
    await this.authorizeRead(scope);
    const result = await this.calculate(scope, reference);
    return Object.freeze({ explanation: result.explanation, fitSnapshotId: result.snapshot.id });
  }

  async workspace(scope: OpportunityPursuitScope, reference: string): Promise<OpportunityPursuitWorkspace> {
    await this.authorizeRead(scope);
    const result = await this.calculate(scope, reference);
    const pursuit = await this.dependencies.repository.getPursuit(opportunityPursuitId(String(scope.organizationId), result.explanation.opportunityReference));
    const gaps = gapAssessmentRecords(result.explanation, result.snapshot.id, pursuit);
    const stale = pursuitIsStale(pursuit, result);
    const management = await authorizeOrganizationOperation({ context: scope.context, organizationId: scope.organizationId, membershipId: scope.membershipId, permission: "response.create" }, this.dependencies.authorization);
    return Object.freeze({ explanation: result.explanation, fitSnapshotId: result.snapshot.id, pursuit: pursuit ? participantPursuitView(pursuit) : null, gaps: participantGapViews(gaps, result.explanation), stale, canManage: management.allowed });
  }

  async save(scope: OpportunityPursuitScope, input: Readonly<{
    commandId: string;
    reference: string;
    expectedVersion: number | null;
    expectedFitSnapshotId: string;
    decision: string;
    assessment: Partial<Record<keyof PursuitAssessment, Readonly<{ state?: string; note?: string }>>>;
    gapResolutions?: Readonly<Record<string, string>>;
    reconfirmedStaleInputs?: boolean;
  }>): Promise<Readonly<{ pursuit: ParticipantOpportunityPursuit; replayed: boolean }>> {
    await this.authorizeWrite(scope);
    const commandId = stable(input.commandId, "Command identity");
    const expectedFitSnapshotId = stable(input.expectedFitSnapshotId, "Fit snapshot identity");
    const reference = stable(input.reference, "Opportunity reference");
    const id = opportunityPursuitId(String(scope.organizationId), reference);
    const assessment = normalizePursuitAssessment(input.assessment);
    const gapResolutions = requestedGapStatuses(input.gapResolutions);
    const nextDecision = decision(input.decision);
    const reconfirmedStaleInputs = input.reconfirmedStaleInputs === true;
    // Reconfirmation is review evidence, not business intent, so historical command fingerprints remain replay-compatible.
    const requestFingerprint = hash({ action: "pursuit.save", organizationId: scope.organizationId, reference, expectedVersion: input.expectedVersion, expectedFitSnapshotId, decision: nextDecision, assessment, gapResolutions });
    const prior = await this.dependencies.repository.getCommand(commandId);
    if (prior) {
      if (prior.requestFingerprint !== requestFingerprint || prior.pursuitId !== id) throw new OpportunityPursuitError("conflict", "Command identity was reused for different intent.");
      if (!prior.resultingPursuit || prior.resultingPursuit.id !== id || prior.resultingPursuit.version !== prior.resultingVersion) throw new OpportunityPursuitError("dependency-unavailable", "Pursuit replay is temporarily unavailable.");
      return Object.freeze({ pursuit: participantPursuitView(prior.resultingPursuit), replayed: true });
    }
    const result = await this.calculate(scope, reference);
    if (result.snapshot.id !== expectedFitSnapshotId) throw new OpportunityPursuitError("conflict", "Opportunity fit changed; review the current explanation before saving.");
    const existing = await this.dependencies.repository.getPursuit(id);
    const expectedVersion = input.expectedVersion === null ? null : Number(input.expectedVersion);
    if ((!existing && expectedVersion !== null) || (existing && expectedVersion !== existing.version)) throw new OpportunityPursuitError("conflict", `Pursuit changed${existing ? `; current version is ${existing.version}` : ""}.`);
    if (pursuitIsStale(existing, result) && !reconfirmedStaleInputs) throw new OpportunityPursuitError("conflict", "Opportunity fit changed; explicitly reconfirm the retained assessment against the current facts before saving.");
    const gapAssessments = gapAssessmentRecords(result.explanation, result.snapshot.id, existing, gapResolutions);
    const now = this.now();
    const pursuit: OpportunityPursuit = Object.freeze({
      schemaVersion: 1, id, organizationId: scope.organizationId, opportunityReference: result.explanation.opportunityReference,
      decision: nextDecision, assessment, gapAssessments, reviewedFitSnapshotId: result.snapshot.id,
      reviewedProjectionVersion: result.explanation.opportunityProjectionVersion,
      reviewedProjectionDigest: result.explanation.opportunityProjectionDigest,
      reviewedCapabilityInputDigest: result.explanation.organizationCapabilityInputDigest,
      fitPolicyVersion: result.explanation.policyVersion, version: (existing?.version ?? 0) + 1,
      createdByUserId: existing?.createdByUserId ?? scope.userId, createdByMembershipId: existing?.createdByMembershipId ?? scope.membershipId,
      updatedByUserId: scope.userId, updatedByMembershipId: scope.membershipId,
      createdAt: existing?.createdAt ?? now, updatedAt: now,
    });
    const eventId = opaque("opppursuitevent", String(scope.organizationId), commandId);
    const command: OpportunityPursuitCommandReceipt = Object.freeze({ schemaVersion: 1, id: commandId, organizationId: scope.organizationId, action: "pursuit.save", requestFingerprint, pursuitId: id, resultingVersion: pursuit.version, resultingPursuit: pursuit, recordedAt: now });
    const event: OpportunityPursuitEvent = Object.freeze({ schemaVersion: 1, id: eventId, organizationId: scope.organizationId, actorUserId: scope.userId, actorMembershipId: scope.membershipId, kind: existing ? "pursuit-updated" : "pursuit-created", pursuitId: id, pursuitVersion: pursuit.version, decision: nextDecision, commandId, occurredAt: now });
    const commitAuthority = await this.authorizeWrite(scope);
    const audit = createOrganizationActionAuditEvent(commitAuthority.context.user, commitAuthority.membership, commitAuthority.organization, { id: opaque("audit", String(scope.organizationId), commandId), action: existing ? "opportunity.pursuit-updated" : "opportunity.pursuit-created", occurredAt: now });
    try {
      const saved = await this.dependencies.repository.savePursuit({ record: pursuit, expectedVersion, expectedFitSnapshotId, actingUserWatchId: opportunityWatchId(String(scope.organizationId), String(scope.userId), result.explanation.opportunityReference), command, event, audit });
      if (saved === "replayed") {
        const committed = await this.dependencies.repository.getCommand(commandId);
        if (!committed?.resultingPursuit || committed.resultingPursuit.id !== id || committed.resultingPursuit.version !== committed.resultingVersion) throw new OpportunityPursuitError("dependency-unavailable", "Pursuit replay is temporarily unavailable.");
        return Object.freeze({ pursuit: participantPursuitView(committed.resultingPursuit), replayed: true });
      }
      return Object.freeze({ pursuit: participantPursuitView(pursuit), replayed: false });
    } catch (error) {
      if (error instanceof OpportunityPursuitError) throw error;
      if (error instanceof OpportunityPursuitRepositoryError) throw new OpportunityPursuitError(error.code, error.message);
      throw new OpportunityPursuitError("dependency-unavailable", "Pursuit persistence is temporarily unavailable.");
    }
  }
}
