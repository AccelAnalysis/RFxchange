import {
  ServerSessionError,
  type AuthenticatedServerContext,
} from "../../application/auth/server-session.ts";
import type { AccessRestrictionState } from "../../domain/lifecycle/model.ts";
import type { OrganizationMembership } from "../../domain/users/model.ts";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "./firebase-server-session.ts";
import { createServerAuthenticationBoundary } from "./firebase-session-runtime.ts";
import {
  loadParticipantWorkspaceProjection,
  type ParticipantWorkspaceProjection,
  type ParticipantWorkspaceState,
} from "./participant-workspace-state.ts";
import { createServerFirestoreFoundationRepositories, getServerFirestore } from "../firestore/runtime.ts";
import { measureServerOperation } from "../observability/server-timing.ts";

export { RFXCHANGE_SESSION_COOKIE_NAME };

export type ParticipantRouteResolution =
  | Readonly<{ readonly kind: "unauthenticated" }>
  | Readonly<{
      readonly kind: "activation-required";
      readonly context: AuthenticatedServerContext;
      readonly state: ParticipantWorkspaceState | null;
    }>
  | Readonly<{
      readonly kind: "wrong-organization";
      readonly context: AuthenticatedServerContext;
      readonly state: ParticipantWorkspaceState;
    }>
  | Readonly<{
      readonly kind: "restricted";
      readonly context: AuthenticatedServerContext;
      readonly state: ParticipantWorkspaceState;
      readonly membership: OrganizationMembership;
      readonly restrictionState: Exclude<AccessRestrictionState, "none">;
    }>
  | Readonly<{
      readonly kind: "authorized";
      readonly context: AuthenticatedServerContext;
      readonly state: ParticipantWorkspaceState;
      readonly membership: OrganizationMembership;
    }>;

export type ParticipantRouteDependencyStage =
  | "authentication"
  | "workspace-state"
  | "restriction-state";

/**
 * Protected-route dependencies can fail after a participant has already created durable state.
 * Such failures must surface through a retryable error boundary rather than being converted into
 * sign-up, organization activation, or restriction state.
 */
export class ParticipantRouteDependencyUnavailableError extends Error {
  readonly code = "participant-dependency-unavailable" as const;
  readonly stage: ParticipantRouteDependencyStage;

  constructor(stage: ParticipantRouteDependencyStage) {
    super("The participant workspace is temporarily unavailable.");
    this.name = "ParticipantRouteDependencyUnavailableError";
    this.stage = stage;
  }
}

export interface ParticipantRouteRuntimeDependencies {
  authenticateSessionCookie(input: Readonly<{
    sessionCookie: string;
    now: string;
  }>): Promise<AuthenticatedServerContext>;
  loadWorkspaceProjection(
    context: AuthenticatedServerContext,
  ): Promise<ParticipantWorkspaceProjection | null>;
  loadRestrictions(membership: OrganizationMembership): Promise<Readonly<{
    organizationState: AccessRestrictionState | null;
    membershipState: AccessRestrictionState | null;
  }>>;
}

function activeRestrictionState(
  organizationState: AccessRestrictionState | null,
  membershipState: AccessRestrictionState | null,
): Exclude<AccessRestrictionState, "none"> | null {
  if (membershipState && membershipState !== "none") return membershipState;
  if (organizationState && organizationState !== "none") return organizationState;
  return null;
}

function isExpectedSessionRejection(error: unknown): boolean {
  if (!(error instanceof ServerSessionError)) return false;
  return (
    error.code === "credential-required" ||
    error.code === "credential-invalid" ||
    error.code === "credential-revoked" ||
    error.code === "account-disabled"
  );
}

function dependencyUnavailable(stage: ParticipantRouteDependencyStage): never {
  throw new ParticipantRouteDependencyUnavailableError(stage);
}

function createParticipantRouteRuntimeDependencies(): ParticipantRouteRuntimeDependencies {
  return Object.freeze({
    authenticateSessionCookie: (input) =>
      createServerAuthenticationBoundary().authenticateSessionCookie(input),
    loadWorkspaceProjection: (context) => loadParticipantWorkspaceProjection(context),
    async loadRestrictions(membership) {
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
 * Dependency-injected resolver used by the production wrapper and architecture tests. Keeping the
 * classification policy here makes it impossible for a Firestore/Firebase failure to masquerade
 * as an absent activation context.
 */
export async function resolveParticipantRouteWithDependencies(
  input: Readonly<{
    sessionCookie?: string | null;
    requestedOrganizationId?: string | null;
  }>,
  dependencies: ParticipantRouteRuntimeDependencies,
): Promise<ParticipantRouteResolution> {
  const sessionCookie = input.sessionCookie?.trim();
  if (!sessionCookie) return Object.freeze({ kind: "unauthenticated" as const });

  let context: AuthenticatedServerContext;
  try {
    context = await measureServerOperation(
      "participant-route.auth",
      () => dependencies.authenticateSessionCookie({
        sessionCookie,
        now: new Date().toISOString(),
      }),
      "verify RFxchange session cookie",
    );
  } catch (error) {
    if (isExpectedSessionRejection(error)) {
      return Object.freeze({ kind: "unauthenticated" as const });
    }
    return dependencyUnavailable("authentication");
  }

  let projection: ParticipantWorkspaceProjection | null;
  try {
    projection = await dependencies.loadWorkspaceProjection(context);
  } catch {
    return dependencyUnavailable("workspace-state");
  }

  // This null has one intentionally narrow meaning: no activation context exists for this user.
  if (!projection) {
    return Object.freeze({
      kind: "activation-required" as const,
      context,
      state: null,
    });
  }

  const { state, membership } = projection;
  const workspaceLifecycleEligible =
    state.lifecycleState === "controlled-platform" || state.lifecycleState === "open-platform";
  if (!workspaceLifecycleEligible) {
    return Object.freeze({
      kind: "activation-required" as const,
      context,
      state,
    });
  }

  // Once the lifecycle says the participant reached a workspace, these identities must exist and
  // agree. Treating their absence as a fresh /join journey would falsely imply lost registration.
  if (!state.organization || !membership || !state.membershipId) {
    return dependencyUnavailable("workspace-state");
  }
  if (
    membership.status !== "active" ||
    membership.userId !== context.user.id ||
    String(membership.organizationId) !== state.organization.id ||
    membership.id !== state.membershipId
  ) {
    return dependencyUnavailable("workspace-state");
  }

  const requestedOrganizationId = input.requestedOrganizationId?.trim();
  if (requestedOrganizationId && requestedOrganizationId !== state.organization.id) {
    return Object.freeze({
      kind: "wrong-organization" as const,
      context,
      state,
    });
  }

  let restrictionState: Exclude<AccessRestrictionState, "none"> | null;
  try {
    const restrictions = await dependencies.loadRestrictions(membership);
    restrictionState = activeRestrictionState(
      restrictions.organizationState,
      restrictions.membershipState,
    );
  } catch {
    return dependencyUnavailable("restriction-state");
  }
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

/**
 * Server-only participant route resolver.
 *
 * A valid Firebase/RFxchange session is necessary but not sufficient for participant workspace
 * access. Controlled/open workspace access additionally requires the persisted lifecycle, active
 * organization membership, organization isolation, and no active organization or membership
 * restriction. The route path uses the lightweight workspace projection instead of rebuilding the
 * full activation UI graph on every navigation.
 *
 * Missing/invalid credentials return `unauthenticated`. A genuinely absent activation context
 * returns `activation-required`. Dependency or inconsistent persisted-state failures throw
 * ParticipantRouteDependencyUnavailableError so Next.js can render the retryable recovery boundary.
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
