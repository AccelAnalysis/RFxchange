import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import type { ActivationJourneyState } from "../../application/onboarding/activation-journey.ts";
import type { AccessRestrictionState } from "../../domain/lifecycle/model.ts";
import type { OrganizationMembership } from "../../domain/users/model.ts";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "./firebase-server-session.ts";
import { createServerAuthenticationBoundary } from "./firebase-session-runtime.ts";
import { createServerFirestoreFoundationRepositories, getServerFirestore } from "../firestore/runtime.ts";
import { createServerActivationJourneyService } from "../onboarding/runtime.ts";

export { RFXCHANGE_SESSION_COOKIE_NAME };

export type ParticipantRouteResolution =
  | Readonly<{ readonly kind: "unauthenticated" }>
  | Readonly<{
      readonly kind: "activation-required";
      readonly context: AuthenticatedServerContext;
      readonly state: ActivationJourneyState | null;
    }>
  | Readonly<{
      readonly kind: "wrong-organization";
      readonly context: AuthenticatedServerContext;
      readonly state: ActivationJourneyState;
    }>
  | Readonly<{
      readonly kind: "restricted";
      readonly context: AuthenticatedServerContext;
      readonly state: ActivationJourneyState;
      readonly membership: OrganizationMembership;
      readonly restrictionState: Exclude<AccessRestrictionState, "none">;
    }>
  | Readonly<{
      readonly kind: "authorized";
      readonly context: AuthenticatedServerContext;
      readonly state: ActivationJourneyState;
      readonly membership: OrganizationMembership;
    }>;

function activeRestrictionState(
  organizationState: AccessRestrictionState | null,
  membershipState: AccessRestrictionState | null,
): Exclude<AccessRestrictionState, "none"> | null {
  if (membershipState && membershipState !== "none") return membershipState;
  if (organizationState && organizationState !== "none") return organizationState;
  return null;
}

/**
 * Server-only participant route resolver.
 *
 * A valid Firebase/RFxchange session is necessary but not sufficient for participant workspace
 * access. Controlled/open workspace access additionally requires the persisted lifecycle, the
 * active organization membership selected by that journey, organization isolation, and no active
 * organization or membership restriction. UI step labels never grant or revoke workspace access.
 */
export async function resolveParticipantRoute(input: Readonly<{
  sessionCookie?: string | null;
  requestedOrganizationId?: string | null;
}>): Promise<ParticipantRouteResolution> {
  const sessionCookie = input.sessionCookie?.trim();
  if (!sessionCookie) return Object.freeze({ kind: "unauthenticated" as const });

  let context: AuthenticatedServerContext;
  try {
    context = await createServerAuthenticationBoundary().authenticateSessionCookie({
      sessionCookie,
      now: new Date().toISOString(),
    });
  } catch {
    return Object.freeze({ kind: "unauthenticated" as const });
  }

  let state: ActivationJourneyState;
  try {
    state = await createServerActivationJourneyService().state(context);
  } catch {
    return Object.freeze({
      kind: "activation-required" as const,
      context,
      state: null,
    });
  }

  const workspaceLifecycleEligible =
    state.lifecycleState === "controlled-platform" || state.lifecycleState === "open-platform";
  if (!workspaceLifecycleEligible || !state.organization || !state.membershipId) {
    return Object.freeze({
      kind: "activation-required" as const,
      context,
      state,
    });
  }

  const requestedOrganizationId = input.requestedOrganizationId?.trim();
  if (requestedOrganizationId && requestedOrganizationId !== state.organization.id) {
    return Object.freeze({
      kind: "wrong-organization" as const,
      context,
      state,
    });
  }

  const foundation = createServerFirestoreFoundationRepositories(getServerFirestore());
  const membership = await foundation.users.memberships.getById(state.membershipId as OrganizationMembership["id"]);
  if (
    !membership ||
    membership.status !== "active" ||
    membership.userId !== context.user.id ||
    String(membership.organizationId) !== state.organization.id
  ) {
    return Object.freeze({
      kind: "activation-required" as const,
      context,
      state,
    });
  }

  const [organizationRestriction, membershipRestriction] = await Promise.all([
    foundation.lifecycle.restrictions.getForOrganization(membership.organizationId),
    foundation.lifecycle.restrictions.getForMembership(membership.id),
  ]);
  const restrictionState = activeRestrictionState(
    organizationRestriction?.state ?? null,
    membershipRestriction?.state ?? null,
  );
  if (restrictionState) {
    return Object.freeze({
      kind: "restricted" as const,
      context,
      state,
      membership,
      restrictionState,
    });
  }

  return Object.freeze({
    kind: "authorized" as const,
    context,
    state,
    membership,
  });
}
