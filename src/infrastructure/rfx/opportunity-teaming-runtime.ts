import type { Firestore } from "firebase-admin/firestore";

import { TransactionalEmailProviderError, TransactionalEmailService } from "../../application/communications/transactional-email.ts";
import { OpportunityTeamingService } from "../../application/rfx/opportunity-teaming-service.ts";
import { opportunityTeamingTransactionalEmailCatalog } from "../../application/rfx/opportunity-teaming-templates.ts";
import type { TeamInvitation } from "../../domain/rfx/teaming.ts";
import { createServerAcquisitionContextService } from "../acquisition/runtime.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { MicrosoftGraphTransactionalEmailProvider, microsoftGraphTransactionalEmailConfigurationFromEnvironment } from "../communications/microsoft-graph-transactional-email.ts";
import { FirestoreOpportunityPursuitRepository } from "../firestore/opportunity-pursuit.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { FirestoreOpportunityTeamingRepository } from "./firestore-opportunity-teaming-repository.ts";

function publicOrigin(): string {
  const value = process.env.RFXCHANGE_PUBLIC_ORIGIN?.trim() || "http://localhost:3000";
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("RFXCHANGE_PUBLIC_ORIGIN must be an origin without a path.");
  return url.origin;
}

export function createServerOpportunityTeamingService(db: Firestore = getServerFirestore()) {
  const foundation = createFirestoreFoundationRepositories(db);
  const acquisition = createServerAcquisitionContextService();
  return new OpportunityTeamingService({
    authorization: {
      accountSecurity: createServerFirebaseAccountSecurityService(),
      organizations: foundation.organizations.accounts,
      memberships: foundation.users.memberships,
      authorizations: foundation.organizationAuthorization,
      restrictions: foundation.lifecycle.restrictions,
    },
    pursuits: new FirestoreOpportunityPursuitRepository(db),
    teaming: new FirestoreOpportunityTeamingRepository(db),
    profiles: foundation.organizations.profiles,
    acquisition: { prepareTrusted: acquisition.prepareTrusted.bind(acquisition) },
    publicOrigin: publicOrigin(),
  });
}

function microsoftConfigured(): boolean {
  return [
    process.env.RFXCHANGE_ENV,
    process.env.RFXCHANGE_MICROSOFT_TENANT_ID,
    process.env.RFXCHANGE_MICROSOFT_CLIENT_ID,
    process.env.RFXCHANGE_MICROSOFT_CLIENT_SECRET,
    process.env.RFXCHANGE_MICROSOFT_APPROVED_SENDER,
  ].every((value) => Boolean(value?.trim()));
}

export async function attemptTeamInvitationDelivery(invitation: TeamInvitation, db: Firestore = getServerFirestore()): Promise<TeamInvitation> {
  if (invitation.target.kind !== "external" || !invitation.communicationRequest || invitation.communicationStatus === "delivered" || !microsoftConfigured()) return invitation;
  const repository = new FirestoreOpportunityTeamingRepository(db);
  const current = await repository.getInvitation(invitation.id);
  if (!current || current.target.kind !== "external" || !current.communicationRequest) throw new Error("Team invitation communication is unavailable.");
  if (current.communicationStatus === "delivered") return current;
  try {
    const request = current.communicationRequest;
    const service = new TransactionalEmailService(new MicrosoftGraphTransactionalEmailProvider(
      microsoftGraphTransactionalEmailConfigurationFromEnvironment(),
      opportunityTeamingTransactionalEmailCatalog,
    ));
    const receipt = await service.request({
      id: String(request.id),
      purpose: request.purpose,
      recipientEmail: String(request.recipient.email),
      recipientDisplayName: request.recipient.displayName,
      eventKey: String(request.eventKey),
      eventVersion: request.eventVersion,
      templateKey: String(request.templateKey),
      templateVersion: request.templateVersion,
      variables: request.variables,
      correlationId: String(request.metadata.correlationId),
      idempotencyKey: String(request.metadata.idempotencyKey),
      requestedAt: request.metadata.requestedAt,
      organizationId: request.metadata.organizationId,
      userId: request.metadata.userId,
      relatedObjectType: request.metadata.relatedObjectType,
      relatedObjectId: request.metadata.relatedObjectId,
      tags: request.metadata.tags,
    });
    return repository.recordCommunicationResult({ invitationId: current.id, expectedVersion: current.version, status: receipt.status === "accepted" ? "delivered" : "failed", failureCode: receipt.diagnosticCode, updatedAt: receipt.recordedAt });
  } catch (error) {
    const providerError = error instanceof TransactionalEmailProviderError ? error : null;
    return repository.recordCommunicationResult({ invitationId: current.id, expectedVersion: current.version, status: "failed", failureCode: providerError?.code ?? "transactional-email-provider-unhandled", updatedAt: new Date().toISOString() });
  }
}
