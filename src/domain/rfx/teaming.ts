import { createHash } from "node:crypto";

import type { PreparedAcquisitionContext } from "../../application/acquisition/acquisition-context.ts";
import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { TransactionalEmailRequest } from "../communications/transactional-email.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";
import type { OpportunityGapKind } from "./pursuit.ts";

export const TEAMING_BOUNDARY_VERSION = 1 as const;

export const TEAMING_BOUNDARY_COPY =
  "Accepting this invitation records RFx-scoped participation in The RFxchange. It does not create a subcontract, joint venture, teaming agreement, exclusivity, compensation obligation, promise to submit, or authority to bind another organization.";

export const TEAMING_BOUNDARY_COPY_BY_LOCALE = Object.freeze({
  "en-US": TEAMING_BOUNDARY_COPY,
  es: "Aceptar esta invitación registra la participación limitada al RFx en The RFxchange. No crea un subcontrato, una empresa conjunta, un acuerdo de colaboración, exclusividad, una obligación de compensación, una promesa de presentar una respuesta ni autoridad para vincular a otra organización.",
  fr: "Accepter cette invitation enregistre une participation limitée à ce RFx dans The RFxchange. Cela ne crée ni contrat de sous-traitance, ni coentreprise, ni accord de groupement, ni exclusivité, ni obligation de rémunération, ni promesse de soumissionner, ni pouvoir d’engager une autre organisation.",
  it: "L’accettazione di questo invito registra una partecipazione limitata all’RFx in The RFxchange. Non crea un subappalto, una joint venture, un accordo di collaborazione, un vincolo di esclusiva, un obbligo di compenso, una promessa di presentare una risposta o l’autorità di vincolare un’altra organizzazione.",
  de: "Mit der Annahme dieser Einladung wird eine auf dieses RFx beschränkte Teilnahme in The RFxchange dokumentiert. Dadurch entstehen weder ein Unterauftrag noch ein Joint Venture, eine Teaming-Vereinbarung, Exklusivität, eine Vergütungspflicht, ein Versprechen zur Angebotsabgabe oder eine Vertretungsmacht für eine andere Organisation.",
});

export type TeamingBoundaryLocale = keyof typeof TEAMING_BOUNDARY_COPY_BY_LOCALE;

export type ProposedTeamCapacity =
  | "capability-contributor"
  | "delivery-support"
  | "subject-matter-support";

export type TeamInvitationStatus = "pending" | "accepted" | "declined" | "revoked" | "expired";

export type TeamInvitationTarget =
  | Readonly<{
      kind: "organization";
      organizationId: OrganizationId;
      displayNameSnapshot: string;
    }>
  | Readonly<{
      kind: "external";
      recipientEmail: string;
      recipientDisplayName: string;
    }>;

export interface RfxGapResolutionContext {
  readonly schemaVersion: 1;
  readonly organizationId: OrganizationId;
  readonly leadOrganizationDisplayName: string;
  readonly opportunityReference: string;
  readonly opportunityTitle: string;
  readonly issuerOrganizationId: OrganizationId;
  readonly issuerDisplayName: string;
  readonly responseDeadline: string;
  readonly pursuitId: string;
  readonly pursuitVersion: number;
  readonly fitSnapshotId: string;
  readonly explanationInputDigest: string;
  readonly gapReference: string;
  readonly gapKind: OpportunityGapKind;
  readonly gapTitle: string;
  readonly observationReference: string;
  readonly requirementReference: string;
  readonly capabilityLabel: string;
  readonly teamCoverageAllowed: true;
  readonly geographyIds: readonly string[];
  readonly returnHref: string;
}

