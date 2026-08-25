import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";

import { authorizeOrganizationOperation } from "../../application/auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import {
  createRfxResponseSectionAssignment,
  reviseRfxResponseSectionAssignment,
  revokeRfxResponseSectionAssignment,
  RfxResponseCollaborationError,
  type RfxResponseSectionAssignment,
} from "../../domain/rfx/collaboration.ts";
import { updateRfxResponse, rfxResponseId, type RfxResponse } from "../../domain/rfx/cycle.ts";
import type { RfxPublicationSnapshot } from "../../domain/rfx/publication.ts";
import type { TeamParticipation } from "../../domain/rfx/teaming.ts";
import type { OrganizationMembershipId, UserId } from "../../domain/users/model.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

const RESPONSES = "rfxResponses";
const ASSIGNMENTS = "rfxResponseAssignments";
const PARTICIPATIONS = "rfxTeamParticipations";
const PUBLICATIONS = "rfxPublicationSnapshots";

export interface RfxCollaborationActor {
  readonly context: AuthenticatedServerContext;
  readonly organizationId: OrganizationId;
  readonly membershipId: OrganizationMembershipId;
  readonly userId: UserId;
}

export type RfxResponseCollaborationWorkspace =
  | Readonly<{
      role: "lead";
      response: RfxResponse;
      team: readonly TeamParticipation[];
      assignments: readonly RfxResponseSectionAssignment[];
      canManage: true;
      deadlineOpen: boolean;
    }>
  | Readonly<{
      role: "contributor";
      response: RfxResponse;
      participation: TeamParticipation;
      assignments: readonly RfxResponseSectionAssignment[];
      canEdit: boolean;
      deadlineOpen: boolean;
    }>;

function record<T>(snapshot: DocumentSnapshot): T | null {
  return snapshot.exists ? snapshot.data() as T : null;
}

function stable(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new RfxResponseCollaborationError("invalid", `${label} is invalid.`);
  }
  return normalized;
}

function openDeadline(snapshot: RfxPublicationSnapshot): boolean {
  const deadline = snapshot.aggregate.package?.timing.responseDeadline;
  return Boolean(deadline && Date.parse(`${deadline}T23:59:59.999Z`) > Date.now());
}

function authDependencies(db: Firestore) {
  const foundation = createFirestoreFoundationRepositories(db);
  return Object.freeze({
    accountSecurity: createServerFirebaseAccountSecurityService(),
    organizations: foundation.organizations.accounts,
    memberships: foundation.users.memberships,
    authorizations: foundation.organizationAuthorization,
    restrictions: foundation.lifecycle.restrictions,
  });
}

export class ServerRfxResponseCollaborationService {
  private readonly db: Firestore;
  private readonly authorization: ReturnType<typeof authDependencies>;

  constructor(db: Firestore = getServerFirestore()) {
    this.db = db;
    this.authorization = authDependencies(db);
  }

  private async authorize(actor: RfxCollaborationActor) {
    const decision = await authorizeOrganizationOperation({
      context: actor.context,
      organizationId: actor.organizationId,
      membershipId: actor.membershipId,
      permission: "response.create",
    }, this.authorization);
    if (!decision.allowed || decision.context.user.id !== actor.userId) {
      throw new RfxResponseCollaborationError("forbidden", "Response collaboration is unavailable for this organization membership.");
    }
  }

  private async publication(referenceValue: string): Promise<RfxPublicationSnapshot> {
    const reference = stable(referenceValue, "Opportunity reference");
    const query = await this.db.collection(PUBLICATIONS).where("reference", "==", reference).limit(2).get();
    if (query.size !== 1) {
      throw new RfxResponseCollaborationError(query.empty ? "not-found" : "conflict", "Published RFx evidence is unavailable.");
    }
    const snapshot = query.docs[0].data() as RfxPublicationSnapshot;
    if (snapshot.reference !== reference || snapshot.aggregate.lifecycleState !== "published") {
      throw new RfxResponseCollaborationError("conflict", "Published RFx evidence is inconsistent.");
    }
    return snapshot;
  }

  private async response(reference: string, leadOrganizationId: OrganizationId): Promise<RfxResponse> {
    const response = record<RfxResponse>(await this.db.collection(RESPONSES).doc(rfxResponseId(String(leadOrganizationId), reference)).get());
    if (!response || response.opportunityReference !== reference || response.responderOrganizationId !== leadOrganizationId) {
      throw new RfxResponseCollaborationError("not-found", "The lead organization has not started a response workspace yet.");
    }
    return response;
  }

