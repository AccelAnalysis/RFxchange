import type { OrganizationAccount, OrganizationId } from "../organizations/model";
import type {
  OrganizationMembership,
  OrganizationMembershipId,
  UserId,
  UserIdentity,
} from "../users/model";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type OrganizationAuthorityRepresentationId = Brand<
  string,
  "OrganizationAuthorityRepresentationId"
>;
export type PlatformActorId = Brand<string, "PlatformActorId">;
export type PlatformChangeDirectiveId = Brand<string, "PlatformChangeDirectiveId">;
export type GovernanceTimestamp = Brand<string, "GovernanceTimestamp">;

export const ORGANIZATION_AUTHORITY_STATEMENT =
  "authorized-to-establish-or-begin-establishing-organization-account" as const;

export interface OrganizationAuthorityRepresentation {
  readonly id: OrganizationAuthorityRepresentationId;
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
  readonly organizationId: OrganizationId;
  readonly statement: typeof ORGANIZATION_AUTHORITY_STATEMENT;
  readonly representedAt: GovernanceTimestamp;
  readonly evidence: Readonly<{
    readonly source: "explicit-user-action";
    readonly capturedAt: GovernanceTimestamp;
  }>;
}

export interface CreateOrganizationAuthorityRepresentationInput {
  readonly id: string;
  readonly confirmsAuthority: true;
  readonly now: string;
}

export const PLATFORM_CHANGE_TARGET_KINDS = [
  "feature",
  "workflow",
  "geography",
  "eligibility",
  "api",
  "integration",
] as const;

export type PlatformChangeTargetKind = (typeof PLATFORM_CHANGE_TARGET_KINDS)[number];

export const PLATFORM_CHANGE_OPERATIONS = [
  "add",
  "modify",
  "remove",
  "temporarily-disable",
] as const;

export type PlatformChangeOperation = (typeof PLATFORM_CHANGE_OPERATIONS)[number];
export type PlatformChangeMode = "normal" | "emergency-security";

export type PlatformChangeCommunication =
  | Readonly<{
      readonly requirement: "before-effective";
      readonly status: "completed";
      readonly communicatedAt: GovernanceTimestamp;
    }>
  | Readonly<{
      readonly requirement: "post-action-allowed";
      readonly status: "pending";
    }>
  | Readonly<{
      readonly requirement: "post-action-allowed";
      readonly status: "completed";
      readonly communicatedAt: GovernanceTimestamp;
    }>;

export interface PlatformChangeDirective {
  readonly id: PlatformChangeDirectiveId;
  readonly actorId: PlatformActorId;
  readonly authority: "platform-governance";
  readonly targetKind: PlatformChangeTargetKind;
  readonly targetKey: string;
  readonly operation: PlatformChangeOperation;
  readonly mode: PlatformChangeMode;
  readonly reason: string;
  readonly communication: PlatformChangeCommunication;
  readonly createdAt: GovernanceTimestamp;
  readonly effectiveAt: GovernanceTimestamp;
}

export interface CreateNormalPlatformChangeDirectiveInput {
  readonly id: string;
  readonly actorId: string;
  readonly targetKind: PlatformChangeTargetKind;
  readonly targetKey: string;
  readonly operation: PlatformChangeOperation;
  readonly mode: "normal";
  readonly reason: string;
  readonly communicatedAt: string;
  readonly effectiveAt: string;
  readonly now: string;
}

export interface CreateEmergencyPlatformChangeDirectiveInput {
  readonly id: string;
  readonly actorId: string;
  readonly targetKind: PlatformChangeTargetKind;
  readonly targetKey: string;
  readonly operation: PlatformChangeOperation;
  readonly mode: "emergency-security";
  readonly reason: string;
  readonly communication:
    | Readonly<{ readonly status: "pending" }>
    | Readonly<{ readonly status: "completed"; readonly communicatedAt: string }>;
  readonly now: string;
}

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function governanceTimestamp(value: string): GovernanceTimestamp {
  const normalized = requiredValue(value, "Governance timestamp");
  const parsed = Date.parse(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error("Governance timestamp must be a valid ISO-compatible date-time value.");
  }

  return new Date(parsed).toISOString() as GovernanceTimestamp;
}

export function organizationAuthorityRepresentationId(
  value: string,
): OrganizationAuthorityRepresentationId {
  return requiredValue(
    value,
    "Organization authority representation id",
  ) as OrganizationAuthorityRepresentationId;
}

export function platformActorId(value: string): PlatformActorId {
  return requiredValue(value, "Platform actor id") as PlatformActorId;
}