export interface TeamInvitation {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly leadOrganizationId: OrganizationId;
  readonly leadOrganizationDisplayNameSnapshot: string;
  readonly opportunityReference: string;
  readonly opportunityTitleSnapshot: string;
  readonly issuerOrganizationId: OrganizationId;
  readonly issuerDisplayNameSnapshot: string;
  readonly responseDeadlineSnapshot: string;
  readonly pursuitId: string;
  readonly pursuitVersion: number;
  readonly fitSnapshotId: string;
  readonly explanationInputDigest: string;
  readonly gapReference: string;
  readonly gapKind: OpportunityGapKind;
  readonly gapTitleSnapshot: string;
  readonly observationReference: string;
  readonly requirementReference: string;
  readonly capabilityLabelSnapshot: string;
  readonly geographyIdsSnapshot: readonly string[];
  readonly target: TeamInvitationTarget;
  readonly proposedCapacity: ProposedTeamCapacity;
  readonly responsibilitySummary: string;
  readonly status: TeamInvitationStatus;
  readonly boundaryVersion: typeof TEAMING_BOUNDARY_VERSION;
  readonly acquisitionContextId: string | null;
  readonly communicationRequest: TransactionalEmailRequest | null;
  readonly communicationStatus: "not-required" | "queued" | "delivered" | "failed";
  readonly communicationFailureCode: string | null;
  readonly attachedOrganizationId: OrganizationId | null;
  readonly version: number;
  readonly createdByUserId: UserId;
  readonly createdByMembershipId: OrganizationMembershipId;
  readonly decidedByUserId: UserId | null;
  readonly decidedByMembershipId: OrganizationMembershipId | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly decidedAt: string | null;
  readonly boundaryAcknowledgedLocale: TeamingBoundaryLocale | null;
}

export interface TeamParticipation {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly invitationId: string;
  readonly opportunityReference: string;
  readonly leadOrganizationId: OrganizationId;
  readonly participantOrganizationId: OrganizationId;
  readonly proposedCapacity: ProposedTeamCapacity;
  readonly capabilityLabelSnapshot: string;
  readonly boundaryVersion: typeof TEAMING_BOUNDARY_VERSION;
  readonly boundaryCopyDigest: string;
  readonly boundaryLocale: TeamingBoundaryLocale;
  readonly acceptedByUserId: UserId;
  readonly acceptedByMembershipId: OrganizationMembershipId;
  readonly acceptedAt: string;
}

export type TeamInvitationAction = "invitation.create" | "invitation.accept" | "invitation.decline" | "invitation.revoke";

export interface TeamInvitationCommandReceipt {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly action: TeamInvitationAction;
  readonly requestFingerprint: string;
  readonly invitationId: string;
  readonly resultingVersion: number;
  readonly resultingInvitation: TeamInvitation;
  readonly recordedAt: string;
}

export interface TeamInvitationEvent {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly invitationId: string;
  readonly leadOrganizationId: OrganizationId;
  readonly actorOrganizationId: OrganizationId;
  readonly actorUserId: UserId;
  readonly actorMembershipId: OrganizationMembershipId;
  readonly kind: "invitation-created" | "invitation-accepted" | "invitation-declined" | "invitation-revoked";
  readonly invitationVersion: number;
  readonly commandId: string;
  readonly occurredAt: string;
}

export interface TeamInvitationCreateBundle {
  readonly invitation: TeamInvitation;
  readonly command: TeamInvitationCommandReceipt;
  readonly event: TeamInvitationEvent;
  readonly audit: OrganizationActionAuditEvent;
  readonly acquisition: PreparedAcquisitionContext | null;
}

export interface TeamInvitationDecisionBundle {
  readonly invitation: TeamInvitation;
  readonly expectedVersion: number;
  readonly command: TeamInvitationCommandReceipt;
  readonly event: TeamInvitationEvent;
  readonly audit: OrganizationActionAuditEvent;
  readonly participation: TeamParticipation | null;
}

export class OpportunityTeamingRepositoryError extends Error {
  readonly code: "conflict" | "dependency-unavailable";

  constructor(code: OpportunityTeamingRepositoryError["code"], message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "OpportunityTeamingRepositoryError";
    this.code = code;
  }
}

export interface OpportunityTeamingRepository {
  getInvitation(id: string): Promise<TeamInvitation | null>;
  listByLeadOrganization(organizationId: OrganizationId, opportunityReference: string): Promise<readonly TeamInvitation[]>;
  listByTargetOrganization(organizationId: OrganizationId): Promise<readonly TeamInvitation[]>;
  getCommand(id: string): Promise<TeamInvitationCommandReceipt | null>;
  createInvitation(bundle: TeamInvitationCreateBundle): Promise<"created" | "replayed">;
  decideInvitation(bundle: TeamInvitationDecisionBundle): Promise<"created" | "replayed">;
  recordCommunicationResult(input: Readonly<{
    invitationId: string;
    expectedVersion: number;
    status: "delivered" | "failed";
    failureCode?: string | null;
    updatedAt: string;
  }>): Promise<TeamInvitation>;
}

function stable(value: string, label: string, maximum = 191): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(normalized)) {
    throw new Error(`${label} is invalid.`);
  }
  return normalized;
}