  private async teamForLead(leadOrganizationId: OrganizationId, reference: string): Promise<readonly TeamParticipation[]> {
    const query = await this.db.collection(PARTICIPATIONS).where("leadOrganizationId", "==", leadOrganizationId).get();
    return Object.freeze(query.docs
      .map((item) => item.data() as TeamParticipation)
      .filter((item) => item.opportunityReference === reference));
  }

  private async participationForContributor(
    participantOrganizationId: OrganizationId,
    leadOrganizationId: OrganizationId,
    reference: string,
  ): Promise<TeamParticipation> {
    const query = await this.db.collection(PARTICIPATIONS).where("participantOrganizationId", "==", participantOrganizationId).get();
    const matches = query.docs
      .map((item) => item.data() as TeamParticipation)
      .filter((item) => item.opportunityReference === reference && item.leadOrganizationId === leadOrganizationId);
    if (matches.length !== 1) {
      throw new RfxResponseCollaborationError(matches.length ? "conflict" : "forbidden", "An accepted team participation for this response is required.");
    }
    return matches[0];
  }

  private async assignments(responseId: string): Promise<readonly RfxResponseSectionAssignment[]> {
    const query = await this.db.collection(ASSIGNMENTS).where("responseId", "==", stable(responseId, "Response identity")).get();
    return Object.freeze(query.docs.map((item) => item.data() as RfxResponseSectionAssignment));
  }

  async workspace(actor: RfxCollaborationActor, input: Readonly<{
    reference: string;
    leadOrganizationId?: string | null;
  }>): Promise<RfxResponseCollaborationWorkspace> {
    await this.authorize(actor);
    const snapshot = await this.publication(input.reference);
    const deadlineOpen = openDeadline(snapshot);
    const requestedLead = input.leadOrganizationId ? organizationId(stable(input.leadOrganizationId, "Lead organization identity")) : actor.organizationId;

    if (requestedLead === actor.organizationId) {
      const response = await this.response(snapshot.reference, actor.organizationId);
      const [team, assignments] = await Promise.all([
        this.teamForLead(actor.organizationId, snapshot.reference),
        this.assignments(rfxResponseId(String(actor.organizationId), snapshot.reference)),
      ]);
      return Object.freeze({ role: "lead" as const, response, team, assignments, canManage: true as const, deadlineOpen });
    }

    const participation = await this.participationForContributor(actor.organizationId, requestedLead, snapshot.reference);
    const response = await this.response(snapshot.reference, requestedLead);
    const assignments = (await this.assignments(response.id)).filter(
      (item) => item.status === "active" && item.participantOrganizationId === actor.organizationId,
    );
    if (!assignments.length) {
      throw new RfxResponseCollaborationError("forbidden", "The lead organization has not assigned response work to your organization yet.");
    }
    const assignedSections = new Set(assignments.map((item) => item.sectionId));
    const projected: RfxResponse = Object.freeze({
      ...response,
      items: Object.freeze(response.items.filter((item) => assignedSections.has(item.sectionId))),
    });
    return Object.freeze({
      role: "contributor" as const,
      response: projected,
      participation,
      assignments: Object.freeze(assignments),
      canEdit: deadlineOpen && response.status === "draft",
      deadlineOpen,
    });
  }

  async assign(actor: RfxCollaborationActor, input: Readonly<{
    reference: string;
    participationId: string;
    sectionId: string;
    responsibilitySummary: string;
  }>): Promise<RfxResponseSectionAssignment> {
    await this.authorize(actor);
    const snapshot = await this.publication(input.reference);
    if (!openDeadline(snapshot)) throw new RfxResponseCollaborationError("conflict", "The response deadline has passed.");
    const response = await this.response(snapshot.reference, actor.organizationId);
    if (response.status !== "draft") throw new RfxResponseCollaborationError("conflict", "Submitted responses cannot receive new collaboration assignments.");
    const participation = record<TeamParticipation>(await this.db.collection(PARTICIPATIONS).doc(stable(input.participationId, "Team participation identity")).get());
    if (!participation || participation.leadOrganizationId !== actor.organizationId || participation.opportunityReference !== snapshot.reference) {
      throw new RfxResponseCollaborationError("forbidden", "Only an accepted teammate on this RFx can receive response work.");
    }
    const candidate = createRfxResponseSectionAssignment({
      response,
      participation,
      sectionId: input.sectionId,
      responsibilitySummary: input.responsibilitySummary,
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      now: new Date().toISOString(),
    });
    const ref = this.db.collection(ASSIGNMENTS).doc(candidate.id);
    const existing = record<RfxResponseSectionAssignment>(await ref.get());
    const next = existing && existing.status === "active"
      ? reviseRfxResponseSectionAssignment({
          current: existing,
          expectedVersion: existing.version,
          responsibilitySummary: input.responsibilitySummary,
          actorUserId: actor.userId,
          actorMembershipId: actor.membershipId,
          now: new Date().toISOString(),
        })
      : candidate;
    await ref.set(next);
    return next;
  }