export function platformChangeDirectiveId(value: string): PlatformChangeDirectiveId {
  return requiredValue(value, "Platform change directive id") as PlatformChangeDirectiveId;
}

export function platformChangeTargetKind(value: string): PlatformChangeTargetKind {
  if (!PLATFORM_CHANGE_TARGET_KINDS.includes(value as PlatformChangeTargetKind)) {
    throw new Error(`Unsupported platform change target kind: ${value}.`);
  }

  return value as PlatformChangeTargetKind;
}

export function platformChangeOperation(value: string): PlatformChangeOperation {
  if (!PLATFORM_CHANGE_OPERATIONS.includes(value as PlatformChangeOperation)) {
    throw new Error(`Unsupported platform change operation: ${value}.`);
  }

  return value as PlatformChangeOperation;
}

function assertActiveMembershipContext(
  user: UserIdentity,
  membership: OrganizationMembership,
  organization: OrganizationAccount,
): void {
  if (membership.status !== "active") {
    throw new Error("Inactive organization membership cannot represent organization authority.");
  }

  if (membership.userId !== user.id) {
    throw new Error("Organization membership belongs to a different user identity.");
  }

  if (membership.organizationId !== organization.id) {
    throw new Error("Organization membership belongs to a different organization tenant.");
  }
}

export function createOrganizationAuthorityRepresentation(
  user: UserIdentity,
  membership: OrganizationMembership,
  organization: OrganizationAccount,
  input: CreateOrganizationAuthorityRepresentationInput,
): OrganizationAuthorityRepresentation {
  assertActiveMembershipContext(user, membership, organization);

  if (input.confirmsAuthority !== true) {
    throw new Error("Organization authority must be represented by explicit user action.");
  }

  const now = governanceTimestamp(input.now);

  return Object.freeze({
    id: organizationAuthorityRepresentationId(input.id),
    userId: user.id,
    membershipId: membership.id,
    organizationId: organization.id,
    statement: ORGANIZATION_AUTHORITY_STATEMENT,
    representedAt: now,
    evidence: Object.freeze({
      source: "explicit-user-action" as const,
      capturedAt: now,
    }),
  });
}

function assertTargetAndOperation(
  targetKind: PlatformChangeTargetKind,
  operation: PlatformChangeOperation,
): void {
  platformChangeTargetKind(targetKind);
  platformChangeOperation(operation);
}

export function createNormalPlatformChangeDirective(
  input: CreateNormalPlatformChangeDirectiveInput,
): PlatformChangeDirective {
  assertTargetAndOperation(input.targetKind, input.operation);

  const createdAt = governanceTimestamp(input.now);
  const communicatedAt = governanceTimestamp(input.communicatedAt);
  const effectiveAt = governanceTimestamp(input.effectiveAt);

  if (communicatedAt > effectiveAt) {
    throw new Error("Normal platform changes must be communicated before they become effective.");
  }

  return Object.freeze({
    id: platformChangeDirectiveId(input.id),
    actorId: platformActorId(input.actorId),
    authority: "platform-governance" as const,
    targetKind: input.targetKind,
    targetKey: requiredValue(input.targetKey, "Platform change target key"),
    operation: input.operation,
    mode: "normal" as const,
    reason: requiredValue(input.reason, "Platform change reason"),
    communication: Object.freeze({
      requirement: "before-effective" as const,
      status: "completed" as const,
      communicatedAt,
    }),
    createdAt,
    effectiveAt,
  });
}

export function createEmergencyPlatformChangeDirective(
  input: CreateEmergencyPlatformChangeDirectiveInput,
): PlatformChangeDirective {
  assertTargetAndOperation(input.targetKind, input.operation);

  const createdAt = governanceTimestamp(input.now);
  const communication: PlatformChangeCommunication =
    input.communication.status === "completed"
      ? Object.freeze({
          requirement: "post-action-allowed" as const,
          status: "completed" as const,
          communicatedAt: governanceTimestamp(input.communication.communicatedAt),
        })
      : Object.freeze({
          requirement: "post-action-allowed" as const,
          status: "pending" as const,
        });

  return Object.freeze({
    id: platformChangeDirectiveId(input.id),
    actorId: platformActorId(input.actorId),
    authority: "platform-governance" as const,
    targetKind: input.targetKind,
    targetKey: requiredValue(input.targetKey, "Platform change target key"),
    operation: input.operation,
    mode: "emergency-security" as const,
    reason: requiredValue(input.reason, "Emergency/security reason"),
    communication,
    createdAt,
    effectiveAt: createdAt,
  });
}
