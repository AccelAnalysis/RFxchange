import { createHash, randomUUID } from "node:crypto";

import type { PreparedAcquisitionContext } from "../acquisition/acquisition-context.ts";
import { authorizeOrganizationOperation, authorizeOrganizationParticipation, type OrganizationOperationAuthorizationDependencies } from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import { createTransactionalEmailRequest } from "../../domain/communications/transactional-email.ts";
import type { OrganizationProfileRepository } from "../../domain/organizations/repository.ts";
import { organizationId, type OrganizationId } from "../../domain/organizations/model.ts";
import { opportunityDeadlineState } from "../../domain/rfx/discovery.ts";
import { calculateOpportunityFit, opportunityPursuitId, type OpportunityPursuitRepository } from "../../domain/rfx/pursuit.ts";
import { governedResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import {
  TEAMING_BOUNDARY_VERSION,
  OpportunityTeamingRepositoryError,
  createTeamInvitation,
  createTeamParticipation,
  decideTeamInvitation,
  normalizedInvitationEmail,
  teamInvitationId,
  type OpportunityTeamingRepository,
  type ProposedTeamCapacity,
  type RfxGapResolutionContext,
  type TeamInvitation,
  type TeamInvitationCommandReceipt,
  type TeamInvitationEvent,
  type TeamInvitationStatus,
} from "../../domain/rfx/teaming.ts";
import type { OrganizationMembershipId, UserId } from "../../domain/users/model.ts";
import { TEAM_INVITATION_EVENT } from "./opportunity-teaming-templates.ts";

export class OpportunityTeamingError extends Error {
  readonly code: "invalid" | "forbidden" | "not-found" | "conflict" | "dependency-unavailable";

  constructor(code: OpportunityTeamingError["code"], message: string) {
    super(message);
    this.name = "OpportunityTeamingError";
    this.code = code;
  }
}

export interface OpportunityTeamingScope {
  readonly context: AuthenticatedServerContext;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
  readonly acquisitionContext?: Readonly<{
    id: string;
    kind: string;
    subjectReference: string | null;
  }> | null;
}

export interface VerifiedTeammateCandidate {
  readonly organizationId: OrganizationId;
  readonly displayName: string;
  readonly matchedCapabilityNames: readonly string[];
}

export interface TeamInvitationView {
  readonly id: string;
  readonly role: "lead" | "invitee";
  readonly status: TeamInvitationStatus;
  readonly version: number;
  readonly opportunityReference: string;
  readonly opportunityTitle: string;
  readonly issuerDisplayName: string;
  readonly responseDeadline: string;
  readonly leadOrganizationId: string;
  readonly leadOrganizationDisplayName: string;
  readonly targetDisplayName: string;
  readonly capabilityLabel: string;
  readonly gapTitle: string;
  readonly proposedCapacity: ProposedTeamCapacity;
  readonly responsibilitySummary: string;
  readonly boundaryVersion: typeof TEAMING_BOUNDARY_VERSION;
  readonly canDecide: boolean;
  readonly canRevoke: boolean;
  readonly unavailableReason: "expired" | null;
}

export interface OpportunityTeamingDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly pursuits: OpportunityPursuitRepository;
  readonly teaming: OpportunityTeamingRepository;
  readonly profiles: OrganizationProfileRepository;
  readonly acquisition: Readonly<{
    prepareTrusted(input: Readonly<{
      kind: "team-invitation";
      subjectReference: string;
      channel: "team-invitation-link";
      sourceReference: string;
      contextId: string;
      eventId: string;
      browserSecret: string;
      issuedAt: string;
    }>): PreparedAcquisitionContext;
  }>;
  readonly publicOrigin: string;
  readonly now?: () => string;
  readonly id?: () => string;
  readonly secret?: () => string;
}

function stable(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) throw new OpportunityTeamingError("invalid", `${label} is invalid.`);
  return normalized;
}

function text(value: string, label: string, maximum: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > maximum) throw new OpportunityTeamingError("invalid", `${label} is required and cannot exceed ${maximum} characters.`);
  return normalized;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function opaque(prefix: string, ...parts: readonly string[]): string {
  return `${prefix}_${createHash("sha256").update(parts.join(":"), "utf8").digest("hex").slice(0, 40)}`;
}

