import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";

import type { AcquisitionContextEnvelope } from "../../domain/acquisition/model.ts";
import type { OrganizationCapabilityClaim } from "../../domain/market-profile/model.ts";
import type { OrganizationMarkerActivation } from "../../domain/organization-markers/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import { calculateOpportunityFit, type OpportunityFitSnapshot, type OpportunityPursuit } from "../../domain/rfx/pursuit.ts";
import { governedResponderOpportunityProjection, type ResponderOpportunityProjection, type RfxPublicationSnapshot } from "../../domain/rfx/publication.ts";
import {
  OpportunityTeamingRepositoryError,
  type OpportunityTeamingRepository,
  type TeamInvitation,
  type TeamInvitationCommandReceipt,
} from "../../domain/rfx/teaming.ts";
import { FIRESTORE_SCHEMA_VERSION } from "../firestore/schema.ts";

const INVITATIONS = "rfxTeamInvitations";
const PARTICIPATIONS = "rfxTeamParticipations";
const COMMANDS = "rfxTeamInvitationCommands";
const EVENTS = "rfxTeamInvitationEvents";
const PURSUITS = "opportunityPursuits";
const FITS = "opportunityFitSnapshots";
const PROJECTIONS = "rfxOpportunityProjections";
const PUBLICATION_SNAPSHOTS = "rfxPublicationSnapshots";
const CLAIMS = "organizationCapabilityClaims";
const MARKERS = "organizationMarkerActivations";
const SERVICE_GEOGRAPHIES = "organizationServiceGeographies";
const MEMBERSHIPS = "organizationMemberships";
const AUTHORIZATIONS = "organizationAuthorizations";
const RESTRICTIONS = "accessRestrictions";
const USERS = "users";
const GEOGRAPHIES = "geographies";
const AUDITS = "organizationAuditEvents";
const ACQUISITION_CONTEXTS = "acquisitionContexts";
const ACQUISITION_EVENTS = "acquisitionContextEvents";

function immutable(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: FieldValue.serverTimestamp() });
}

function mutable(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: FieldValue.serverTimestamp(), persistenceUpdatedAt: FieldValue.serverTimestamp() });
}

function acquisitionRecord(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION });
}

function sameCommand(left: TeamInvitationCommandReceipt, right: TeamInvitationCommandReceipt): boolean {
  return left.organizationId === right.organizationId &&
    left.action === right.action &&
    left.requestFingerprint === right.requestFingerprint &&
    left.invitationId === right.invitationId &&
    left.resultingVersion === right.resultingVersion;
}

function failure(error: unknown, message: string): OpportunityTeamingRepositoryError {
  if (error instanceof OpportunityTeamingRepositoryError) return error;
  const code = typeof error === "object" && error !== null && "code" in error ? (error as { readonly code?: unknown }).code : null;
  return new OpportunityTeamingRepositoryError(code === 10 || code === "aborted" ? "conflict" : "dependency-unavailable", message, { cause: error });
}

async function activeRestrictions(transaction: Transaction, db: Firestore, organizationIds: readonly string[], membershipId?: string | null): Promise<boolean> {
  const snapshots = await Promise.all([
    ...organizationIds.map((organizationId) => transaction.get(db.collection(RESTRICTIONS).where("target.kind", "==", "organization").where("target.organizationId", "==", organizationId))),
    ...(membershipId ? [transaction.get(db.collection(RESTRICTIONS).where("target.kind", "==", "membership").where("target.membershipId", "==", membershipId))] : []),
  ]);
  return snapshots.some((snapshot) => snapshot.docs.some((item) => item.get("state") !== "none"));
}

