import { RFXCHANGE_SESSION_COOKIE_NAME } from "./firebase-server-session.ts";
import { createServerAuthenticationBoundary } from "./firebase-session-runtime.ts";
import {
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
  return resolveParticipantRouteWithDependencies(
    input,
    createParticipantRouteRuntimeDependencies(),
  );
}