function capacity(value: string): ProposedTeamCapacity {
  if (value === "capability-contributor" || value === "delivery-support" || value === "subject-matter-support") return value;
  throw new OpportunityTeamingError("invalid", "Proposed capacity is unsupported.");
}

function activeDeadline(responseDeadline: string, now: string): boolean {
  return Boolean(responseDeadline && Date.parse(`${responseDeadline}T23:59:59.999Z`) > Date.parse(now));
}

function participantView(invitation: TeamInvitation, role: TeamInvitationView["role"], canManage: boolean, now: string): TeamInvitationView {
  const expired = invitation.status === "pending" && !activeDeadline(invitation.responseDeadlineSnapshot, now);
  return Object.freeze({
    id: invitation.id,
    role,
    status: expired ? "expired" : invitation.status,
    version: invitation.version,
    opportunityReference: invitation.opportunityReference,
    opportunityTitle: invitation.opportunityTitleSnapshot,
    issuerDisplayName: invitation.issuerDisplayNameSnapshot,
    responseDeadline: invitation.responseDeadlineSnapshot,
    leadOrganizationId: String(invitation.leadOrganizationId),
    leadOrganizationDisplayName: invitation.leadOrganizationDisplayNameSnapshot,
    targetDisplayName: invitation.target.kind === "organization" ? invitation.target.displayNameSnapshot : invitation.target.recipientDisplayName,
    capabilityLabel: invitation.capabilityLabelSnapshot,
    gapTitle: invitation.gapTitleSnapshot,
    proposedCapacity: invitation.proposedCapacity,
    responsibilitySummary: invitation.responsibilitySummary,
    boundaryVersion: TEAMING_BOUNDARY_VERSION,
    canDecide: role === "invitee" && invitation.status === "pending" && !expired && canManage,
    canRevoke: role === "lead" && invitation.status === "pending" && !expired && canManage,
    unavailableReason: expired ? "expired" : null,
  });
}

export class OpportunityTeamingService {
  private readonly now: () => string;
  private readonly id: () => string;
  private readonly secret: () => string;
  private readonly dependencies: OpportunityTeamingDependencies;

