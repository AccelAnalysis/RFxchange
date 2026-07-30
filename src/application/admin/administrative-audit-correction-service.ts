import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";
import {
  createPlatformAdministrativeAuditEvent,
  type CreatePlatformAdministrativeAuditEventInput,
  type PlatformAdminAuditEventId,
  type PlatformAdministrativeAuditEvent,
} from "../../domain/admin-authorization/admin-audit.ts";
import type { PlatformAdministrativeAuditRepository } from "../../domain/admin-authorization/admin-audit-repository.ts";

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function assertPermission(
  authority: PlatformAdministratorAuthorityContext,
  permission: "audit.event.read" | "audit.correction.append",
  conditions: "none" | "pre-resolved" = "none",
): void {
  const decision = authorizeAdministrativeAction(
    authority,
    createAdministrativeActionRequirement({ permission, conditions }),
  );
  if (decision.kind !== "allow") {
    throw new Error(`Administrative audit correction denied: ${decision.reason}.`);
  }
}

export interface AdministrativeAuditCorrectionExecution {
  readonly securityContext: CreatePlatformAdministrativeAuditEventInput["securityContext"];
  readonly relatedCaseId?: string | null;
  readonly evidenceReferences?: readonly string[];
  readonly approvalReferences?: CreatePlatformAdministrativeAuditEventInput["approvalReferences"];
}

/**
 * ADM-086 corrections are new ADM-085 audit events. The original event is only read; it is never
 * rewritten or deleted by this service.
 */
export class AdministrativeAuditCorrectionService {
  private readonly audit: PlatformAdministrativeAuditRepository;

  constructor(audit: PlatformAdministrativeAuditRepository) {
    this.audit = audit;
  }

  async appendCorrection(input: Readonly<{
    authority: PlatformAdministratorAuthorityContext;
    originalEventId: string;
    correctionEventId: string;
    correctedState: Readonly<Record<string, unknown>>;
    reason: string;
    occurredAt: string;
    execution: AdministrativeAuditCorrectionExecution;
  }>): Promise<PlatformAdministrativeAuditEvent> {
    assertPermission(input.authority, "audit.event.read");
    assertPermission(input.authority, "audit.correction.append", "pre-resolved");
    const originalId = required(input.originalEventId, "Original administrative audit event id");
    const correctionId = required(input.correctionEventId, "Administrative audit correction event id");
    if (originalId === correctionId) {
      throw new Error("Administrative audit correction must use a new event id.");
    }
    if (Object.keys(input.correctedState).length === 0) {
      throw new Error("Administrative audit correction must describe the corrected state.");
    }
    const original = await this.audit.getById(originalId as PlatformAdminAuditEventId);
    if (!original) throw new Error(`Administrative audit event not found: ${originalId}.`);

    const correction = createPlatformAdministrativeAuditEvent(input.authority, {
      id: correctionId,
      permissionsExercised: ["audit.event.read", "audit.correction.append"],
      target: {
        organizationId: original.target.organizationId,
        userId: original.target.userId,
        objectType: "platform-administrative-audit-event",
        objectId: original.id,
      },
      action: "audit.event.correction-appended",
      outcome: "allowed",
      sensitivity: "sensitive",
      priorState: Object.freeze({
        originalEventId: original.id,
        originalAction: original.action,
        originalOutcome: original.outcome,
        originalOccurredAt: original.occurredAt,
      }),
      newState: Object.freeze({
        correctionOfEventId: original.id,
        correctedState: Object.freeze({ ...input.correctedState }),
      }),
      reason: input.reason,
      relatedCaseId: input.execution.relatedCaseId,
      occurredAt: input.occurredAt,
      securityContext: input.execution.securityContext,
      justification: input.reason,
      evidenceReferences: input.execution.evidenceReferences,
      approvalReferences: input.execution.approvalReferences,
    });
    await this.audit.append(correction);
    return correction;
  }
}
