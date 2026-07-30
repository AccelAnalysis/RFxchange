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
  GOVERNED_CONFIGURATION_DEFINITIONS,
  governedConfigurationKey,
  proposeGovernedConfigurationChange,
  type GovernedConfigurationKey,
  type GovernedConfigurationState,
} from "../../domain/admin-configuration/model.ts";
import type {
  GovernedConfigurationChangeUnitOfWork,
  GovernedConfigurationRepository,
} from "../../domain/admin-configuration/repository.ts";

function assertPermission(
  authority: PlatformAdministratorAuthorityContext,
  permission: "config.value.read" | "config.value.manage",
  conditions: "none" | "pre-resolved" = "none",
): void {
  const decision = authorizeAdministrativeAction(
    authority,
    createAdministrativeActionRequirement({ permission, conditions }),
  );
  if (decision.kind !== "allow") {
    throw new Error(`Governed configuration access denied: ${decision.reason}.`);
  }
}

function configurationAuditState(
  state: GovernedConfigurationState | null,
): Readonly<Record<string, unknown>> | null {
  if (!state) return null;
  return Object.freeze({
    key: state.key,
    value: state.value,
    revision: state.revision,
    policyVersion: state.policyVersion,
    effectiveAt: state.effectiveAt,
    updatedAt: state.updatedAt,
    updatedByAdministratorId: state.updatedByAdministratorId,
  });
}

export interface GovernedConfigurationChangeExecution {
  readonly auditEventId: string;
  readonly relatedCaseId?: string | null;
  readonly securityContext: CreatePlatformAdministrativeAuditEventInput["securityContext"];
  readonly evidenceReferences?: readonly string[];
  readonly approvalReferences?: CreatePlatformAdministrativeAuditEventInput["approvalReferences"];
}

export class GovernedConfigurationService {
  private readonly repository: GovernedConfigurationRepository;
  private readonly changes: GovernedConfigurationChangeUnitOfWork;

  constructor(input: Readonly<{
    repository: GovernedConfigurationRepository;
    changes: GovernedConfigurationChangeUnitOfWork;
  }>) {
    this.repository = input.repository;
    this.changes = input.changes;
  }

  catalog(authority: PlatformAdministratorAuthorityContext) {
    assertPermission(authority, "config.value.read");
    return GOVERNED_CONFIGURATION_DEFINITIONS;
  }

  async get(
    authority: PlatformAdministratorAuthorityContext,
    rawKey: string,
  ): Promise<GovernedConfigurationState | null> {
    assertPermission(authority, "config.value.read");
    return this.repository.getByKey(governedConfigurationKey(rawKey));
  }

  async list(authority: PlatformAdministratorAuthorityContext): Promise<readonly GovernedConfigurationState[]> {
    assertPermission(authority, "config.value.read");
    return this.repository.listAll();
  }

  async change(input: Readonly<{
    authority: PlatformAdministratorAuthorityContext;
    key: string;
    value: unknown;
    expectedRevision: number;
    policyVersion: string;
    effectiveAt: string;
    reason: string;
    now: string;
    execution: GovernedConfigurationChangeExecution;
  }>): Promise<GovernedConfigurationState> {
    assertPermission(input.authority, "config.value.manage", "pre-resolved");
    const key: GovernedConfigurationKey = governedConfigurationKey(input.key);
    const current = await this.repository.getByKey(key);
    const next = proposeGovernedConfigurationChange({
      current,
      key,
      value: input.value,
      expectedRevision: input.expectedRevision,
      policyVersion: input.policyVersion,
      effectiveAt: input.effectiveAt,
      updatedAt: input.now,
      updatedByAdministratorId: input.authority.administratorId,
    });
    const auditEvent = createPlatformAdministrativeAuditEvent(input.authority, {
      id: input.execution.auditEventId,
      permissionsExercised: ["config.value.manage"],
      target: { objectType: "governed-configuration", objectId: key },
      action: "config.value.changed",
      outcome: "allowed",
      sensitivity: "sensitive",
      priorState: configurationAuditState(current),
      newState: configurationAuditState(next),
      reason: input.reason,
      relatedCaseId: input.execution.relatedCaseId,
      occurredAt: input.now,
      securityContext: input.execution.securityContext,
      justification: input.reason,
      evidenceReferences: input.execution.evidenceReferences,
      approvalReferences: input.execution.approvalReferences,
    });
    await this.changes.commitChange({
      expectedRevision: input.expectedRevision,
      state: next,
      auditEvent,
    });
    return next;
  }
}