async function validateGapAuthority(transaction: Transaction, db: Firestore, invitation: TeamInvitation): Promise<void> {
  const pursuitRef = db.collection(PURSUITS).doc(invitation.pursuitId);
  const fitRef = db.collection(FITS).doc(invitation.fitSnapshotId);
  const projectionRef = db.collection(PROJECTIONS).doc(invitation.opportunityReference);
  const publicationQuery = db.collection(PUBLICATION_SNAPSHOTS).where("reference", "==", invitation.opportunityReference).limit(2);
  const claimsQuery = db.collection(CLAIMS).where("organizationId", "==", invitation.leadOrganizationId);
  const serviceGeographyRef = db.collection(SERVICE_GEOGRAPHIES).doc(String(invitation.leadOrganizationId));
  const [pursuitSnapshot, fitSnapshot, projectionSnapshot, publicationSnapshots, claimsSnapshot, serviceGeographySnapshot] = await Promise.all([
    transaction.get(pursuitRef),
    transaction.get(fitRef),
    transaction.get(projectionRef),
    transaction.get(publicationQuery),
    transaction.get(claimsQuery),
    transaction.get(serviceGeographyRef),
  ]);
  const pursuit = pursuitSnapshot.data() as OpportunityPursuit | undefined;
  const fit = fitSnapshot.data() as OpportunityFitSnapshot | undefined;
  const persistedProjection = projectionSnapshot.data() as ResponderOpportunityProjection | undefined;
  if (!pursuit || !fit || !persistedProjection || publicationSnapshots.size !== 1) throw new OpportunityTeamingRepositoryError("conflict", "Current RFx gap authority is unavailable.");
  let projection: ResponderOpportunityProjection;
  try {
    projection = governedResponderOpportunityProjection(persistedProjection, publicationSnapshots.docs[0].data() as RfxPublicationSnapshot);
  } catch {
    throw new OpportunityTeamingRepositoryError("conflict", "Current RFx publication evidence changed.");
  }
  const claims = claimsSnapshot.docs.map((item) => item.data() as OrganizationCapabilityClaim);
  const serviceGeographyIds = (serviceGeographySnapshot.data()?.serviceGeographyIds as readonly string[] | undefined) ?? [];
  const explanation = calculateOpportunityFit({ organizationId: invitation.leadOrganizationId, projection, claims, serviceGeographyIds, calculatedAt: invitation.updatedAt });
  const gap = explanation.gaps.find((item) => item.reference === invitation.gapReference);
  const assessedGap = pursuit.gapAssessments.find((item) => item.reference === invitation.gapReference);
  const observation = explanation.requirementObservations.find((item) => item.reference === gap?.observationReference);
  if (
    pursuit.organizationId !== invitation.leadOrganizationId ||
    pursuit.opportunityReference !== invitation.opportunityReference ||
    pursuit.decision !== "pursue" ||
    pursuit.version !== invitation.pursuitVersion ||
    pursuit.reviewedFitSnapshotId !== invitation.fitSnapshotId ||
    pursuit.reviewedProjectionVersion !== projection.aggregateVersion ||
    pursuit.reviewedProjectionDigest !== projection.digest ||
    pursuit.reviewedCapabilityInputDigest !== explanation.organizationCapabilityInputDigest ||
    fit.organizationId !== invitation.leadOrganizationId ||
    fit.opportunityReference !== invitation.opportunityReference ||
    fit.explanation.inputDigest !== invitation.explanationInputDigest ||
    explanation.inputDigest !== invitation.explanationInputDigest ||
    !gap ||
    !assessedGap ||
    (assessedGap.status !== "open" && assessedGap.status !== "acknowledged") ||
    gap.kind !== invitation.gapKind ||
    gap.observationReference !== invitation.observationReference ||
    !observation?.teamCoverageAllowed ||
    observation.capabilityLabel !== invitation.capabilityLabelSnapshot ||
    projection.issuerOrganizationIndexKey !== String(invitation.issuerOrganizationId) ||
    projection.mode !== "published" ||
    !projection.publishedAt ||
    !projection.payload.timing.responseDeadline ||
    Date.parse(`${projection.payload.timing.responseDeadline}T23:59:59.999Z`) <= Date.now()
  ) throw new OpportunityTeamingRepositoryError("conflict", "The opportunity, pursuit or gap changed before this command.");
  const geographySnapshots = await Promise.all(projection.payload.localities.map((item) => transaction.get(db.collection(GEOGRAPHIES).doc(item.id))));
  if (!geographySnapshots.length || geographySnapshots.some((item) => !item.exists || item.get("releaseState") !== "released")) throw new OpportunityTeamingRepositoryError("conflict", "Opportunity geography authority changed.");
}