  constructor(dependencies: OpportunityTeamingDependencies) {
    this.dependencies = dependencies;
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.id = dependencies.id ?? randomUUID;
    this.secret = dependencies.secret ?? (() => randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", ""));
  }

  private async authorizeRead(scope: OpportunityTeamingScope) {
    if (scope.context.user.id !== scope.userId) throw new OpportunityTeamingError("forbidden", "RFx teaming access is unavailable.");
    const result = await authorizeOrganizationParticipation({
      context: scope.context,
      organizationId: scope.organizationId,
      membershipId: scope.membershipId,
    }, this.dependencies.authorization);
    if (!result.allowed) throw new OpportunityTeamingError("forbidden", "RFx teaming access is unavailable.");
    return result;
  }

  private async authorizeWrite(scope: OpportunityTeamingScope) {
    if (scope.context.user.id !== scope.userId) throw new OpportunityTeamingError("forbidden", "RFx teaming management is unavailable.");
    const result = await authorizeOrganizationOperation({
      context: scope.context,
      organizationId: scope.organizationId,
      membershipId: scope.membershipId,
      permission: "response.create",
    }, this.dependencies.authorization);
    if (!result.allowed) throw new OpportunityTeamingError("forbidden", "RFx teaming management is unavailable.");
    return result;
  }

  private async currentGapContext(leadOrganizationId: OrganizationId, referenceInput: string, gapReferenceInput: string): Promise<RfxGapResolutionContext> {
    const reference = stable(referenceInput, "Opportunity reference");
    const gapReference = stable(gapReferenceInput, "Gap reference");
    const pursuitId = opportunityPursuitId(String(leadOrganizationId), reference);
    const [persistedProjection, publication, pursuit, leadProfile] = await Promise.all([
      this.dependencies.pursuits.getProjection(reference),
      this.dependencies.pursuits.getPublicationSnapshotByReference(reference),
      this.dependencies.pursuits.getPursuit(pursuitId),
      this.dependencies.profiles.getByOrganizationId(leadOrganizationId),
    ]);
    if (!persistedProjection || !publication || !pursuit || !leadProfile || pursuit.organizationId !== leadOrganizationId || pursuit.decision !== "pursue") {
      throw new OpportunityTeamingError("not-found", "Current RFx gap resolution is unavailable.");
    }
    let projection;
    try {
      projection = governedResponderOpportunityProjection(persistedProjection, publication);
    } catch {
      throw new OpportunityTeamingError("dependency-unavailable", "Current RFx gap evidence is temporarily unavailable.");
    }
    const now = this.now();
    if (
      projection.mode !== "published" ||
      !projection.publishedAt ||
      !projection.issuerOrganizationIndexKey ||
      opportunityDeadlineState(projection, now) === "passed" ||
      projection.issuerOrganizationIndexKey === String(leadOrganizationId) ||
      pursuit.reviewedProjectionVersion !== projection.aggregateVersion ||
      pursuit.reviewedProjectionDigest !== projection.digest
    ) throw new OpportunityTeamingError("conflict", "The opportunity or reviewed fit changed. Review the current facts before resolving this gap.");
    const [fit, claims, serviceGeographyIds] = await Promise.all([
      this.dependencies.pursuits.getFitSnapshot(pursuit.reviewedFitSnapshotId),
      this.dependencies.pursuits.listCapabilityClaims(leadOrganizationId),
      this.dependencies.pursuits.getServiceGeographyIds(leadOrganizationId),
    ]);
    if (!fit || fit.organizationId !== leadOrganizationId || fit.opportunityReference !== reference) throw new OpportunityTeamingError("dependency-unavailable", "Current RFx gap evidence is temporarily unavailable.");
    const currentExplanation = calculateOpportunityFit({ organizationId: leadOrganizationId, projection, claims, serviceGeographyIds, calculatedAt: now });
    if (
      currentExplanation.inputDigest !== fit.explanation.inputDigest ||
      currentExplanation.inputDigest !== pursuit.gapAssessments.find((item) => item.reference === gapReference)?.reviewedExplanationInputDigest ||
      currentExplanation.organizationCapabilityInputDigest !== pursuit.reviewedCapabilityInputDigest
    ) throw new OpportunityTeamingError("conflict", "The organization fit changed. Review the current gaps before continuing.");
    const assessedGap = pursuit.gapAssessments.find((item) => item.reference === gapReference);
    const currentGap = currentExplanation.gaps.find((item) => item.reference === gapReference);
    const observationIndex = currentExplanation.requirementObservations.findIndex((item) => item.reference === currentGap?.observationReference);
    const observation = observationIndex >= 0 ? currentExplanation.requirementObservations[observationIndex] : null;
    const requirement = observationIndex >= 0 ? projection.requirementIndex?.[observationIndex] : null;
    if (
      !assessedGap ||
      !currentGap ||
      (assessedGap.status !== "open" && assessedGap.status !== "acknowledged") ||
      (currentGap.kind !== "missing-capability" && currentGap.kind !== "unconfirmed-capability") ||
      !observation?.teamCoverageAllowed ||
      !observation.capabilityLabel ||
      !requirement?.requirementId
    ) throw new OpportunityTeamingError("conflict", "This gap is not currently eligible for teammate discovery.");
    return Object.freeze({
      schemaVersion: 1,
      organizationId: leadOrganizationId,
      leadOrganizationDisplayName: leadProfile.displayName,
      opportunityReference: reference,
      opportunityTitle: projection.payload.title,
      issuerOrganizationId: organizationId(projection.issuerOrganizationIndexKey),
      issuerDisplayName: projection.payload.issuerDisplayName,
      responseDeadline: projection.payload.timing.responseDeadline ?? "",
      pursuitId: pursuit.id,
      pursuitVersion: pursuit.version,
      fitSnapshotId: fit.id,
      explanationInputDigest: currentExplanation.inputDigest,
      gapReference,
      gapKind: currentGap.kind,
      gapTitle: currentGap.title,
      observationReference: currentGap.observationReference,
      requirementReference: requirement.requirementId,
      capabilityLabel: observation.capabilityLabel,
      teamCoverageAllowed: true,
      geographyIds: Object.freeze(projection.payload.localities.map((item) => item.id)),
      returnHref: `/opportunities/${encodeURIComponent(reference)}/assess`,
    });
  }

  async gapContext(scope: OpportunityTeamingScope, reference: string, gapReference: string): Promise<RfxGapResolutionContext> {
    await this.authorizeRead(scope);
    return this.currentGapContext(scope.organizationId, reference, gapReference);
  }

  resourceHref(context: RfxGapResolutionContext, returnHrefInput: string = context.returnHref): string {
    const expectedPath = `/opportunities/${encodeURIComponent(context.opportunityReference)}/assess`;
    let returnHref = context.returnHref;
    try {
      const parsed = new URL(returnHrefInput, "https://rfxchange.invalid");
      if (parsed.origin === "https://rfxchange.invalid" && parsed.pathname === expectedPath && returnHrefInput.startsWith("/") && !returnHrefInput.startsWith("//") && returnHrefInput.length <= 2_000) returnHref = `${parsed.pathname}${parsed.search}`;
    } catch {
      // Browser return context never grants authority; malformed input falls back to the governed assessment.
    }
    const query = new URLSearchParams({
      q: context.capabilityLabel,
      rfxReference: context.opportunityReference,
      rfxGap: context.gapReference,
      returnTo: returnHref,
    });
    return `/resources?${query.toString()}`;
  }

  async invitations(scope: OpportunityTeamingScope, reference: string): Promise<readonly TeamInvitationView[]> {
    await this.authorizeRead(scope);
    const [records, management] = await Promise.all([
      this.dependencies.teaming.listByLeadOrganization(scope.organizationId, stable(reference, "Opportunity reference")),
      authorizeOrganizationOperation({ context: scope.context, organizationId: scope.organizationId, membershipId: scope.membershipId, permission: "response.create" }, this.dependencies.authorization),
    ]);
    return Object.freeze(records.map((item) => participantView(item, "lead", management.allowed, this.now())));
  }

  async receivedInvitations(scope: OpportunityTeamingScope): Promise<readonly TeamInvitationView[]> {
    await this.authorizeRead(scope);
    const [records, management] = await Promise.all([
      this.dependencies.teaming.listByTargetOrganization(scope.organizationId),
      authorizeOrganizationOperation({ context: scope.context, organizationId: scope.organizationId, membershipId: scope.membershipId, permission: "response.create" }, this.dependencies.authorization),
    ]);
    return Object.freeze(records.map((item) => participantView(item, "invitee", management.allowed, this.now())).sort((left, right) => right.responseDeadline.localeCompare(left.responseDeadline) || left.opportunityTitle.localeCompare(right.opportunityTitle)));
  }

  async createInvitation(scope: OpportunityTeamingScope, input: Readonly<{
    commandId: string;
    reference: string;
    gapReference: string;
    proposedCapacity: string;
    responsibilitySummary: string;
    candidate?: VerifiedTeammateCandidate | null;
    recipientDisplayName?: string | null;
    recipientEmail?: string | null;
  }>): Promise<Readonly<{ invitation: TeamInvitation; view: TeamInvitationView; replayed: boolean }>> {
    const authority = await this.authorizeWrite(scope);
    const commandId = stable(input.commandId, "Command identity");
    const context = await this.currentGapContext(scope.organizationId, input.reference, input.gapReference);
    const proposedCapacity = capacity(input.proposedCapacity);
    const responsibilitySummary = text(input.responsibilitySummary, "Proposed responsibility", 800);
    const candidate = input.candidate ?? null;
    let targetReference: string;
    let target: TeamInvitation["target"];
    if (candidate) {
      if (candidate.organizationId === scope.organizationId || candidate.organizationId === context.issuerOrganizationId) throw new OpportunityTeamingError("invalid", "This organization cannot be invited for the selected RFx gap.");
      if (!candidate.matchedCapabilityNames.some((name) => name.toLocaleLowerCase("en-US") === context.capabilityLabel.toLocaleLowerCase("en-US"))) throw new OpportunityTeamingError("conflict", "The selected organization is no longer a current capability candidate.");
      targetReference = String(candidate.organizationId);
      target = Object.freeze({ kind: "organization" as const, organizationId: candidate.organizationId, displayNameSnapshot: text(candidate.displayName, "Candidate organization", 160) });
    } else {
      const recipientEmail = normalizedInvitationEmail(input.recipientEmail ?? "");
      targetReference = recipientEmail;
      target = Object.freeze({ kind: "external" as const, recipientEmail, recipientDisplayName: text(input.recipientDisplayName ?? "", "Invitation recipient", 160) });
    }
    const invitationId = teamInvitationId({
      leadOrganizationId: String(scope.organizationId),
      opportunityReference: context.opportunityReference,
      gapReference: context.gapReference,
      targetReference,
      proposedCapacity,
    });
    const requestFingerprint = fingerprint({ action: "invitation.create", organizationId: scope.organizationId, invitationId, context, target, proposedCapacity, responsibilitySummary });
    const prior = await this.dependencies.teaming.getCommand(commandId);
    if (prior) {
      if (prior.organizationId !== scope.organizationId || prior.action !== "invitation.create" || prior.requestFingerprint !== requestFingerprint || prior.invitationId !== invitationId) throw new OpportunityTeamingError("conflict", "Command identity was reused for different invitation intent.");
      return Object.freeze({ invitation: prior.resultingInvitation, view: participantView(prior.resultingInvitation, "lead", true, this.now()), replayed: true });
    }
    const now = this.now();
    let acquisition: PreparedAcquisitionContext | null = null;
    let communicationRequest = null;
    if (target.kind === "external") {
      const contextId = opaque("acq", invitationId, commandId);
      acquisition = this.dependencies.acquisition.prepareTrusted({
        kind: "team-invitation",
        subjectReference: invitationId,
        channel: "team-invitation-link",
        sourceReference: context.opportunityReference,
        contextId,
        eventId: opaque("acqevent", invitationId, commandId),
        browserSecret: this.secret(),
        issuedAt: now,
      });
      const token = `v1.${acquisition.token.contextId}.${acquisition.token.browserSecret}`;
      const continueUrl = `${this.dependencies.publicOrigin}/api/opportunities/team-invitations/acquire?invitation=${encodeURIComponent(invitationId)}&token=${encodeURIComponent(token)}`;
      communicationRequest = createTransactionalEmailRequest({
        id: opaque("teaminvmsg", invitationId),
        purpose: "transactional",
        recipientEmail: target.recipientEmail,
        recipientDisplayName: target.recipientDisplayName,
        eventKey: TEAM_INVITATION_EVENT,
        eventVersion: 1,
        templateKey: "rfx-team-invitation",
        templateVersion: 1,
        variables: {
          recipient_name: target.recipientDisplayName,
          lead_organization: authority.organization.id === scope.organizationId ? context.leadOrganizationDisplayName : "An organization",
          opportunity_title: context.opportunityTitle,
          capability_need: context.capabilityLabel,
          proposed_responsibility: responsibilitySummary,
          continue_url: continueUrl,
        },
        correlationId: `team-invitation:${invitationId}`,
        idempotencyKey: `team-invitation:${invitationId}`,
        requestedAt: now,
        organizationId: String(scope.organizationId),
        userId: String(scope.userId),
        relatedObjectType: "rfx-team-invitation",
        relatedObjectId: invitationId,
        tags: ["rfx", "team-invitation"],
      });
    }
    const invitation = createTeamInvitation({
      id: invitationId,
      context,
      target,
      proposedCapacity,
      responsibilitySummary,
      acquisitionContextId: acquisition?.context.id ?? null,
      communicationRequest,
      actorUserId: scope.userId,
      actorMembershipId: scope.membershipId,
      now,
    });
    const command: TeamInvitationCommandReceipt = Object.freeze({ schemaVersion: 1, id: commandId, organizationId: scope.organizationId, action: "invitation.create", requestFingerprint, invitationId, resultingVersion: invitation.version, resultingInvitation: invitation, recordedAt: now });
    const event: TeamInvitationEvent = Object.freeze({ schemaVersion: 1, id: opaque("teaminvevent", invitationId, commandId), invitationId, leadOrganizationId: scope.organizationId, actorOrganizationId: scope.organizationId, actorUserId: scope.userId, actorMembershipId: scope.membershipId, kind: "invitation-created", invitationVersion: invitation.version, commandId, occurredAt: now });
    const commitAuthority = await this.authorizeWrite(scope);
    const audit = createOrganizationActionAuditEvent(commitAuthority.context.user, commitAuthority.membership, commitAuthority.organization, { id: opaque("audit", invitationId, commandId), action: "opportunity.team-invitation-created", occurredAt: now });
    try {
      const saved = await this.dependencies.teaming.createInvitation({ invitation, command, event, audit, acquisition });
      if (saved === "replayed") {
        const committed = await this.dependencies.teaming.getCommand(commandId);
        if (!committed || committed.requestFingerprint !== requestFingerprint) throw new OpportunityTeamingError("dependency-unavailable", "Invitation replay is temporarily unavailable.");
        return Object.freeze({ invitation: committed.resultingInvitation, view: participantView(committed.resultingInvitation, "lead", true, this.now()), replayed: true });
      }
      return Object.freeze({ invitation, view: participantView(invitation, "lead", true, this.now()), replayed: false });
    } catch (error) {
      if (error instanceof OpportunityTeamingError) throw error;
      if (error instanceof OpportunityTeamingRepositoryError) throw new OpportunityTeamingError(error.code, error.message);
      throw new OpportunityTeamingError("dependency-unavailable", "Invitation persistence is temporarily unavailable.");
    }
  }

  private externalAcquisitionMatches(scope: OpportunityTeamingScope, invitation: TeamInvitation): boolean {
    return invitation.target.kind === "external" &&
      Boolean(invitation.acquisitionContextId) &&
      scope.acquisitionContext?.id === invitation.acquisitionContextId &&
      scope.acquisitionContext.kind === "team-invitation" &&
      scope.acquisitionContext.subjectReference === invitation.id &&
      normalizedInvitationEmail(scope.context.user.primaryEmail) === invitation.target.recipientEmail;
  }

  async review(scope: OpportunityTeamingScope, invitationIdInput: string): Promise<TeamInvitationView> {
    await this.authorizeRead(scope);
    const invitation = await this.dependencies.teaming.getInvitation(stable(invitationIdInput, "Invitation identity"));
    if (!invitation) throw new OpportunityTeamingError("not-found", "Team invitation is unavailable.");
    const role = invitation.leadOrganizationId === scope.organizationId
      ? "lead" as const
      : invitation.target.kind === "organization" && invitation.target.organizationId === scope.organizationId
        ? "invitee" as const
        : this.externalAcquisitionMatches(scope, invitation)
          ? "invitee" as const
          : null;
    if (!role) throw new OpportunityTeamingError("not-found", "Team invitation is unavailable.");
    const management = await authorizeOrganizationOperation({ context: scope.context, organizationId: scope.organizationId, membershipId: scope.membershipId, permission: "response.create" }, this.dependencies.authorization);
    return participantView(invitation, role, management.allowed, this.now());
  }

  async decide(scope: OpportunityTeamingScope, input: Readonly<{
    commandId: string;
    invitationId: string;
    expectedVersion: number;
    action: "accept" | "decline" | "revoke";
    boundaryVersion?: number | null;
    boundaryLocale?: string | null;
  }>): Promise<Readonly<{ view: TeamInvitationView; replayed: boolean }>> {
    await this.authorizeWrite(scope);
    const commandId = stable(input.commandId, "Command identity");
    const invitationId = stable(input.invitationId, "Invitation identity");
    const requestFingerprint = fingerprint({ action: input.action, organizationId: scope.organizationId, invitationId, expectedVersion: input.expectedVersion, boundaryVersion: input.action === "accept" ? input.boundaryVersion ?? null : null, boundaryLocale: input.action === "accept" ? input.boundaryLocale ?? null : null });
    const prior = await this.dependencies.teaming.getCommand(commandId);
    if (prior) {
      const expectedAction = `invitation.${input.action}`;
      if (prior.organizationId !== scope.organizationId || prior.action !== expectedAction || prior.requestFingerprint !== requestFingerprint || prior.invitationId !== invitationId) throw new OpportunityTeamingError("conflict", "Command identity was reused for a different invitation decision.");
      const role = prior.resultingInvitation.leadOrganizationId === scope.organizationId ? "lead" : "invitee";
      return Object.freeze({ view: participantView(prior.resultingInvitation, role, true, this.now()), replayed: true });
    }
    const current = await this.dependencies.teaming.getInvitation(invitationId);
    if (!current) throw new OpportunityTeamingError("not-found", "Team invitation is unavailable.");
    const leadAction = input.action === "revoke";
    if (leadAction) {
      if (current.leadOrganizationId !== scope.organizationId) throw new OpportunityTeamingError("not-found", "Team invitation is unavailable.");
    } else {
      const authorizedTarget = current.target.kind === "organization"
        ? current.target.organizationId === scope.organizationId
        : this.externalAcquisitionMatches(scope, current);
      if (!authorizedTarget) throw new OpportunityTeamingError("not-found", "Team invitation is unavailable.");
    }
    await this.currentGapContext(current.leadOrganizationId, current.opportunityReference, current.gapReference);
    let invitation: TeamInvitation;
    try {
      invitation = decideTeamInvitation({
        current,
        expectedVersion: input.expectedVersion,
        action: input.action,
        actorOrganizationId: scope.organizationId,
        actorUserId: scope.userId,
        actorMembershipId: scope.membershipId,
        attachedOrganizationId: current.target.kind === "external" ? scope.organizationId : null,
        boundaryVersion: input.boundaryVersion,
        boundaryLocale: input.boundaryLocale,
        now: this.now(),
      });
    } catch (error) {
      throw new OpportunityTeamingError("conflict", error instanceof Error ? error.message : "Invitation changed before this decision.");
    }
    const now = invitation.updatedAt;
    const action = `invitation.${input.action}` as TeamInvitationCommandReceipt["action"];
    const command: TeamInvitationCommandReceipt = Object.freeze({ schemaVersion: 1, id: commandId, organizationId: scope.organizationId, action, requestFingerprint, invitationId, resultingVersion: invitation.version, resultingInvitation: invitation, recordedAt: now });
    const eventKind = input.action === "accept" ? "invitation-accepted" : input.action === "decline" ? "invitation-declined" : "invitation-revoked";
    const event: TeamInvitationEvent = Object.freeze({ schemaVersion: 1, id: opaque("teaminvevent", invitationId, commandId), invitationId, leadOrganizationId: invitation.leadOrganizationId, actorOrganizationId: scope.organizationId, actorUserId: scope.userId, actorMembershipId: scope.membershipId, kind: eventKind, invitationVersion: invitation.version, commandId, occurredAt: now });
    const participation = input.action === "accept" ? createTeamParticipation({ invitation, actorOrganizationId: scope.organizationId, actorUserId: scope.userId, actorMembershipId: scope.membershipId }) : null;
    const commitAuthority = await this.authorizeWrite(scope);
    const audit = createOrganizationActionAuditEvent(commitAuthority.context.user, commitAuthority.membership, commitAuthority.organization, { id: opaque("audit", invitationId, commandId), action: `opportunity.team-invitation-${input.action}`, occurredAt: now });
    try {
      const saved = await this.dependencies.teaming.decideInvitation({ invitation, expectedVersion: input.expectedVersion, command, event, audit, participation });
      if (saved === "replayed") {
        const committed = await this.dependencies.teaming.getCommand(commandId);
        if (!committed || committed.requestFingerprint !== requestFingerprint) throw new OpportunityTeamingError("dependency-unavailable", "Invitation decision replay is temporarily unavailable.");
        return Object.freeze({ view: participantView(committed.resultingInvitation, leadAction ? "lead" : "invitee", true, this.now()), replayed: true });
      }
      return Object.freeze({ view: participantView(invitation, leadAction ? "lead" : "invitee", true, this.now()), replayed: false });
    } catch (error) {
      if (error instanceof OpportunityTeamingError) throw error;
      if (error instanceof OpportunityTeamingRepositoryError) throw new OpportunityTeamingError(error.code, error.message);
      throw new OpportunityTeamingError("dependency-unavailable", "Invitation decision persistence is temporarily unavailable.");
    }
  }
}
