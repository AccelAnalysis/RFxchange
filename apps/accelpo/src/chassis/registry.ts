import type { AccelPOConnectionPoint, AccelPOPartContract } from "./ports.ts";
import { CP01_IDENTITY_CONTEXT_PART } from "../identity-context/part.ts";
import { CP03_COMMAND_PORT_PART } from "../command-port/part.ts";
import { CP04_QUERY_PROJECTION_PART } from "../query-projection/part.ts";
import { CP05_POLICY_RESOLVER_PART } from "../policy-resolver/part.ts";
import { CP09_MARKETING_EVENT_PART } from "../marketing-event/part.ts";

/** Small composition registry used by the shell. Parts register themselves; the shell owns the registry. */
export class AccelPOPartRegistry {
  private readonly parts = new Map<string, AccelPOPartContract>();

  register(part: AccelPOPartContract): void {
    if (this.parts.has(part.id)) throw new Error(`AccelPO part already registered: ${part.id}`);
    this.parts.set(part.id, Object.freeze({ ...part }));
  }

  get(id: string): AccelPOPartContract | undefined {
    return this.parts.get(id);
  }

  list(): readonly AccelPOPartContract[] {
    return Object.freeze([...this.parts.values()]);
  }
}

export const ACCELPO_CHASSIS_PART: AccelPOPartContract = Object.freeze({
  id: "P0-chassis",
  routes: Object.freeze(["/", "/purchases", "/new", "/tasks", "/organization", "/purchases/:caseId"]),
  permissions: Object.freeze([]),
  connectionPoints: Object.freeze([
    "IdentityContext",
    "RouteSurface",
    "CommandPort",
    "QueryProjection",
    "PolicyResolver",
    "TaskNotification",
    "FileEvidence",
    "RFxBridge",
    "MarketingEvent",
    "EntitlementBilling",
  ]) as readonly AccelPOConnectionPoint[],
});

/** CP-02 owns the shell and is the only route surface later parts may extend. */
export const CP02_ROUTE_SURFACE_PART: AccelPOPartContract = Object.freeze({
  id: "CP-02",
  routes: Object.freeze(["/", "/purchases", "/new", "/tasks", "/organization", "/purchases/:caseId"]),
  permissions: Object.freeze([]),
  connectionPoints: Object.freeze(["RouteSurface"] as readonly AccelPOConnectionPoint[]),
});

/**
 * Creates the current chassis registry with the bounded infrastructure parts registered.
 * Later parts should add themselves through the same registry rather than creating another router,
 * command boundary, query service, policy engine, or lifecycle-event bus.
 */
export function createAccelPOPartRegistry(): AccelPOPartRegistry {
  const registry = new AccelPOPartRegistry();
  registry.register(ACCELPO_CHASSIS_PART);
  registry.register(CP02_ROUTE_SURFACE_PART);
  registry.register(CP01_IDENTITY_CONTEXT_PART);
  registry.register(CP03_COMMAND_PORT_PART);
  registry.register(CP04_QUERY_PROJECTION_PART);
  registry.register(CP05_POLICY_RESOLVER_PART);
  registry.register(CP09_MARKETING_EVENT_PART);
  return registry;
}
