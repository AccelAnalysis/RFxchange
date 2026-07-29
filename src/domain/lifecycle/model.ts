import type { OrganizationAccount, OrganizationId } from "../organizations/model";
import type {
  OrganizationMembership,
  OrganizationMembershipId,
  UserId,
} from "../users/model";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type AccessJourneyId = Brand<string, "AccessJourneyId">;
export type AccessRestrictionId = Brand<string, "AccessRestrictionId">;
export type LifecycleTimestamp = Brand<string, "LifecycleTimestamp">;

export const ACCESS_LIFECYCLE_STATES = [
  "visitor",
  "account-started",
  "account-activated",
  "geography-selected",
  "organization-resolved",
  "organization-registered",
  "organization-activated",
  "controlled-platform",
  "open-platform",
] as const;

export type AccessLifecycleState = (typeof ACCESS_LIFECYCLE_STATES)[number];

export const ACCESS_RESTRICTION_STATES = [
  "none",
  "restricted",
  "suspended",
  "integrity-hold",
  "terminated",
] as const;

export type AccessRestrictionState = (typeof ACCESS_RESTRICTION_STATES)[number];

export interface AccessLifecycleRecord {
  readonly id: AccessJourneyId;
  readonly state: AccessLifecycleState;
  readonly createdAt: LifecycleTimestamp;
  readonly updatedAt: LifecycleTimestamp;
}

export type AccessRestrictionTarget =
  | {
      readonly kind: "organization";
      readonly organizationId: OrganizationId;
    }
  | {
      readonly kind: "membership";
      readonly organizationId: OrganizationId;
      readonly membershipId: OrganizationMembershipId;
      readonly userId: UserId;
    };

export interface AccessRestrictionRecord {
  readonly id: AccessRestrictionId;
  readonly target: AccessRestrictionTarget;
  readonly state: AccessRestrictionState;
  readonly createdAt: LifecycleTimestamp;
  readonly updatedAt: LifecycleTimestamp;
}

export interface CreateAccessLifecycleInput {
  readonly id: string;
  readonly now: string;
}

export interface CreateAccessRestrictionInput {
  readonly id: string;
  readonly state?: AccessRestrictionState;
  readonly now: string;
}

export type EffectivePlatformAccess =
  | {
      readonly mode: "onboarding";
      readonly lifecycleState: AccessLifecycleState;
    }
  | {
      readonly mode: "controlled-platform";
      readonly lifecycleState: "controlled-platform";
    }
  | {
      readonly mode: "open-platform";
      readonly lifecycleState: "open-platform";
    }
  | {
      readonly mode: "restriction";
      readonly lifecycleState: AccessLifecycleState;
      readonly restrictionState: Exclude<AccessRestrictionState, "none">;
    };

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function lifecycleTimestamp(value: string): LifecycleTimestamp {
  const normalized = requiredValue(value, "Lifecycle timestamp");
  const parsed = Date.parse(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error("Lifecycle timestamp must be a valid ISO-compatible date-time value.");
  }

  return new Date(parsed).toISOString() as LifecycleTimestamp;
}

export function accessJourneyId(value: string): AccessJourneyId {
  return requiredValue(value, "Access journey id") as AccessJourneyId;
}

export function accessRestrictionId(value: string): AccessRestrictionId {
  return requiredValue(value, "Access restriction id") as AccessRestrictionId;
}

export function accessLifecycleState(value: string): AccessLifecycleState {
  if (!ACCESS_LIFECYCLE_STATES.includes(value as AccessLifecycleState)) {
    throw new Error(`Unsupported access lifecycle state: ${value}.`);
  }

  return value as AccessLifecycleState;
}

export function accessRestrictionState(value: string): AccessRestrictionState {
  if (!ACCESS_RESTRICTION_STATES.includes(value as AccessRestrictionState)) {
    throw new Error(`Unsupported access restriction state: ${value}.`);
  }

  return value as AccessRestrictionState;
}

