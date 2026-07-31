import type { Firestore } from "firebase-admin/firestore";

import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import type { ActivationJourneyState } from "../../application/onboarding/activation-journey.ts";
import { updateActivationJourneyContext } from "../../domain/onboarding/model.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import { organizationMembershipId } from "../../domain/users/model.ts";
import { FirestoreActivationJourneyContextRepository } from "../firestore/activation-journey.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

/**
 * Activation context is resumable UX state, never authority. When canonical membership authority
 * is established asynchronously (for example after an existing-organization claim is approved),
 * copy the already-authoritative organization/membership references back into the resume context.
 */
export async function synchronizeActivationContextFromAuthority(
  context: AuthenticatedServerContext,
  state: ActivationJourneyState,
  db: Firestore = getServerFirestore(),
): Promise<void> {
  if (!state.organization?.id || !state.membershipId) return;

  const repository = new FirestoreActivationJourneyContextRepository(db);
  const current = await repository.getByUserId(context.user.id);
  if (!current) return;

  const resolvedOrganizationId = organizationId(state.organization.id);
  const resolvedMembershipId = organizationMembershipId(state.membershipId);
  if (
    current.organizationId === resolvedOrganizationId &&
    current.membershipId === resolvedMembershipId
  ) {
    return;
  }

  await repository.save(
    updateActivationJourneyContext(current, {
      organizationId: resolvedOrganizationId,
      membershipId: resolvedMembershipId,
      now: new Date().toISOString(),
    }),
  );
}
