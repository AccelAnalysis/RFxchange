import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";
import {
  createPlatformAdministrativeAuditEvent,
  type CreatePlatformAdministrativeAuditEventInput,
} from "../../domain/admin-authorization/admin-audit.ts";
import {
  APPROVED_FEATURE_FLAG_KEYS,
  featureFlagStateId,
  proposeFeatureFlagChange,
  type FeatureFlagChangeRecord,
  type FeatureFlagChangeUnitOfWork,
  type FeatureFlagEnvironment,
  type FeatureFlagRepository,
  type FeatureFlagState,
} from "../../domain/admin-system/feature-flags.ts";

function authorize(
  authority: PlatformAdministratorAuthorityContext,
  permission: "config.value.read" | "config.value.manage",
  conditions: "none" | "pre-resolved" = "none",
): void {
  const decision = authorizeAdministrativeAction(
    authority,
    createAdministrativeActionRequirement({ permission, conditions }),
  );
  if (decision.kind !== "allow") throw new Error(`Feature flag administration denied: ${decision.reason}.`);
}

function stateAuditValue(state: FeatureFlagState | null): Readonly<Record<string, unknown>> | null {
  if (!state) return null;
  return Object.freeze({
    id: state.id,
    flag: state.flag,
    environment: state.environment,
    scope: state.scope,
    enabled: state.enabled,
    revision: state.revision,
    updatedAt: state.updatedAt,
    updatedByAdministratorId: state.updatedByAdministratorId,
  });
}

export class FeatureFlagAdministrationService {
  constructor(
    private readonly repository: FeatureFlagRepository,
    private readonly changes: FeatureFlagChangeUnitOfWork,
    private readonly runtimeEnvironment: FeatureFlagEnvironment,
  ) {}

  catalog(authority: PlatformAdministratorAuthorityContext): readonly string[] {
    authorize(authority, "config.value.read");
    return APPROVED_FEATURE_FLAG_KEYS;
  }

  async list(authority: PlatformAdministratorAuthorityContext): Promise<readonly FeatureFlagState[]> {
    authorize(authority, "config.value.read");
    return this.repository.listAll();
  }

  async change(input: Readonly<{
    authority: PlatformAdministratorAuthorityContext;
    flag: string;
    environment: string;
    scopeKind: string;
    scopeId?: string | null;
    enabled: boolean;
    expectedRevision: number;
    reason: string;
    now: string;
    auditEventId: string;
    changeRecordId?: string;
    relatedCaseId?: string | null;
    securityContext: CreatePlatformAdministrativeAuditEventInput["securityContext"];
  }>): Promise<FeatureFlagState> {
    authorize(input.authority, "config.value.manage", "pre-resolved");
    const id = featureFlagStateId(input);
    const requestedEnvironment = id.split(":")[1];
    if (requestedEnvironment !== this.runtimeEnvironment) {
      throw new Error(
        `Feature flag environment mismatch: operation targets ${requestedEnvironment}, runtime is ${this.runtimeEnvironment}.`,
      );
    }
    const current = await this.repository.getById(id);
    const next = proposeFeatureFlagChange({
      current,
      flag: input.flag,
      environment: input.environment,
      scopeKind: input.scopeKind,
      scopeId: input.scopeId,
      enabled: input.enabled,
      expectedRevision: input.expectedRevision,
      changedAt: input.now,
      administratorId: input.authority.administratorId,
    });
    const auditEvent = createPlatformAdministrativeAuditEvent(input.authority, {
      id: input.auditEventId,
      permissionsExercised: ["config.value.manage"],
      target: { objectType: "feature-flag", objectId: next.id },
      action: "config.feature-flag.changed",
      sensitivity: "sensitive",
      priorState: stateAuditValue(current),
      newState: stateAuditValue(next),
      reason: input.reason,
      relatedCaseId: input.relatedCaseId,
      occurredAt: input.now,
      securityContext: input.securityContext,
      justification: input.reason,
    });
    const changeRecord: FeatureFlagChangeRecord = Object.freeze({
      id: (input.changeRecordId ?? input.auditEventId).trim(),
      stateId: next.id,
      revision: next.revision,
      previousEnabled: current?.enabled ?? null,
      enabled: next.enabled,
      reason: input.reason.trim(),
      changedAt: next.updatedAt,
      actorAdministratorId: input.authority.administratorId,
      auditEventId: auditEvent.id,
    });
    if (!changeRecord.id || !changeRecord.reason) throw new Error("Feature flag changes require an id and reason.");
    await this.changes.commitChange({ expectedRevision: input.expectedRevision, state: next, changeRecord, auditEvent });
    return next;
  }
}