  async revoke(actor: RfxCollaborationActor, input: Readonly<{
    assignmentId: string;
    expectedVersion: number;
  }>): Promise<RfxResponseSectionAssignment> {
    await this.authorize(actor);
    const ref = this.db.collection(ASSIGNMENTS).doc(stable(input.assignmentId, "Response assignment identity"));
    const current = record<RfxResponseSectionAssignment>(await ref.get());
    if (!current) throw new RfxResponseCollaborationError("not-found", "Response assignment was not found.");
    if (current.leadOrganizationId !== actor.organizationId) {
      throw new RfxResponseCollaborationError("forbidden", "Only the lead organization can revoke response work.");
    }
    const next = revokeRfxResponseSectionAssignment({
      current,
      expectedVersion: input.expectedVersion,
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      now: new Date().toISOString(),
    });
    await this.db.runTransaction(async (transaction) => {
      const latest = record<RfxResponseSectionAssignment>(await transaction.get(ref));
      if (!latest || latest.version !== current.version || latest.status !== "active") {
        throw new RfxResponseCollaborationError("conflict", "Response assignment changed before it was revoked.");
      }
      transaction.set(ref, next);
    });
    return next;
  }

  async saveContributorItem(actor: RfxCollaborationActor, input: Readonly<{
    reference: string;
    leadOrganizationId: string;
    expectedVersion: number;
    item: Parameters<typeof updateRfxResponse>[0]["item"];
  }>): Promise<RfxResponse> {
    await this.authorize(actor);
    const snapshot = await this.publication(input.reference);
    if (!openDeadline(snapshot)) throw new RfxResponseCollaborationError("conflict", "The response deadline has passed.");
    const leadOrganizationId = organizationId(stable(input.leadOrganizationId, "Lead organization identity"));
    await this.participationForContributor(actor.organizationId, leadOrganizationId, snapshot.reference);
    const responseRef = this.db.collection(RESPONSES).doc(rfxResponseId(String(leadOrganizationId), snapshot.reference));
    const current = record<RfxResponse>(await responseRef.get());
    if (!current || current.status !== "draft") throw new RfxResponseCollaborationError("not-found", "Editable lead response was not found.");
    const sectionId = stable(input.item.sectionId, "Response section identity");
    const assignments = await this.assignments(current.id);
    const assignment = assignments.find((item) =>
      item.status === "active" &&
      item.participantOrganizationId === actor.organizationId &&
      item.sectionId === sectionId
    );
    if (!assignment) throw new RfxResponseCollaborationError("forbidden", "This response section has not been assigned to your organization.");
    const next = updateRfxResponse({
      current,
      expectedVersion: input.expectedVersion,
      item: input.item,
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      now: new Date().toISOString(),
    });
    await this.db.runTransaction(async (transaction) => {
      const latest = record<RfxResponse>(await transaction.get(responseRef));
      if (!latest || latest.version !== current.version || latest.status !== "draft") {
        throw new RfxResponseCollaborationError("conflict", "The shared response changed before this contribution was saved.");
      }
      transaction.set(responseRef, next);
    });
    return Object.freeze({
      ...next,
      items: Object.freeze(next.items.filter((item) => assignments.some((candidate) =>
        candidate.status === "active" &&
        candidate.participantOrganizationId === actor.organizationId &&
        candidate.sectionId === item.sectionId
      ))),
    });
  }

  async assertContributorSection(actor: RfxCollaborationActor, input: Readonly<{
    reference: string;
    leadOrganizationId: string;
    sectionId: string;
  }>): Promise<Readonly<{
    response: RfxResponse;
    assignment: RfxResponseSectionAssignment;
    leadOrganizationId: OrganizationId;
  }>> {
    const workspace = await this.workspace(actor, {
      reference: input.reference,
      leadOrganizationId: input.leadOrganizationId,
    });
    if (workspace.role !== "contributor" || !workspace.canEdit) {
      throw new RfxResponseCollaborationError("forbidden", "Contributor attachment access is unavailable.");
    }
    const sectionId = stable(input.sectionId, "Response section identity");
    const assignment = workspace.assignments.find((item) => item.sectionId === sectionId);
    if (!assignment || !workspace.response.items.some((item) => item.sectionId === sectionId)) {
      throw new RfxResponseCollaborationError("forbidden", "This response section is not assigned to your organization.");
    }
    return Object.freeze({
      response: workspace.response,
      assignment,
      leadOrganizationId: assignment.leadOrganizationId,
    });
  }
}

export function createServerRfxResponseCollaborationService(db: Firestore = getServerFirestore()) {
  return new ServerRfxResponseCollaborationService(db);
}
