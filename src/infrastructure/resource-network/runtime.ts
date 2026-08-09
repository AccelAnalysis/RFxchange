import type { Firestore } from "firebase-admin/firestore";

import { serializeAcquisitionContextToken } from "../../application/acquisition/acquisition-context.ts";
import { TransactionalEmailProviderError, TransactionalEmailService } from "../../application/communications/transactional-email.ts";
import { ResourceNetworkService } from "../../application/resource-network/resource-network.ts";
import { resourceNetworkTransactionalEmailCatalog } from "../../application/resource-network/resource-network-templates.ts";
import type { ProviderAcquisitionInvitation } from "../../domain/resource-network/model.ts";
import { createServerAcquisitionContextService } from "../acquisition/runtime.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { MicrosoftGraphTransactionalEmailProvider, microsoftGraphTransactionalEmailConfigurationFromEnvironment } from "../communications/microsoft-graph-transactional-email.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { createFirestoreEssentialOrganizationProfileRepositories } from "../firestore/organization-profile.ts";
import { FirestoreReferralRepository } from "../firestore/referrals.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { FirestoreResourceNetworkRepository } from "../firestore/resource-network.ts";
import { FirestoreResourceProviderRepository } from "../firestore/resource-providers.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

function publicOrigin(): string {
  const value = process.env.RFXCHANGE_PUBLIC_ORIGIN?.trim() || "http://localhost:3000";
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("RFXCHANGE_PUBLIC_ORIGIN must be an origin without a path.");
  return url.origin;
}

export function createServerResourceNetworkService(db: Firestore = getServerFirestore()) {
  const foundation = createFirestoreFoundationRepositories(db);
  const profiles = createFirestoreEssentialOrganizationProfileRepositories(db);
  const locations = createFirestoreOrganizationLocationRepositories(db);
  const geographies = createFirestoreGeographyRepositories(db);
  const acquisition = createServerAcquisitionContextService();
  return new ResourceNetworkService({
    authorization: {
      accountSecurity: createServerFirebaseAccountSecurityService(),
      organizations: foundation.organizations.accounts,
      memberships: foundation.users.memberships,
      authorizations: foundation.organizationAuthorization,
      restrictions: foundation.lifecycle.restrictions,
    },
    providers: new FirestoreResourceProviderRepository(db),
    network: new FirestoreResourceNetworkRepository(db),
    profiles: foundation.organizations.profiles,
    completions: profiles.completions,
    serviceGeographies: locations.serviceGeographies,
    restrictions: foundation.lifecycle.restrictions,
    geographies: geographies.definitions,
    referrals: new FirestoreReferralRepository(db),
    acquisition: {
      async issueProvider(input) {
        const token = await acquisition.issueTrusted({ kind: "provider", subjectReference: input.invitationId, channel: "provider-link", sourceReference: input.providerOrganizationId });
        return Object.freeze({ contextId: token.contextId, serializedToken: serializeAcquisitionContextToken(token) });
      },
      async issuePublicOpportunity(input) {
        const issued = await acquisition.issuePublicOpportunity({ reference: input.reference });
        return Object.freeze({ contextId: issued.token.contextId, serializedToken: serializeAcquisitionContextToken(issued.token) });
      },
    },
    publicOrigin: publicOrigin(),
  });
}

export function createServerProviderEligibilityReader(db: Firestore = getServerFirestore()) {
  const service = createServerResourceNetworkService(db);
  return Object.freeze({ inspect: service.inspectProviderEligibility.bind(service) });
}

function microsoftConfigured(): boolean {
  return [process.env.RFXCHANGE_ENV, process.env.RFXCHANGE_MICROSOFT_TENANT_ID, process.env.RFXCHANGE_MICROSOFT_CLIENT_ID, process.env.RFXCHANGE_MICROSOFT_CLIENT_SECRET, process.env.RFXCHANGE_MICROSOFT_APPROVED_SENDER].every((value) => Boolean(value?.trim()));
}

export async function attemptProviderInvitation(invitation: ProviderAcquisitionInvitation, db: Firestore = getServerFirestore()): Promise<ProviderAcquisitionInvitation> {
  const repository = new FirestoreResourceNetworkRepository(db);
  const current = await repository.getInvitation(invitation.id);
  if (!current) throw new Error("Provider invitation is unavailable.");
  if (current.deliveryStatus === "accepted" || !microsoftConfigured()) return current;
  try {
    const service = new TransactionalEmailService(new MicrosoftGraphTransactionalEmailProvider(microsoftGraphTransactionalEmailConfigurationFromEnvironment(), resourceNetworkTransactionalEmailCatalog));
    const request = current.communication;
    const receipt = await service.request({
      id: String(request.id), purpose: request.purpose, recipientEmail: String(request.recipient.email), recipientDisplayName: request.recipient.displayName,
      eventKey: String(request.eventKey), eventVersion: request.eventVersion, templateKey: String(request.templateKey), templateVersion: request.templateVersion,
      variables: request.variables, correlationId: String(request.metadata.correlationId), idempotencyKey: String(request.metadata.idempotencyKey), requestedAt: request.metadata.requestedAt,
      organizationId: request.metadata.organizationId, userId: request.metadata.userId, relatedObjectType: request.metadata.relatedObjectType, relatedObjectId: request.metadata.relatedObjectId, tags: request.metadata.tags,
    });
    return repository.recordInvitationDelivery({ invitation: current, receipt });
  } catch (error) {
    const providerError = error instanceof TransactionalEmailProviderError ? error : null;
    return repository.recordInvitationDelivery({ invitation: current, errorCode: providerError?.code ?? "transactional-email-provider-unhandled", retryable: providerError?.retryable ?? true });
  }
}