export function createAccessLifecycle(input: CreateAccessLifecycleInput): AccessLifecycleRecord {
  const now = lifecycleTimestamp(input.now);

  return Object.freeze({
    id: accessJourneyId(input.id),
    state: "visitor" as const,
    createdAt: now,
    updatedAt: now,
  });
}

export function nextAccessLifecycleState(
  current: AccessLifecycleState,
): AccessLifecycleState | null {
  const currentIndex = ACCESS_LIFECYCLE_STATES.indexOf(current);

  if (currentIndex < 0 || currentIndex === ACCESS_LIFECYCLE_STATES.length - 1) {
    return null;
  }

  return ACCESS_LIFECYCLE_STATES[currentIndex + 1];
}

export function canAdvanceAccessLifecycle(
  current: AccessLifecycleState,
  next: AccessLifecycleState,
): boolean {
  return nextAccessLifecycleState(current) === next;
}

export function advanceAccessLifecycle(
  record: AccessLifecycleRecord,
  next: AccessLifecycleState,
  now: string,
): AccessLifecycleRecord {
  if (!canAdvanceAccessLifecycle(record.state, next)) {
    throw new Error(`Invalid access lifecycle transition: ${record.state} -> ${next}.`);
  }

  return Object.freeze({
    id: record.id,
    state: next,
    createdAt: record.createdAt,
    updatedAt: lifecycleTimestamp(now),
  });
}

export function organizationRestrictionTarget(
  organization: OrganizationAccount,
): AccessRestrictionTarget {
  return Object.freeze({
    kind: "organization" as const,
    organizationId: organization.id,
  });
}

export function membershipRestrictionTarget(
  membership: OrganizationMembership,
  organization: OrganizationAccount,
): AccessRestrictionTarget {
  if (membership.organizationId !== organization.id) {
    throw new Error("Organization membership does not belong to the supplied organization tenant.");
  }

  return Object.freeze({
    kind: "membership" as const,
    organizationId: organization.id,
    membershipId: membership.id,
    userId: membership.userId,
  });
}

export function createAccessRestriction(
  target: AccessRestrictionTarget,
  input: CreateAccessRestrictionInput,
): AccessRestrictionRecord {
  const now = lifecycleTimestamp(input.now);

  return Object.freeze({
    id: accessRestrictionId(input.id),
    target,
    state: accessRestrictionState(input.state ?? "none"),
    createdAt: now,
    updatedAt: now,
  });
}

export function canTransitionAccessRestriction(
  current: AccessRestrictionState,
  next: AccessRestrictionState,
): boolean {
  if (current === "terminated") {
    return next === "terminated";
  }

  return ACCESS_RESTRICTION_STATES.includes(next);
}

export function transitionAccessRestriction(
  record: AccessRestrictionRecord,
  next: AccessRestrictionState,
  now: string,
): AccessRestrictionRecord {
  if (!canTransitionAccessRestriction(record.state, next)) {
    throw new Error(`Invalid access restriction transition: ${record.state} -> ${next}.`);
  }

  if (record.state === next) {
    return record;
  }

  return Object.freeze({
    id: record.id,
    target: record.target,
    state: next,
    createdAt: record.createdAt,
    updatedAt: lifecycleTimestamp(now),
  });
}

export function resolveEffectivePlatformAccess(
  lifecycle: AccessLifecycleRecord,
  restriction: AccessRestrictionRecord | null,
): EffectivePlatformAccess {
  if (restriction && restriction.state !== "none") {
    return Object.freeze({
      mode: "restriction" as const,
      lifecycleState: lifecycle.state,
      restrictionState: restriction.state,
    });
  }

  if (lifecycle.state === "controlled-platform") {
    return Object.freeze({
      mode: "controlled-platform" as const,
      lifecycleState: "controlled-platform" as const,
    });
  }

  if (lifecycle.state === "open-platform") {
    return Object.freeze({
      mode: "open-platform" as const,
      lifecycleState: "open-platform" as const,
    });
  }

  return Object.freeze({
    mode: "onboarding" as const,
    lifecycleState: lifecycle.state,
  });
}
