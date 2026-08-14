import { RFXCHANGE_SESSION_COOKIE_NAME } from "./firebase-server-session.ts";
import { createServerAuthenticationBoundary } from "./firebase-session-runtime.ts";
import {
  ParticipantRouteDependencyUnavailableError,
  resolveParticipantRouteWithDependencies,
  type ParticipantRouteResolution,
  type ParticipantRouteRuntimeDependencies,
} from "./participant-route-classification.ts";
import { loadParticipantWorkspaceProjection } from "./participant-workspace-state.ts";
import { createServerFirestoreFoundationRepositories, getServerFirestore } from "../firestore/runtime.ts";
import { measureServerOperation } from "../observability/server-timing.ts";

export { RFXCHANGE_SESSION_COOKIE_NAME };
export {
  ParticipantRouteDependencyUnavailableError,
  resolveParticipantRouteWithDependencies,
} from "./participant-route-classification.ts";
export type {
  ParticipantRouteDependencyStage,
  ParticipantRouteResolution,
  ParticipantRouteRuntimeDependencies,
} from "./participant-route-classification.ts";

function createParticipantRouteRuntimeDependencies(): ParticipantRouteRuntimeDependencies {
  return Object.freeze({
    authenticateSessionCookie: (
      input: Parameters<ParticipantRouteRuntimeDependencies["authenticateSessionCookie"]>[0],
    ) =>
      measureServerOperation(
        "participant-route.auth",
        () => createServerAuthenticationBoundary().authenticateSessionCookie(input),
        "verify RFxchange session cookie",
      ),
    loadWorkspaceProjection: (
      context: Parameters<ParticipantRouteRuntimeDependencies["loadWorkspaceProjection"]>[0],
    ) => loadParticipantWorkspaceProjection(context),
    async loadRestrictions(
      membership: Parameters<ParticipantRouteRuntimeDependencies["loadRestrictions"]>[0],
    ) {
      const foundation = createServerFirestoreFoundationRepositories(getServerFirestore());
      const [organizationRestriction, membershipRestriction] = await measureServerOperation(
        "participant-route.firestore-restrictions",
        () => Promise.all([
          foundation.lifecycle.restrictions.getForOrganization(membership.organizationId),
          foundation.lifecycle.restrictions.getForMembership(membership.id),
        ]),
        "organization + membership restrictions",
      );
      return Object.freeze({
        organizationState: organizationRestriction?.state ?? null,
        membershipState: membershipRestriction?.state ?? null,
      });
    },
  });
}

/**
 * `activation-required` is normally pre-workspace, but an incomplete activation
 * may already have a persisted organization/membership binding. The semantic
 * classifier intentionally returns before ordinary workspace restriction reads
 * in that lifecycle. Any server surface that can perform a consequential
 * activation write therefore needs this narrow overlay so a bound restricted
 * participant cannot use an activation endpoint to bypass ARC-008.
 */
async function revalidateBoundActivationRestriction(
  resolution: ParticipantRouteResolution,
  dependencies: ParticipantRouteRuntimeDependencies,
): Promise<ParticipantRouteResolution> {
  if (resolution.kind !== "activation-required") return resolution;
  const activationState = resolution.state;
  if (!activationState || !activationState.membershipId) return resolution;
  const membershipId = activationState.membershipId;

  const foundation = createServerFirestoreFoundationRepositories(getServerFirestore());
  let membership;
  try {
    membership = await measureServerOperation(
      "participant-route.activation-binding",
      () => foundation.users.memberships.getById(membershipId),
      "revalidate incomplete activation membership binding",
    );
  } catch (error) {
    throw new ParticipantRouteDependencyUnavailableError("workspace-state", error);
  }
  if (
    !membership ||
    membership.status !== "active" ||
    membership.userId !== resolution.context.user.id ||
    !activationState.organization ||
    String(membership.organizationId) !== activationState.organization.id
  ) {
    throw new ParticipantRouteDependencyUnavailableError(
      "workspace-state",
      new Error("Incomplete activation membership binding is unavailable or inconsistent."),
    );
  }

  let restrictions;
  try {
    restrictions = await dependencies.loadRestrictions(membership);
  } catch (error) {
    throw new ParticipantRouteDependencyUnavailableError("restriction-state", error);
  }
  const restrictionState =
    restrictions.membershipState && restrictions.membershipState !== "none"
      ? restrictions.membershipState
      : restrictions.organizationState && restrictions.organizationState !== "none"
        ? restrictions.organizationState
        : null;
  if (!restrictionState) return resolution;

  return Object.freeze({
    kind: "restricted" as const,
    context: resolution.context,
    state: activationState,
    membership,
    restrictionState,
  });
}

/**
 * Server-only participant route resolver.
 *
 * Production provider wiring stays in this module while the semantic classification policy lives
 * in participant-route-classification.ts. Missing/invalid credentials return `unauthenticated`; a
 * genuinely absent activation context returns `activation-required`; dependency or inconsistent
 * persisted-state failures throw ParticipantRouteDependencyUnavailableError so Next.js renders the
 * retryable recovery boundary rather than redirecting a returning participant to `/join`.
 */
export async function resolveParticipantRoute(input: Readonly<{
  sessionCookie?: string | null;
  requestedOrganizationId?: string | null;
}>): Promise<ParticipantRouteResolution> {
  const dependencies = createParticipantRouteRuntimeDependencies();
  const resolution = await resolveParticipantRouteWithDependencies(
    input,
    dependencies,
  );
  return revalidateBoundActivationRestriction(resolution, dependencies);
}
