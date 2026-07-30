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
  createSystemMaintenanceOperation,
  systemMaintenanceAction,
  systemMaintenanceEnvironment,
  type SystemMaintenanceEnvironment,
  type SystemMaintenanceExecutor,
  type SystemMaintenanceOperation,
  type SystemMaintenanceOperationStore,
  type SystemMaintenanceParameter,
} from "../../domain/admin-system/maintenance-operations.ts";

function assertAuthorized(authority: PlatformAdministratorAuthorityContext): void {
  const decision = authorizeAdministrativeAction(
    authority,
    createAdministrativeActionRequirement({ permission: "system.maintenance.request", conditions: "pre-resolved" }),
  );
  if (decision.kind !== "allow") throw new Error(`System maintenance operation denied: ${decision.reason}.`);
}

function stringParameter(
  parameters: Readonly<Record<string, SystemMaintenanceParameter>>,
  key: string,
): string | null {
  const value = parameters[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberParameter(
  parameters: Readonly<Record<string, SystemMaintenanceParameter>>,
  key: string,
): number | null {
  const value = parameters[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanParameter(
  parameters: Readonly<Record<string, SystemMaintenanceParameter>>,
  key: string,
): boolean | null {
  const value = parameters[key];
  return typeof value === "boolean" ? value : null;
}

function validateGuardrails(input: Readonly<{
  action: string;
  target: string;
  environment: string;
  confirmation?: string | null;
  parameters?: Readonly<Record<string, SystemMaintenanceParameter>>;
}>): void {
  const action = systemMaintenanceAction(input.action);
  const environment = systemMaintenanceEnvironment(input.environment);
  const parameters = input.parameters ?? {};
  if (environment === "production") {
    const required = `confirm:${action}:${input.target.trim()}:production`;
    if (input.confirmation?.trim() !== required) {
      throw new Error("Production maintenance operations require an exact action/target confirmation token.");
    }
  }
  if (action === "disable-failing-integration") {
    const duration = numberParameter(parameters, "durationMinutes");
    if (!duration || !Number.isInteger(duration) || duration < 1 || duration > 1440) {
      throw new Error("Disabling a failing integration requires durationMinutes between 1 and 1440.");
    }
  }
  if (action === "reindex") {
    const mode = stringParameter(parameters, "mode");
    if (mode !== "incremental" && mode !== "full") {
      throw new Error("Reindex operations require mode=incremental or mode=full.");
    }
  }
  if (action === "background-repair") {
    const dryRun = booleanParameter(parameters, "dryRun");
    if (dryRun === null) throw new Error("Background repair requires an explicit dryRun boolean.");
    if (environment === "production" && dryRun === false && !stringParameter(parameters, "validatedDryRunReference")) {
      throw new Error("Production background repair requires validatedDryRunReference before non-dry execution.");
    }
  }
  if (action === "maintenance-mode") {
    const enabled = booleanParameter(parameters, "enabled");
    if (enabled === null) throw new Error("Maintenance-mode operation requires an enabled boolean.");
    if (enabled) {
      const duration = numberParameter(parameters, "durationMinutes");
      if (!duration || !Number.isInteger(duration) || duration < 1 || duration > 240) {
        throw new Error("Enabling maintenance mode requires durationMinutes between 1 and 240.");
      }
    }
  }
}

export class SystemMaintenanceOperationService {
  constructor(
    private readonly store: SystemMaintenanceOperationStore,
    private readonly executor: SystemMaintenanceExecutor,
    private readonly runtimeEnvironment: SystemMaintenanceEnvironment,
  ) {}

  async get(
    authority: PlatformAdministratorAuthorityContext,
    operationId: string,
  ): Promise<SystemMaintenanceOperation | null> {
    const decision = authorizeAdministrativeAction(
      authority,
      createAdministrativeActionRequirement({ permission: "system.health.read" }),
    );
    if (decision.kind !== "allow") throw new Error(`System maintenance status denied: ${decision.reason}.`);
    return this.store.getById(operationId.trim());
  }

  async request(input: Readonly<{
    authority: PlatformAdministratorAuthorityContext;
    operationId: string;
    action: string;
    target: string;
    environment: string;
    reason: string;
    idempotencyKey: string;
    confirmation?: string | null;
    parameters?: Readonly<Record<string, SystemMaintenanceParameter>>;
    now: string;
    auditEventId: string;
    relatedCaseId?: string | null;
    securityContext: CreatePlatformAdministrativeAuditEventInput["securityContext"];
  }>): Promise<SystemMaintenanceOperation> {
    assertAuthorized(input.authority);
    validateGuardrails(input);
    const environment = systemMaintenanceEnvironment(input.environment);
    if (environment !== this.runtimeEnvironment) {
      throw new Error(`System maintenance environment mismatch: operation targets ${environment}, runtime is ${this.runtimeEnvironment}.`);
    }
    const action = systemMaintenanceAction(input.action);
    if (!this.executor.supports(action)) {
      throw new Error(`No controlled executor is registered for maintenance action ${action}.`);
    }
    const operation = createSystemMaintenanceOperation({
      id: input.operationId,
      action,
      target: input.target,
      environment,
      reason: input.reason,
      idempotencyKey: input.idempotencyKey,
      parameters: input.parameters,
      requestedAt: input.now,
      requestedByAdministratorId: input.authority.administratorId,
    });
    const auditEvent = createPlatformAdministrativeAuditEvent(input.authority, {
      id: input.auditEventId,
      permissionsExercised: ["system.maintenance.request"],
      target: { objectType: "system-maintenance-operation", objectId: operation.id },
      action: `system.maintenance.${action}`,
      sensitivity: "sensitive",
      priorState: null,
      newState: {
        action: operation.action,
        target: operation.target,
        environment: operation.environment,
        status: operation.status,
        parameters: operation.parameters,
      },
      reason: operation.reason,
      relatedCaseId: input.relatedCaseId,
      occurredAt: input.now,
      securityContext: input.securityContext,
      justification: operation.reason,
    });
    await this.store.createRequested({ operation, auditEvent });
    try {
      const result = await this.executor.execute(operation);
      return await this.store.complete({ operationId: operation.id, completedAt: new Date().toISOString(), result });
    } catch (error) {
      return this.store.complete({
        operationId: operation.id,
        completedAt: new Date().toISOString(),
        result: {
          status: "failed",
          summary: "Controlled maintenance executor failed before reporting success.",
          diagnosticReference: error instanceof Error ? error.name : "executor-error",
        },
      });
    }
  }
}
