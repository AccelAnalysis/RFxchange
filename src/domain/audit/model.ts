import type {
  OrganizationAssetId,
  OrganizationAssetKind,
  OrganizationScopedAsset,
} from "../assets/model";
import type { OrganizationAccount, OrganizationId } from "../organizations/model";
import type {
  OrganizationMembership,
  OrganizationMembershipId,
  UserId,
  UserIdentity,
} from "../users/model";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type OrganizationAuditEventId = Brand<string, "OrganizationAuditEventId">;
export type OrganizationAuditAction = Brand<string, "OrganizationAuditAction">;
export type AuditTimestamp = Brand<string, "AuditTimestamp">;

export interface OrganizationAuditActor {
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
}

export interface OrganizationAuditTarget {
  readonly assetId: OrganizationAssetId;
  readonly assetKind: OrganizationAssetKind;
}

/**
 * Immutable attribution record for a user action performed in an organization context.
 * The organization owns the activity history; the actor identifies the exact user and
 * membership through which the action occurred.
 */
export interface OrganizationActionAuditEvent {
  readonly id: OrganizationAuditEventId;
  readonly organizationId: OrganizationId;
  readonly actor: OrganizationAuditActor;
  readonly action: OrganizationAuditAction;
  readonly target: OrganizationAuditTarget | null;
  readonly occurredAt: AuditTimestamp;
}

export interface CreateOrganizationActionAuditEventInput {
  readonly id: string;
  readonly action: string;
  readonly occurredAt: string;
  readonly target?: OrganizationScopedAsset | null;
}

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function auditTimestamp(value: string): AuditTimestamp {
  const normalized = requiredValue(value, "Audit timestamp");
  const parsed = Date.parse(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error("Audit timestamp must be a valid ISO-compatible date-time value.");
  }

  return new Date(parsed).toISOString() as AuditTimestamp;
}

export function organizationAuditEventId(value: string): OrganizationAuditEventId {
  return requiredValue(value, "Organization audit event id") as OrganizationAuditEventId;
}

export function organizationAuditAction(value: string): OrganizationAuditAction {
  const normalized = requiredValue(value, "Organization audit action").toLowerCase();

  if (!/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(normalized)) {
    throw new Error(
      "Organization audit action must be a lowercase dot-delimited identifier such as rfx.published.",
    );
  }

  return normalized as OrganizationAuditAction;
}

export function createOrganizationActionAuditEvent(
  user: UserIdentity,
  membership: OrganizationMembership,
  organization: OrganizationAccount,
  input: CreateOrganizationActionAuditEventInput,
): OrganizationActionAuditEvent {
  if (membership.status !== "active") {
    throw new Error("Inactive organization membership cannot originate an attributed user action.");
  }

  if (membership.userId !== user.id) {
    throw new Error("Organization membership belongs to a different user identity.");
  }

  if (membership.organizationId !== organization.id) {
    throw new Error("Organization membership belongs to a different organization tenant.");
  }

  if (input.target && input.target.organizationId !== organization.id) {
    throw new Error("Audit target belongs to a different organization tenant.");
  }

  const target = input.target
    ? Object.freeze({
        assetId: input.target.id,
        assetKind: input.target.kind,
      })
    : null;

  return Object.freeze({
    id: organizationAuditEventId(input.id),
    organizationId: organization.id,
    actor: Object.freeze({
      userId: user.id,
      membershipId: membership.id,
    }),
    action: organizationAuditAction(input.action),
    target,
    occurredAt: auditTimestamp(input.occurredAt),
  });
}
