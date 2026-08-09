import type { Firestore } from "firebase-admin/firestore";

import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import type { ActivationJourneyState } from "../../application/onboarding/activation-journey.ts";
import { updateActivationJourneyContext } from "../../domain/onboarding/model.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import { organizationMembershipId } from "../../domain/users/model.ts";
import { FirestoreActivationJourneyContextRepository } from "../firestore/activation-journey.ts";
import { createServerFirestoreFoundationRepositories, getServerFirestore } from "../firestore/runtime.ts";
import { measureServerOperation } from "../observability/server-timing.ts";

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

/**
 * Narrow pre-action synchronization. It repairs a resumable activation context from an already
 * authoritative active membership without hydrating the full activation state graph first.
 */
export async function synchronizeActivationContextFromActiveMembership(
  context: AuthenticatedServerContext,
  db: Firestore = getServerFirestore(),
): Promise<void> {
  const repository = new FirestoreActivationJourneyContextRepository(db);
  const current = await measureServerOperation(
    "activation-sync.firestore-context",
    () => repository.getByUserId(context.user.id),
  );
  if (!current || (current.organizationId && current.membershipId)) return;

  const foundation = createServerFirestoreFoundationRepositories(db);
  const memberships = await measureServerOperation(
    "activation-sync.firestore-membership",
    () => foundation.users.memberships.listActiveByUserId(context.user.id),
  );
  const membership = current.membershipId
    ? memberships.find((candidate) => candidate.id === current.membershipId) ?? null
    : current.organizationId
      ? memberships.find((candidate) => candidate.organizationId === current.organizationId) ?? null
      : null;
  if (!membership) return;
  if (current.organizationId && membership.organizationId !== current.organizationId) return;

  await repository.save(
    updateActivationJourneyContext(current, {
      organizationId: current.organizationId ?? membership.organizationId,
      membershipId: membership.id,
      now: new Date().toISOString(),
    }),
  );
}
