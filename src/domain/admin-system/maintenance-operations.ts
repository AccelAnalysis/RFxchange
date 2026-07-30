import type { PlatformAdministrativeAuditEvent } from "../admin-authorization/admin-audit.ts";
import type { PlatformAdministratorId } from "../admin-authorization/model.ts";

export const SYSTEM_MAINTENANCE_ACTIONS = [
  "retry-background-job",
  "disable-failing-integration",
  "reindex",
  "background-repair",
  "maintenance-mode",
] as const;

export type SystemMaintenanceAction = (typeof SYSTEM_MAINTENANCE_ACTIONS)[number];
export type SystemMaintenanceEnvironment = "development" | "staging" | "production";
export type SystemMaintenanceStatus = "running" | "succeeded" | "failed";
export type SystemMaintenanceParameter = string | number | boolean | null;

export interface SystemMaintenanceOperation {
  readonly id: string;
  readonly action: SystemMaintenanceAction;
  readonly target: string;
  readonly environment: SystemMaintenanceEnvironment;
  readonly reason: string;
  readonly idempotencyKey: string;
  readonly parameters: Readonly<Record<string, SystemMaintenanceParameter>>;
  readonly status: SystemMaintenanceStatus;
  readonly requestedAt: string;
  readonly requestedByAdministratorId: PlatformAdministratorId;
  readonly completedAt: string | null;
  readonly resultSummary: string | null;
  readonly diagnosticReference: string | null;
}

export interface SystemMaintenanceExecutionResult {
  readonly status: "succeeded" | "failed";
  readonly summary: string;
  readonly diagnosticReference?: string | null;
}

export interface SystemMaintenanceExecutor {
  supports(action: SystemMaintenanceAction): boolean;
  execute(operation: SystemMaintenanceOperation): Promise<SystemMaintenanceExecutionResult>;
}

export interface SystemMaintenanceOperationStore {
  createRequested(input: Readonly<{
    operation: SystemMaintenanceOperation;
    auditEvent: PlatformAdministrativeAuditEvent;
  }>): Promise<void>;
  complete(input: Readonly<{
    operationId: string;
    completedAt: string;
    result: SystemMaintenanceExecutionResult;
  }>): Promise<SystemMaintenanceOperation>;
  getById(operationId: string): Promise<SystemMaintenanceOperation | null>;
}

function required(value: string, field: string, max = 256): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  if (normalized.length > max) throw new Error(`${field} cannot exceed ${max} characters.`);
  return normalized;
}

function iso(value: string, field: string): string {
  const parsed = Date.parse(required(value, field, 64));
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString();
}

export function systemMaintenanceAction(value: string): SystemMaintenanceAction {
  const normalized = required(value, "System maintenance action", 64).toLowerCase();
  if (!(SYSTEM_MAINTENANCE_ACTIONS as readonly string[]).includes(normalized)) {
    throw new Error(`Unsupported system maintenance action: ${normalized}.`);
  }
  return normalized as SystemMaintenanceAction;
}

export function systemMaintenanceEnvironment(value: string): SystemMaintenanceEnvironment {
  const normalized = required(value, "System maintenance environment", 32).toLowerCase();
  if (!["development", "staging", "production"].includes(normalized)) {
    throw new Error(`Unsupported system maintenance environment: ${normalized}.`);
  }
  return normalized as SystemMaintenanceEnvironment;
}

function parameters(values: Readonly<Record<string, SystemMaintenanceParameter>> = {}) {
  const entries = Object.entries(values);
  if (entries.length > 20) throw new Error("System maintenance parameters cannot exceed 20 fields.");
  return Object.freeze(Object.fromEntries(entries.map(([key, value]) => {
    const normalizedKey = required(key, "System maintenance parameter key", 64);
    if (typeof value === "string" && value.length > 512) throw new Error(`System maintenance parameter ${normalizedKey} is too long.`);
    if (typeof value === "number" && !Number.isFinite(value)) throw new Error(`System maintenance parameter ${normalizedKey} must be finite.`);
    return [normalizedKey, value] as const;
  })));
}

export function createSystemMaintenanceOperation(input: Readonly<{
  id: string;
  action: string;
  target: string;
  environment: string;
  reason: string;
  idempotencyKey: string;
  parameters?: Readonly<Record<string, SystemMaintenanceParameter>>;
  requestedAt: string;
  requestedByAdministratorId: PlatformAdministratorId;
}>): SystemMaintenanceOperation {
  return Object.freeze({
    id: required(input.id, "System maintenance operation id", 192),
    action: systemMaintenanceAction(input.action),
    target: required(input.target, "System maintenance target", 256),
    environment: systemMaintenanceEnvironment(input.environment),
    reason: required(input.reason, "System maintenance reason", 1000),
    idempotencyKey: required(input.idempotencyKey, "System maintenance idempotency key", 256),
    parameters: parameters(input.parameters),
    status: "running" as const,
    requestedAt: iso(input.requestedAt, "System maintenance requested timestamp"),
    requestedByAdministratorId: input.requestedByAdministratorId,
    completedAt: null,
    resultSummary: null,
    diagnosticReference: null,
  });
}

export function completeSystemMaintenanceOperation(
  operation: SystemMaintenanceOperation,
  completedAt: string,
  result: SystemMaintenanceExecutionResult,
): SystemMaintenanceOperation {
  if (operation.status !== "running") throw new Error(`System maintenance operation ${operation.id} is already complete.`);
  return Object.freeze({
    ...operation,
    status: result.status,
    completedAt: iso(completedAt, "System maintenance completion timestamp"),
    resultSummary: required(result.summary, "System maintenance result summary", 1000),
    diagnosticReference: result.diagnosticReference?.trim() || null,
  });
}