async function validateActor(transaction: Transaction, db: Firestore, invitation: TeamInvitation, actor: Readonly<{ organizationId: OrganizationId; userId: string; membershipId: string }>): Promise<void> {
  const [membershipSnapshot, authorizationSnapshot, userSnapshot] = await Promise.all([
    transaction.get(db.collection(MEMBERSHIPS).doc(actor.membershipId)),
    transaction.get(db.collection(AUTHORIZATIONS).doc(actor.membershipId)),
    transaction.get(db.collection(USERS).doc(actor.userId)),
  ]);
  const membership = membershipSnapshot.data() as { userId?: string; organizationId?: string; status?: string } | undefined;
  const authorization = authorizationSnapshot.data() as { userId?: string; organizationId?: string; permissions?: readonly string[] } | undefined;
  if (
    !membership || membership.userId !== actor.userId || membership.organizationId !== actor.organizationId || membership.status !== "active" ||
    !authorization || authorization.userId !== actor.userId || authorization.organizationId !== actor.organizationId || !authorization.permissions?.includes("response.create") ||
    !userSnapshot.exists ||
    await activeRestrictions(transaction, db, [String(actor.organizationId), String(invitation.leadOrganizationId)], actor.membershipId)
  ) throw new OpportunityTeamingRepositoryError("conflict", "Current organization invitation authority changed.");
  if (invitation.target.kind === "external" && actor.organizationId !== invitation.leadOrganizationId) {
    const acquisitionSnapshot = invitation.acquisitionContextId
      ? await transaction.get(db.collection(ACQUISITION_CONTEXTS).doc(invitation.acquisitionContextId))
      : null;
    const acquisition = acquisitionSnapshot?.data() as AcquisitionContextEnvelope | undefined;
    const email = String(userSnapshot.get("primaryEmail") ?? "").trim().toLocaleLowerCase("en-US");
    if (
      !acquisition ||
      (acquisition.status !== "bound" && acquisition.status !== "resumed") ||
      acquisition.boundUserId !== actor.userId ||
      acquisition.intent.kind !== "team-invitation" ||
      acquisition.intent.subjectReference !== invitation.id ||
      email !== invitation.target.recipientEmail
    ) throw new OpportunityTeamingRepositoryError("conflict", "External invitation binding or recipient authority changed.");
  }
}

async function validateOrganizationCandidate(transaction: Transaction, db: Firestore, invitation: TeamInvitation): Promise<void> {
  if (invitation.target.kind !== "organization") return;
  const targetOrganizationId = invitation.target.organizationId;
  const [markerSnapshot, claimsSnapshot] = await Promise.all([
    transaction.get(db.collection(MARKERS).doc(String(targetOrganizationId))),
    transaction.get(db.collection(CLAIMS).where("organizationId", "==", targetOrganizationId)),
  ]);
  const marker = markerSnapshot.data() as OrganizationMarkerActivation | undefined;
  const claims = claimsSnapshot.docs.map((item) => item.data() as OrganizationCapabilityClaim);
  const capabilityCurrent = claims.some((claim) =>
    claim.organizationId === targetOrganizationId &&
    claim.assertionStatus !== "suspended" &&
    claim.visibility !== "private" &&
    claim.labelSnapshot.toLocaleLowerCase("en-US") === invitation.capabilityLabelSnapshot.toLocaleLowerCase("en-US")
  );
  if (
    !marker || marker.organizationId !== targetOrganizationId || marker.status !== "active" ||
    !invitation.geographyIdsSnapshot.includes(String(marker.geographyId)) ||
    !capabilityCurrent
  ) throw new OpportunityTeamingRepositoryError("conflict", "The selected organization is no longer a current permitted capability candidate.");
}

