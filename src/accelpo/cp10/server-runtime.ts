import type { Firestore } from "firebase-admin/firestore";

import {
  resolveEntitlementBilling,
  type EntitlementBillingProjection,
} from "../../application/accelpo/entitlement-billing.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import { FirestoreOrganizationCommercialAccountRepository } from "../../infrastructure/firestore/commercial-account-repository.ts";
import { FirestoreOrganizationUserInvitationRepository } from "../../infrastructure/firestore/organization-user-invitations.ts";
import { createFirestoreFoundationRepositories } from "../../infrastructure/firestore/repositories.ts";
import { getServerFirestore } from "../../infrastructure/firestore/runtime.ts";

export interface ServerEntitlementBillingReader {
  read(organizationId: string): Promise<EntitlementBillingProjection>;
}

export async function readServerEntitlementBilling(input: Readonly<{
  organizationId: string;
  now?: string;
  db?: Firestore;
}>): Promise<EntitlementBillingProjection> {
  const db = input.db ?? getServerFirestore();
  const id = organizationId(input.organizationId);
  const repositories = createFirestoreFoundationRepositories(db);
  const commercialAccounts = new FirestoreOrganizationCommercialAccountRepository(db);
  const invitations = new FirestoreOrganizationUserInvitationRepository(db);
  const [commercial, memberships, organizationInvitations] = await Promise.all([
    commercialAccounts.getByOrganizationId(id),
    repositories.users.memberships.listByOrganizationId(id),
    invitations.listByOrganizationId(id),
  ]);

  return resolveEntitlementBilling({
    organizationId: String(id),
    commercial: commercial
      ? Object.freeze({
          plan: String(commercial.planKey),
          entitlementKeys: Object.freeze(commercial.entitlementKeys.map(String)),
          billingPeriod: commercial.subscription.currentPeriodEndsAt
            ? String(commercial.subscription.currentPeriodEndsAt)
            : null,
          entitlementVersion: String(commercial.updatedAt),
        })
      : null,
    memberships: memberships.map((membership) => Object.freeze({
      userId: String(membership.userId),
      status: membership.status,
    })),
    invitations: organizationInvitations.map((invitation) => Object.freeze({
      id: String(invitation.id),
      status: invitation.status,
      expiresAt: invitation.expiresAt ? String(invitation.expiresAt) : null,
    })),
    now: input.now ?? new Date().toISOString(),
  });
}

export function createServerEntitlementBillingReader(
  db: Firestore = getServerFirestore(),
  now: () => string = () => new Date().toISOString(),
): ServerEntitlementBillingReader {
  return Object.freeze({
    read: (organizationIdValue: string) => readServerEntitlementBilling({
      organizationId: organizationIdValue,
      db,
      now: now(),
    }),
  });
}
