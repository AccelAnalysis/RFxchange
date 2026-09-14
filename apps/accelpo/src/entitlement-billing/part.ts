import type { AccelPOPartContract } from "../chassis/ports.ts";
import { ACCELPO_CONNECTION_POINTS } from "../chassis/ports.ts";
import type { AccelPOPartRegistry } from "../chassis/registry.ts";

/** CP-10 has no standalone route; P1 consumes its organization-scoped seat and plan contract. */
export const CP10_ENTITLEMENT_BILLING_PART: AccelPOPartContract = Object.freeze({
  id: "CP-10-entitlement-billing",
  routes: Object.freeze([]),
  permissions: Object.freeze([
    "organization.people.manage",
    "billing.manage",
  ]),
  connectionPoints: Object.freeze([
    ACCELPO_CONNECTION_POINTS.CP_01_IDENTITY_CONTEXT,
    ACCELPO_CONNECTION_POINTS.CP_03_COMMAND_PORT,
    ACCELPO_CONNECTION_POINTS.CP_04_QUERY_PROJECTION,
    ACCELPO_CONNECTION_POINTS.CP_10_ENTITLEMENT_BILLING,
  ]),
});

export function registerCP10EntitlementBilling(registry: AccelPOPartRegistry): void {
  registry.register(CP10_ENTITLEMENT_BILLING_PART);
}
