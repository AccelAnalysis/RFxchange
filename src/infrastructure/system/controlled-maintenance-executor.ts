import type {
  SystemMaintenanceAction,
  SystemMaintenanceExecutionResult,
  SystemMaintenanceExecutor,
  SystemMaintenanceOperation,
} from "../../domain/admin-system/maintenance-operations.ts";

export type SystemMaintenanceActionHandler = (
  operation: SystemMaintenanceOperation,
) => Promise<SystemMaintenanceExecutionResult>;

/**
 * Server-only dispatch adapter. The administrative UI can request a named operation, but only
 * explicitly registered handlers can touch infrastructure. No arbitrary command/shell surface exists.
 */
export class ControlledSystemMaintenanceExecutor implements SystemMaintenanceExecutor {
  private readonly handlers: Readonly<Partial<Record<SystemMaintenanceAction, SystemMaintenanceActionHandler>>>;

  constructor(
    handlers: Readonly<Partial<Record<SystemMaintenanceAction, SystemMaintenanceActionHandler>>>,
  ) {
    this.handlers = handlers;
  }

  supports(action: SystemMaintenanceAction): boolean {
    return typeof this.handlers[action] === "function";
  }

  async execute(operation: SystemMaintenanceOperation): Promise<SystemMaintenanceExecutionResult> {
    const handler = this.handlers[operation.action];
    if (!handler) throw new Error(`No controlled handler is registered for ${operation.action}.`);
    return handler(operation);
  }
}