function boundedText(value: string, label: string, maximum: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > maximum) throw new Error(`${label} is required and cannot exceed ${maximum} characters.`);
  return normalized;
}

export function normalizedInvitationEmail(value: string): string {
  const normalized = value.trim().toLocaleLowerCase("en-US");
  if (normalized.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("Invitation email is invalid.");
  return normalized;
}

export function teamInvitationId(input: Readonly<{
  leadOrganizationId: string;
  opportunityReference: string;
  gapReference: string;
  targetReference: string;
  proposedCapacity: ProposedTeamCapacity;
}>): string {
  return `teaminv_${createHash("sha256").update([
    input.leadOrganizationId,
    input.opportunityReference,
    input.gapReference,
    input.targetReference.trim().toLocaleLowerCase("en-US"),
    input.proposedCapacity,
  ].join(":"), "utf8").digest("hex").slice(0, 40)}`;
}

export function teamParticipationId(invitationId: string): string {
  return `teampart_${createHash("sha256").update(stable(invitationId, "Invitation identity"), "utf8").digest("hex").slice(0, 40)}`;
}

export function teamingBoundaryCopyDigest(locale: TeamingBoundaryLocale = "en-US"): string {
  return createHash("sha256").update(TEAMING_BOUNDARY_COPY_BY_LOCALE[locale], "utf8").digest("hex");
}

export function createTeamInvitation(input: Readonly<{
  id: string;
  context: RfxGapResolutionContext;
  target: TeamInvitationTarget;
  proposedCapacity: ProposedTeamCapacity;
  responsibilitySummary: string;
  acquisitionContextId?: string | null;
  communicationRequest?: TransactionalEmailRequest | null;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): TeamInvitation {
  const capacities = new Set<ProposedTeamCapacity>(["capability-contributor", "delivery-support", "subject-matter-support"]);
  if (!capacities.has(input.proposedCapacity)) throw new Error("Proposed capacity is unsupported.");
  if (input.target.kind === "organization" && input.target.organizationId === input.context.organizationId) throw new Error("The lead organization cannot invite itself.");
  if (input.target.kind === "organization" && input.target.organizationId === input.context.issuerOrganizationId) throw new Error("The issuer cannot be invited as a responder teammate.");
  const target = input.target.kind === "organization"
    ? Object.freeze({
        kind: "organization" as const,
        organizationId: input.target.organizationId,
        displayNameSnapshot: boundedText(input.target.displayNameSnapshot, "Candidate organization", 160),
      })
    : Object.freeze({
        kind: "external" as const,
        recipientEmail: normalizedInvitationEmail(input.target.recipientEmail),
        recipientDisplayName: boundedText(input.target.recipientDisplayName, "Invitation recipient", 160),
      });
  const external = target.kind === "external";
  if (external !== Boolean(input.acquisitionContextId && input.communicationRequest)) throw new Error("External invitation acquisition and communication evidence is incomplete.");
  if (!external && (input.acquisitionContextId || input.communicationRequest)) throw new Error("Organization invitation cannot contain external acquisition evidence.");
  return Object.freeze({
    schemaVersion: 1,
    id: stable(input.id, "Invitation identity"),
    leadOrganizationId: input.context.organizationId,
    leadOrganizationDisplayNameSnapshot: boundedText(input.context.leadOrganizationDisplayName, "Lead organization name", 160),
    opportunityReference: input.context.opportunityReference,
    opportunityTitleSnapshot: boundedText(input.context.opportunityTitle, "Opportunity title", 240),
    issuerOrganizationId: input.context.issuerOrganizationId,
    issuerDisplayNameSnapshot: boundedText(input.context.issuerDisplayName, "Issuer name", 160),
    responseDeadlineSnapshot: input.context.responseDeadline,
    pursuitId: input.context.pursuitId,
    pursuitVersion: input.context.pursuitVersion,
    fitSnapshotId: input.context.fitSnapshotId,
    explanationInputDigest: input.context.explanationInputDigest,
    gapReference: input.context.gapReference,
    gapKind: input.context.gapKind,
    gapTitleSnapshot: boundedText(input.context.gapTitle, "Gap title", 240),
    observationReference: input.context.observationReference,
    requirementReference: input.context.requirementReference,
    capabilityLabelSnapshot: boundedText(input.context.capabilityLabel, "Capability label", 240),
    geographyIdsSnapshot: Object.freeze(input.context.geographyIds.map((value) => stable(value, "Teaming geography identity"))),
    target,
    proposedCapacity: input.proposedCapacity,
    responsibilitySummary: boundedText(input.responsibilitySummary, "Proposed responsibility", 800),
    status: "pending",
    boundaryVersion: TEAMING_BOUNDARY_VERSION,
    acquisitionContextId: input.acquisitionContextId ?? null,
    communicationRequest: input.communicationRequest ?? null,
    communicationStatus: external ? "queued" : "not-required",
    communicationFailureCode: null,
    attachedOrganizationId: target.kind === "organization" ? target.organizationId : null,
    version: 1,
    createdByUserId: input.actorUserId,
    createdByMembershipId: input.actorMembershipId,
    decidedByUserId: null,
    decidedByMembershipId: null,
    createdAt: new Date(input.now).toISOString(),
    updatedAt: new Date(input.now).toISOString(),
    decidedAt: null,
    boundaryAcknowledgedLocale: null,
  });
}

export function decideTeamInvitation(input: Readonly<{
  current: TeamInvitation;
  expectedVersion: number;
  action: "accept" | "decline" | "revoke";
  actorOrganizationId: OrganizationId;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  attachedOrganizationId?: OrganizationId | null;
  boundaryVersion?: number | null;
  boundaryLocale?: string | null;
  now: string;
}>): TeamInvitation {
  if (input.current.version !== input.expectedVersion || input.current.status !== "pending") throw new Error("Invitation changed before this decision.");
  const status = input.action === "accept" ? "accepted" : input.action === "decline" ? "declined" : "revoked";
  const boundaryLocale = input.boundaryLocale && input.boundaryLocale in TEAMING_BOUNDARY_COPY_BY_LOCALE
    ? input.boundaryLocale as TeamingBoundaryLocale
    : null;
  if (input.action === "revoke") {
    if (input.actorOrganizationId !== input.current.leadOrganizationId) throw new Error("Only the lead organization can revoke this invitation.");
  } else {
    const targetOrganizationId = input.current.target.kind === "organization"
      ? input.current.target.organizationId
      : input.attachedOrganizationId ?? null;
    if (!targetOrganizationId || input.actorOrganizationId !== targetOrganizationId) throw new Error("Invitation decision authority is unavailable.");
    if (input.action === "accept" && (input.boundaryVersion !== TEAMING_BOUNDARY_VERSION || !boundaryLocale)) throw new Error("The current localized nonbinding boundary must be acknowledged before accepting.");
  }
  const now = new Date(input.now).toISOString();
  return Object.freeze({
    ...input.current,
    status,
    attachedOrganizationId: input.current.attachedOrganizationId ?? input.attachedOrganizationId ?? null,
    version: input.current.version + 1,
    decidedByUserId: input.actorUserId,
    decidedByMembershipId: input.actorMembershipId,
    updatedAt: now,
    decidedAt: now,
    boundaryAcknowledgedLocale: input.action === "accept" ? boundaryLocale : null,
  });
}

export function createTeamParticipation(input: Readonly<{
  invitation: TeamInvitation;
  actorOrganizationId: OrganizationId;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
}>): TeamParticipation {
  if (input.invitation.status !== "accepted" || input.invitation.attachedOrganizationId !== input.actorOrganizationId || !input.invitation.decidedAt || !input.invitation.boundaryAcknowledgedLocale) throw new Error("Accepted invitation evidence is required for participation.");
  return Object.freeze({
    schemaVersion: 1,
    id: teamParticipationId(input.invitation.id),
    invitationId: input.invitation.id,
    opportunityReference: input.invitation.opportunityReference,
    leadOrganizationId: input.invitation.leadOrganizationId,
    participantOrganizationId: input.actorOrganizationId,
    proposedCapacity: input.invitation.proposedCapacity,
    capabilityLabelSnapshot: input.invitation.capabilityLabelSnapshot,
    boundaryVersion: TEAMING_BOUNDARY_VERSION,
    boundaryCopyDigest: teamingBoundaryCopyDigest(input.invitation.boundaryAcknowledgedLocale),
    boundaryLocale: input.invitation.boundaryAcknowledgedLocale,
    acceptedByUserId: input.actorUserId,
    acceptedByMembershipId: input.actorMembershipId,
    acceptedAt: input.invitation.decidedAt,
  });
}
