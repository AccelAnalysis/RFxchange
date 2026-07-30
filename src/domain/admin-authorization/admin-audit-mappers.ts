import type { PlatformAdministratorAuthorityContext } from "./model.ts";
import type { PlatformAdministratorLifecycleEvent } from "./administrator-lifecycle.ts";
import {
  createPlatformAdministrativeAuditEvent,
  type PlatformAdministrativeAuditEvent,
  type CreatePlatformAdministrativeAuditEventInput,
} from "./admin-audit.ts";

export interface LifecycleAuditExecutionContext {
  readonly auditEventId: string;
  readonly relatedCaseId?: string | null;
  readonly securityContext?: CreatePlatformAdministrativeAuditEventInput["securityContext"];
  readonly justification?: string | null;
  readonly evidenceReferences?: readonly string[];
  readonly approvalReferences?: CreatePlatformAdministrativeAuditEventInput["approvalReferences"];
}

const SENSITIVE_LIFECYCLE_ACTIONS = new Set<PlatformAdministratorLifecycleEvent["action"]>([
  "administrator.access.updated",
  "administrator.disabled",
  "administrator.removed",
  "administrator.security.locked",
  "administrator.security.credential-reset-required",
  "administrator.security.mfa-required",
  "administrator.security.reauthentication-required",
  "administrator.security.sessions-terminated",
]);

export function createLifecyclePlatformAdministrativeAuditEvent(
  actor: PlatformAdministratorAuthorityContext,
  event: PlatformAdministratorLifecycleEvent,
  execution: LifecycleAuditExecutionContext,
): PlatformAdministrativeAuditEvent {
  const sensitive = SENSITIVE_LIFECYCLE_ACTIONS.has(event.action);
  return createPlatformAdministrativeAuditEvent(actor, {
    id: execution.auditEventId,
    permissionsExercised: [event.permission],
    target: {
      objectType: "platform-administrator",
      objectId: event.targetAdministratorId,
    },
    action: event.action,
    outcome: "allowed",
    sensitivity: sensitive ? "sensitive" : "ordinary",
    priorState: event.before,
    newState: event.after,
    reason: event.reason,
    relatedCaseId: execution.relatedCaseId,
    occurredAt: event.occurredAt,
    securityContext: execution.securityContext,
    justification: execution.justification ?? event.reason,
    evidenceReferences: execution.evidenceReferences,
    approvalReferences: execution.approvalReferences,
  });
}
