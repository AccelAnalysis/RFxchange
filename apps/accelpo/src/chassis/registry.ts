import type { AccelPOConnectionPoint, AccelPOPartContract } from "./ports.ts";
import { CP01_IDENTITY_CONTEXT_PART } from "../identity-context/part.ts";
import { CP03_COMMAND_PORT_PART } from "../command-port/part.ts";
import { CP04_QUERY_PROJECTION_PART } from "../query-projection/part.ts";
import { CP05_POLICY_RESOLVER_PART } from "../policy-resolver/part.ts";
import { CP06_TASK_NOTIFICATION_PART } from "../task-notification/part.ts";
import { CP07_FILE_EVIDENCE_PART } from "../file-evidence/part.ts";
import { CP08_RFX_BRIDGE_PART } from "../rfx-bridge/part.ts";
import { CP09_MARKETING_EVENT_PART } from "../marketing-event/part.ts";
import { CP10_ENTITLEMENT_BILLING_PART } from "../entitlement-billing/part.ts";
import {
  P1_ORGANIZATION_PEOPLE_SEATS_PART,
  P2_PURCHASING_CONFIGURATION_PART,
} from "../organization-settings/part.ts";

const SHELL_ROUTES = Object.freeze([
  "/",
  "/purchases",
  "/new",
  "/tasks",
  "/organization",
  "/organization/details",
  "/organization/people",
  "/organization/purchasing",
  "/organization/providers",
  "/organization/billing",
  "/purchases/:caseId",
]);

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
  routes: SHELL_ROUTES,
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
  routes: SHELL_ROUTES,
  permissions: Object.freeze([]),
  connectionPoints: Object.freeze(["RouteSurface"] as readonly AccelPOConnectionPoint[]),
});

/**
 * Creates the current chassis registry with bounded CP-03 write, CP-04 read, CP-05 policy,
 * CP-06 task/notification, CP-07 private-file, CP-08 RFx bridge, CP-09 lifecycle-event, CP-10
 * entitlement/billing, and the P1/P2 Organization configuration surfaces registered. Later parts
 * should add themselves through this registry rather than creating parallel infrastructure.
 */
export function createAccelPOPartRegistry(): AccelPOPartRegistry {
  const registry = new AccelPOPartRegistry();
  registry.register(ACCELPO_CHASSIS_PART);
  registry.register(CP02_ROUTE_SURFACE_PART);
  registry.register(CP01_IDENTITY_CONTEXT_PART);
  registry.register(CP03_COMMAND_PORT_PART);
  registry.register(CP04_QUERY_PROJECTION_PART);
  registry.register(CP05_POLICY_RESOLVER_PART);
  registry.register(CP06_TASK_NOTIFICATION_PART);
  registry.register(CP07_FILE_EVIDENCE_PART);
  registry.register(CP08_RFX_BRIDGE_PART);
  registry.register(CP09_MARKETING_EVENT_PART);
  registry.register(CP10_ENTITLEMENT_BILLING_PART);
  registry.register(P1_ORGANIZATION_PEOPLE_SEATS_PART);
  registry.register(P2_PURCHASING_CONFIGURATION_PART);
  return registry;
}
