import {
  ServerSessionError,
  type AuthenticatedServerContext,
} from "../../application/auth/server-session.ts";
import type { AccessRestrictionState } from "../../domain/lifecycle/model.ts";
import {
  resolveUserOrganizationAccess,
  type OrganizationMembership,
} from "../../domain/users/model.ts";
import type {
  ParticipantWorkspaceProjection,
  ParticipantWorkspaceState,
} from "./participant-workspace-state.ts";

export type ParticipantActivationResolutionReason =
  | "activation-context-required"
  | "activation-incomplete"
  | "account-resolution"
  | "organization-resolution";

export type ParticipantRouteResolution =
  | Readonly<{ readonly kind: "unauthenticated" }>
  | Readonly<{
      readonly kind: "activation-required";
      readonly reason: ParticipantActivationResolutionReason;
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
 * sign-up, organization activation, or restriction state. The cause remains server-only diagnostic
 * evidence; participant UI renders neither this message nor the cause.
 */
export class ParticipantRouteDependencyUnavailableError extends Error {
  readonly code = "participant-dependency-unavailable" as const;
  readonly stage: ParticipantRouteDependencyStage;

  constructor(stage: ParticipantRouteDependencyStage, cause?: unknown) {
    super("The participant workspace is temporarily unavailable.", { cause });
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

function dependencyUnavailable(
  stage: ParticipantRouteDependencyStage,
  cause: unknown,
): never {
  throw new ParticipantRouteDependencyUnavailableError(stage, cause);
}

function stateForMembership(
  state: ParticipantWorkspaceState,
  membership: OrganizationMembership,
): ParticipantWorkspaceState {
  return Object.freeze({
    ...state,
    organization: Object.freeze({ id: String(membership.organizationId) }),
    membershipId: String(membership.id),
    controlledPlatformUrl: state.lifecycleState === "open-platform"
      ? "/exchange"
      : state.acquisitionContext && state.acquisitionContext.kind !== "direct"
        ? "/acquisition/continue"
        : "/orientation",
  });
}

function governedMembershipRepair(input: Readonly<{
  context: AuthenticatedServerContext;
  state: ParticipantWorkspaceState;
  activeMemberships: readonly OrganizationMembership[];
  requestedOrganizationId?: string | null;
}>): Readonly<{
  state: ParticipantWorkspaceState;
  membership: OrganizationMembership;
}> | Readonly<{
  kind: "activation-required";
  reason: "account-resolution" | "organization-resolution";
  context: AuthenticatedServerContext;
  state: ParticipantWorkspaceState;
}> | Readonly<{
  kind: "wrong-organization";
  context: AuthenticatedServerContext;
  state: ParticipantWorkspaceState;
}> {
  const access = resolveUserOrganizationAccess(input.context.user, input.activeMemberships);
  if (access.kind === "account-resolution") {
    // /join is the current account-resolution surface. This is a governed membership state, not a
    // dependency outage, so Retry must not be presented as the only remediation.
    return Object.freeze({
      kind: "activation-required" as const,
      reason: "account-resolution" as const,
      context: input.context,
      state: input.state,
    });
  }

  const requestedOrganizationId = input.requestedOrganizationId?.trim();
  const selected = requestedOrganizationId
    ? access.activeMemberships.find(
        (candidate) => String(candidate.organizationId) === requestedOrganizationId,
      ) ?? null
    : access.activeMemberships.length === 1
      ? access.activeMemberships[0]
      : null;

  if (!selected) {
    if (requestedOrganizationId) {
      return Object.freeze({
        kind: "wrong-organization" as const,
        context: input.context,
        state: input.state,
      });
    }
    // Multiple active memberships require organization resolution. The current participant entry
    // flow is the governed resolution surface until persistent organization switching is introduced.
    return Object.freeze({
      kind: "activation-required" as const,
      reason: "organization-resolution" as const,
      context: input.context,
      state: input.state,
    });
  }

  return Object.freeze({
    state: stateForMembership(input.state, selected),
    membership: selected,
  });
}

/**
 * Pure protected-route classification policy. Production dependencies are injected by
 * participant-route-runtime.ts; architecture tests use deterministic in-memory dependencies.
 *
 * This separation is deliberate: dependency/provider implementation details cannot influence the
 * semantic distinction between signed out, activation/account resolution, wrong organization,
 * restricted, authorized, and a retryable service failure.
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
    context = await dependencies.authenticateSessionCookie({
      sessionCookie,
      now: new Date().toISOString(),
    });
  } catch (error) {
    if (isExpectedSessionRejection(error)) {
      return Object.freeze({ kind: "unauthenticated" as const });
    }
    return dependencyUnavailable("authentication", error);
  }

  let projection: ParticipantWorkspaceProjection | null;
  try {
    projection = await dependencies.loadWorkspaceProjection(context);
  } catch (error) {
    return dependencyUnavailable("workspace-state", error);
  }

  // This null has one intentionally narrow meaning: no activation context exists for this user.
  if (!projection) {
    return Object.freeze({
      kind: "activation-required" as const,
      reason: "activation-context-required" as const,
      context,
      state: null,
    });
  }

  const { state, activeMemberships } = projection;
  let membership = projection.membership;
  let resolvedState = state;
  const workspaceLifecycleEligible =
    state.lifecycleState === "controlled-platform" || state.lifecycleState === "open-platform";
  if (!workspaceLifecycleEligible) {
    return Object.freeze({
      kind: "activation-required" as const,
      reason: "activation-incomplete" as const,
      context,
      state,
    });
  }

  if (!state.organization || !state.membershipId) {
    return dependencyUnavailable(
      "workspace-state",
      new Error("Controlled/open participant workspace identity is incomplete."),
    );
  }

  if (!membership) {
    // A persisted binding can legitimately stop being active through governed membership repair.
    // Resolve the user's remaining active memberships through ARC-003 instead of calling that state
    // a transient backend outage.
    const repaired = governedMembershipRepair({
      context,
      state,
      activeMemberships,
      requestedOrganizationId: input.requestedOrganizationId,
    });
    if ("kind" in repaired) return repaired;
    membership = repaired.membership;
    resolvedState = repaired.state;
  } else if (
    membership.status !== "active" ||
    membership.userId !== context.user.id ||
    String(membership.organizationId) !== state.organization.id ||
    membership.id !== state.membershipId
  ) {
    return dependencyUnavailable(
      "workspace-state",
      new Error("Controlled/open participant workspace identity is inconsistent."),
    );
  }

  const requestedOrganizationId = input.requestedOrganizationId?.trim();
  if (requestedOrganizationId && requestedOrganizationId !== resolvedState.organization?.id) {
    return Object.freeze({
      kind: "wrong-organization" as const,
      context,
      state: resolvedState,
    });
  }

  let restrictionState: Exclude<AccessRestrictionState, "none"> | null;
  try {
    const restrictions = await dependencies.loadRestrictions(membership);
    restrictionState = activeRestrictionState(
      restrictions.organizationState,
      restrictions.membershipState,
    );
  } catch (error) {
    return dependencyUnavailable("restriction-state", error);
  }
  if (restrictionState) {
    return Object.freeze({
      kind: "restricted" as const,
      context,
      state: resolvedState,
      membership,
      restrictionState,
    });
  }

  return Object.freeze({
    kind: "authorized" as const,
    context,
    state: resolvedState,
    membership,
  });
}
