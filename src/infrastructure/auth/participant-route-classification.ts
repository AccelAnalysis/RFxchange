import {
  ServerSessionError,
  type AuthenticatedServerContext,
} from "../../application/auth/server-session.ts";
import type { AccessRestrictionState } from "../../domain/lifecycle/model.ts";
import type { OrganizationMembership } from "../../domain/users/model.ts";
import type {
  ParticipantWorkspaceProjection,
  ParticipantWorkspaceState,
} from "./participant-workspace-state.ts";

export type ParticipantActivationResolutionReason =
  | "activation-context-required"
  | "activation-incomplete";

export type ParticipantAccessResolutionReason =
  | "account-resolution"
  | "organization-resolution";

export interface ParticipantAccessResolutionOption {
  readonly organizationId: string;
  readonly membershipId: string;
}

export type ParticipantRouteResolution =
  | Readonly<{ readonly kind: "unauthenticated" }>
  | Readonly<{
      readonly kind: "activation-required";
      readonly reason: ParticipantActivationResolutionReason;
      readonly context: AuthenticatedServerContext;
      readonly state: ParticipantWorkspaceState | null;
    }>
  | Readonly<{
      readonly kind: "access-resolution-required";
      readonly reason: ParticipantAccessResolutionReason;
      readonly context: AuthenticatedServerContext;
      readonly state: ParticipantWorkspaceState;
      readonly options: readonly ParticipantAccessResolutionOption[];
      readonly selectedOrganizationId: string | null;
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

function resolveChangedMembershipAccess(input: Readonly<{
  context: AuthenticatedServerContext;
  state: ParticipantWorkspaceState;
  activeMemberships: readonly OrganizationMembership[];
  requestedOrganizationId?: string | null;
}>): Extract<ParticipantRouteResolution, { readonly kind: "access-resolution-required" }> {
  for (const membership of input.activeMemberships) {
    if (membership.status !== "active" || membership.userId !== input.context.user.id) {
      return dependencyUnavailable(
        "workspace-state",
        new Error("Active membership projection contains inconsistent participant state."),
      );
    }
  }

  const options = Object.freeze(
    input.activeMemberships.map((membership) =>
      Object.freeze({
        organizationId: String(membership.organizationId),
        membershipId: String(membership.id),
      }),
    ),
  );
  const requestedOrganizationId = input.requestedOrganizationId?.trim() || null;
  const selectedOrganizationId = requestedOrganizationId &&
    options.some((option) => option.organizationId === requestedOrganizationId)
    ? requestedOrganizationId
    : null;

  return Object.freeze({
    kind: "access-resolution-required" as const,
    reason: options.length === 0
      ? "account-resolution" as const
      : "organization-resolution" as const,
    context: input.context,
    state: input.state,
    options,
    selectedOrganizationId,
  });
}

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

  if (!projection) {
    return Object.freeze({
      kind: "activation-required" as const,
      reason: "activation-context-required" as const,
      context,
      state: null,
    });
  }

  const { state, activeMemberships, boundMembership } = projection;
  const membership = projection.membership;
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

  if (
    !boundMembership ||
    boundMembership.id !== state.membershipId ||
    boundMembership.userId !== context.user.id ||
    String(boundMembership.organizationId) !== state.organization.id
  ) {
    return dependencyUnavailable(
      "workspace-state",
      new Error("Persisted participant membership binding is unavailable or cross-owned."),
    );
  }

  if (boundMembership.status !== "active") {
    if (membership) {
      return dependencyUnavailable(
        "workspace-state",
        new Error("Inactive participant membership unexpectedly resolved as active."),
      );
    }

    // A deliberate membership change is not a dependency outage and is not fresh activation.
    // Crucially, the old organization's controlled/OPEN lifecycle is never copied onto another
    // active membership. The dedicated resolution surface may describe current memberships, but it
    // cannot authorize them under this stale activation journey.
    return resolveChangedMembershipAccess({
      context,
      state,
      activeMemberships,
      requestedOrganizationId: input.requestedOrganizationId,
    });
  }

  const activeBinding = activeMemberships.find(
    (candidate) => candidate.id === boundMembership.id,
  ) ?? null;
  if (
    !membership ||
    membership.status !== "active" ||
    membership.id !== boundMembership.id ||
    membership.userId !== boundMembership.userId ||
    String(membership.organizationId) !== String(boundMembership.organizationId) ||
    !activeBinding ||
    activeBinding.status !== "active" ||
    activeBinding.userId !== boundMembership.userId ||
    String(activeBinding.organizationId) !== String(boundMembership.organizationId)
  ) {
    return dependencyUnavailable(
      "workspace-state",
      new Error("Active participant membership binding is inconsistent."),
    );
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
  } catch (error) {
    return dependencyUnavailable("restriction-state", error);
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
