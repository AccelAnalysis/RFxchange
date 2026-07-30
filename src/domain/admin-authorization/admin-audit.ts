import {
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type AdminRolePresetKey,
  type PlatformAdministratorAuthorityContext,
  type PlatformAdministratorId,
} from "./model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type PlatformAdminAuditEventId = Brand<string, "PlatformAdminAuditEventId">;
export type PlatformAdminAuditAction = Brand<string, "PlatformAdminAuditAction">;
export type PlatformAdminAuditTimestamp = Brand<string, "PlatformAdminAuditTimestamp">;

export interface PlatformAdminAuditTarget {
  readonly organizationId: string | null;
  readonly userId: string | null;
  readonly objectType: string;
  readonly objectId: string;
}

export interface PlatformAdminAuditSecurityContext {
  readonly authenticationSubject: string | null;
  readonly sessionId: string | null;
  readonly deviceId: string | null;
  readonly provider: string | null;
  readonly mfaVerifiedAt: PlatformAdminAuditTimestamp | null;
  readonly reauthenticatedAt: PlatformAdminAuditTimestamp | null;
  readonly networkContextHash: string | null;
}

export interface PlatformAdminAuditApprovalReference {
  readonly approvalId: string;
  readonly approverAdministratorId: PlatformAdministratorId;
}

export interface PlatformAdministrativeAuditEvent {
  readonly id: PlatformAdminAuditEventId;
  readonly actorAdministratorId: PlatformAdministratorId;
  readonly actorRolePresetKeys: readonly AdminRolePresetKey[];
  readonly permissionsExercised: readonly AdminPermissionKey[];
  readonly target: PlatformAdminAuditTarget;
  readonly action: PlatformAdminAuditAction;
  readonly outcome: "allowed" | "denied";
  readonly sensitivity: "ordinary" | "sensitive";
  readonly priorState: Readonly<Record<string, unknown>> | null;
  readonly newState: Readonly<Record<string, unknown>> | null;
  readonly reason: string;
  readonly relatedCaseId: string | null;
  readonly occurredAt: PlatformAdminAuditTimestamp;
  readonly securityContext: PlatformAdminAuditSecurityContext;
  readonly justification: string | null;
  readonly evidenceReferences: readonly string[];
  readonly approvalReferences: readonly PlatformAdminAuditApprovalReference[];
}

export interface CreatePlatformAdministrativeAuditEventInput {
  readonly id: string;
  readonly permissionsExercised: readonly string[];
  readonly target: Readonly<{
    organizationId?: string | null;
    userId?: string | null;
    objectType: string;
    objectId: string;
  }>;
  readonly action: string;
  readonly outcome?: "allowed" | "denied";
  readonly sensitivity?: "ordinary" | "sensitive";
  readonly priorState?: Readonly<Record<string, unknown>> | null;
  readonly newState?: Readonly<Record<string, unknown>> | null;
  readonly reason: string;
  readonly relatedCaseId?: string | null;
  readonly occurredAt: string;
  readonly securityContext?: Readonly<{
    authenticationSubject?: string | null;
    sessionId?: string | null;
    deviceId?: string | null;
    provider?: string | null;
    mfaVerifiedAt?: string | null;
    reauthenticatedAt?: string | null;
    networkContextHash?: string | null;
  }>;
  readonly justification?: string | null;
  readonly evidenceReferences?: readonly string[];
  readonly approvalReferences?: readonly Readonly<{
    approvalId: string;
    approverAdministratorId: string;
  }>[];
}

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function optionalValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const normalized = value.trim();
  return normalized || null;
}

function timestamp(value: string, field: string): PlatformAdminAuditTimestamp {
  const normalized = requiredValue(value, field);
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString() as PlatformAdminAuditTimestamp;
}

function optionalTimestamp(value: string | null | undefined, field: string): PlatformAdminAuditTimestamp | null {
  return value === null || value === undefined ? null : timestamp(value, field);
}

function auditAction(value: string): PlatformAdminAuditAction {
  const normalized = requiredValue(value, "Administrative audit action").toLowerCase();
  if (!/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(normalized)) {
    throw new Error("Administrative audit action must be a lowercase dot-delimited identifier.");
  }
  return normalized as PlatformAdminAuditAction;
}

function frozenState(value: Readonly<Record<string, unknown>> | null | undefined): Readonly<Record<string, unknown>> | null {
  if (!value) return null;
  return Object.freeze({ ...value });
}

function uniqueReferences(values: readonly string[] = [], field: string): readonly string[] {
  return Object.freeze([...new Set(values.map((value) => requiredValue(value, field)))]);
}

export function createPlatformAdministrativeAuditEvent(
  actor: PlatformAdministratorAuthorityContext,
  input: CreatePlatformAdministrativeAuditEventInput,
): PlatformAdministrativeAuditEvent {
  const occurredAt = timestamp(input.occurredAt, "Administrative audit timestamp");
  const sensitivity = input.sensitivity ?? "ordinary";
  const permissionsExercised = Object.freeze([
    ...new Set(input.permissionsExercised.map(requireCataloguedAdminPermission)),
  ]);
  if ((input.outcome ?? "allowed") === "allowed" && permissionsExercised.length === 0) {
    throw new Error("Allowed administrative audit events require at least one permission exercised.");
  }

  const securityContext: PlatformAdminAuditSecurityContext = Object.freeze({
    authenticationSubject: optionalValue(input.securityContext?.authenticationSubject),
    sessionId: optionalValue(input.securityContext?.sessionId),
    deviceId: optionalValue(input.securityContext?.deviceId),
    provider: optionalValue(input.securityContext?.provider),
    mfaVerifiedAt: optionalTimestamp(input.securityContext?.mfaVerifiedAt, "Administrative audit MFA timestamp"),
    reauthenticatedAt: optionalTimestamp(input.securityContext?.reauthenticatedAt, "Administrative audit re-authentication timestamp"),
    networkContextHash: optionalValue(input.securityContext?.networkContextHash),
  });
  if (sensitivity === "sensitive" && !securityContext.reauthenticatedAt) {
    throw new Error("Sensitive administrative audit events require recent re-authentication context.");
  }

  const approvalReferences = Object.freeze(
    (input.approvalReferences ?? []).map((approval) =>
      Object.freeze({
        approvalId: requiredValue(approval.approvalId, "Administrative approval id"),
        approverAdministratorId: requiredValue(
          approval.approverAdministratorId,
          "Administrative approval administrator id",
        ) as PlatformAdministratorId,
      }),
    ),
  );

  return Object.freeze({
    id: requiredValue(input.id, "Administrative audit event id") as PlatformAdminAuditEventId,
    actorAdministratorId: actor.administratorId,
    actorRolePresetKeys: Object.freeze([...actor.rolePresetKeys]),
    permissionsExercised,
    target: Object.freeze({
      organizationId: optionalValue(input.target.organizationId),
      userId: optionalValue(input.target.userId),
      objectType: requiredValue(input.target.objectType, "Administrative audit target type"),
      objectId: requiredValue(input.target.objectId, "Administrative audit target id"),
    }),
    action: auditAction(input.action),
    outcome: input.outcome ?? "allowed",
    sensitivity,
    priorState: frozenState(input.priorState),
    newState: frozenState(input.newState),
    reason: requiredValue(input.reason, "Administrative audit reason"),
    relatedCaseId: optionalValue(input.relatedCaseId),
    occurredAt,
    securityContext,
    justification: optionalValue(input.justification),
    evidenceReferences: uniqueReferences(input.evidenceReferences, "Administrative audit evidence reference"),
    approvalReferences,
  });
}