export class FirestoreOpportunityTeamingRepository implements OpportunityTeamingRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getInvitation(id: string) {
    const snapshot = await this.db.collection(INVITATIONS).doc(id).get();
    return snapshot.exists ? snapshot.data() as TeamInvitation : null;
  }

  async listByLeadOrganization(organizationId: OrganizationId, opportunityReference: string) {
    const snapshot = await this.db.collection(INVITATIONS).where("leadOrganizationId", "==", organizationId).where("opportunityReference", "==", opportunityReference).get();
    return Object.freeze(snapshot.docs.map((item) => item.data() as TeamInvitation));
  }

  async listByTargetOrganization(organizationId: OrganizationId) {
    const snapshot = await this.db.collection(INVITATIONS).where("attachedOrganizationId", "==", organizationId).get();
    return Object.freeze(snapshot.docs.map((item) => item.data() as TeamInvitation));
  }

  async getCommand(id: string) {
    const snapshot = await this.db.collection(COMMANDS).doc(id).get();
    return snapshot.exists ? snapshot.data() as TeamInvitationCommandReceipt : null;
  }

  createInvitation(bundle: Parameters<OpportunityTeamingRepository["createInvitation"]>[0]): Promise<"created" | "replayed"> {
    if (
      bundle.command.action !== "invitation.create" ||
      bundle.command.resultingInvitation.id !== bundle.invitation.id ||
      JSON.stringify(bundle.command.resultingInvitation) !== JSON.stringify(bundle.invitation) ||
      bundle.event.kind !== "invitation-created" ||
      bundle.event.invitationId !== bundle.invitation.id ||
      bundle.audit.organizationId !== bundle.invitation.leadOrganizationId ||
      (bundle.invitation.target.kind === "external") !== Boolean(bundle.acquisition)
    ) throw new OpportunityTeamingRepositoryError("conflict", "Invitation persistence evidence is inconsistent.");
    const invitationRef = this.db.collection(INVITATIONS).doc(bundle.invitation.id);
    const commandRef = this.db.collection(COMMANDS).doc(bundle.command.id);
    const eventRef = this.db.collection(EVENTS).doc(bundle.event.id);
    const auditRef = this.db.collection(AUDITS).doc(bundle.audit.id);
    const acquisitionContextRef = bundle.acquisition ? this.db.collection(ACQUISITION_CONTEXTS).doc(bundle.acquisition.context.id) : null;
    const acquisitionEventRef = bundle.acquisition ? this.db.collection(ACQUISITION_EVENTS).doc(bundle.acquisition.event.id) : null;
    return this.db.runTransaction(async (transaction) => {
      const snapshots = await transaction.getAll(invitationRef, commandRef, eventRef, auditRef, ...(acquisitionContextRef ? [acquisitionContextRef] : []), ...(acquisitionEventRef ? [acquisitionEventRef] : []));
      if (snapshots[1]?.exists) {
        const prior = snapshots[1].data() as TeamInvitationCommandReceipt;
        if (sameCommand(prior, bundle.command)) return "replayed" as const;
        throw new OpportunityTeamingRepositoryError("conflict", "Invitation command identity collision.");
      }
      if (snapshots.some((item, index) => index !== 1 && item.exists)) throw new OpportunityTeamingRepositoryError("conflict", "Invitation or evidence identity already exists.");
      await validateGapAuthority(transaction, this.db, bundle.invitation);
      await validateActor(transaction, this.db, bundle.invitation, { organizationId: bundle.invitation.leadOrganizationId, userId: String(bundle.invitation.createdByUserId), membershipId: String(bundle.invitation.createdByMembershipId) });
      if (bundle.invitation.target.kind === "organization") {
        await validateOrganizationCandidate(transaction, this.db, bundle.invitation);
        if (await activeRestrictions(transaction, this.db, [String(bundle.invitation.target.organizationId)])) throw new OpportunityTeamingRepositoryError("conflict", "The selected organization is not currently available for invitation.");
      } else if (
        !bundle.acquisition ||
        bundle.invitation.acquisitionContextId !== bundle.acquisition.context.id ||
        bundle.acquisition.context.intent.kind !== "team-invitation" ||
        bundle.acquisition.context.intent.subjectReference !== bundle.invitation.id ||
        bundle.acquisition.context.source.channel !== "team-invitation-link" ||
        bundle.acquisition.event.acquisitionContextId !== bundle.acquisition.context.id ||
        bundle.acquisition.event.kind !== "issued"
      ) throw new OpportunityTeamingRepositoryError("conflict", "External invitation acquisition evidence is inconsistent.");
      transaction.create(invitationRef, mutable(bundle.invitation));
      transaction.create(commandRef, immutable(bundle.command));
      transaction.create(eventRef, immutable(bundle.event));
      transaction.create(auditRef, immutable(bundle.audit));
      if (acquisitionContextRef && acquisitionEventRef && bundle.acquisition) {
        transaction.create(acquisitionContextRef, acquisitionRecord(bundle.acquisition.context));
        transaction.create(acquisitionEventRef, acquisitionRecord(bundle.acquisition.event));
      }
      return "created" as const;
    }).catch((error: unknown) => { throw failure(error, "Invitation persistence is temporarily unavailable."); });
  }

  decideInvitation(bundle: Parameters<OpportunityTeamingRepository["decideInvitation"]>[0]): Promise<"created" | "replayed"> {
    const invitationRef = this.db.collection(INVITATIONS).doc(bundle.invitation.id);
    const commandRef = this.db.collection(COMMANDS).doc(bundle.command.id);
    const eventRef = this.db.collection(EVENTS).doc(bundle.event.id);
    const auditRef = this.db.collection(AUDITS).doc(bundle.audit.id);
    const participationRef = bundle.participation ? this.db.collection(PARTICIPATIONS).doc(bundle.participation.id) : null;
    return this.db.runTransaction(async (transaction) => {
      const [invitationSnapshot, commandSnapshot, eventSnapshot, auditSnapshot, ...participationSnapshots] = await transaction.getAll(invitationRef, commandRef, eventRef, auditRef, ...(participationRef ? [participationRef] : []));
      if (commandSnapshot.exists) {
        const prior = commandSnapshot.data() as TeamInvitationCommandReceipt;
        if (sameCommand(prior, bundle.command)) return "replayed" as const;
        throw new OpportunityTeamingRepositoryError("conflict", "Invitation decision command identity collision.");
      }
      if (eventSnapshot.exists || auditSnapshot.exists || participationSnapshots.some((item) => item.exists)) throw new OpportunityTeamingRepositoryError("conflict", "Invitation decision evidence identity collision.");
      const current = invitationSnapshot.data() as TeamInvitation | undefined;
      if (!current || current.status !== "pending" || current.version !== bundle.expectedVersion || bundle.invitation.version !== bundle.expectedVersion + 1) throw new OpportunityTeamingRepositoryError("conflict", "Invitation changed before this decision.");
      if (bundle.command.resultingInvitation.id !== bundle.invitation.id || JSON.stringify(bundle.command.resultingInvitation) !== JSON.stringify(bundle.invitation)) throw new OpportunityTeamingRepositoryError("conflict", "Invitation decision result is inconsistent.");
      await validateGapAuthority(transaction, this.db, current);
      const actorOrganizationId = bundle.event.actorOrganizationId;
      await validateActor(transaction, this.db, current, { organizationId: actorOrganizationId, userId: String(bundle.event.actorUserId), membershipId: String(bundle.event.actorMembershipId) });
      if (bundle.command.action === "invitation.revoke") {
        if (actorOrganizationId !== current.leadOrganizationId || bundle.participation) throw new OpportunityTeamingRepositoryError("conflict", "Invitation revoke authority is inconsistent.");
      } else {
        const targetOrganizationId = current.target.kind === "organization" ? current.target.organizationId : bundle.invitation.attachedOrganizationId;
        if (!targetOrganizationId || actorOrganizationId !== targetOrganizationId) throw new OpportunityTeamingRepositoryError("conflict", "Invitation target authority is inconsistent.");
        if (bundle.command.action === "invitation.accept") {
          if (!bundle.participation || bundle.invitation.status !== "accepted" || bundle.participation.invitationId !== bundle.invitation.id || bundle.participation.participantOrganizationId !== actorOrganizationId) throw new OpportunityTeamingRepositoryError("conflict", "Accepted participation evidence is inconsistent.");
        } else if (bundle.participation || bundle.invitation.status !== "declined") throw new OpportunityTeamingRepositoryError("conflict", "Declined invitation evidence is inconsistent.");
      }
      transaction.set(invitationRef, mutable(bundle.invitation));
      transaction.create(commandRef, immutable(bundle.command));
      transaction.create(eventRef, immutable(bundle.event));
      transaction.create(auditRef, immutable(bundle.audit));
      if (participationRef && bundle.participation) transaction.create(participationRef, immutable(bundle.participation));
      return "created" as const;
    }).catch((error: unknown) => { throw failure(error, "Invitation decision persistence is temporarily unavailable."); });
  }

  recordCommunicationResult(input: Parameters<OpportunityTeamingRepository["recordCommunicationResult"]>[0]): Promise<TeamInvitation> {
    const invitationRef = this.db.collection(INVITATIONS).doc(input.invitationId);
    return this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(invitationRef);
      const current = snapshot.data() as TeamInvitation | undefined;
      if (!current || current.target.kind !== "external" || !current.communicationRequest) throw new OpportunityTeamingRepositoryError("conflict", "External invitation communication is unavailable.");
      if (current.communicationStatus === "delivered") return current;
      if (current.version !== input.expectedVersion) throw new OpportunityTeamingRepositoryError("conflict", "Invitation changed before communication evidence was recorded.");
      const updated = Object.freeze({ ...current, communicationStatus: input.status, communicationFailureCode: input.failureCode ?? null, updatedAt: input.updatedAt });
      transaction.set(invitationRef, mutable(updated));
      return updated;
    }).catch((error: unknown) => { throw failure(error, "Invitation communication evidence is temporarily unavailable."); });
  }
}
