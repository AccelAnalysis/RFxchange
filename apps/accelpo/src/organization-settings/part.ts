import type { AccelPOPartContract } from "../chassis/ports.ts";
import { ACCELPO_CONNECTION_POINTS } from "../chassis/ports.ts";

/**
 * P1 owns the Organization / People / Seats participant surfaces. It composes the existing
 * identity, role-safe read, trusted command, task/notification and entitlement boundaries rather
 * than creating another membership, permission or billing model.
 */
export const P1_ORGANIZATION_PEOPLE_SEATS_PART: AccelPOPartContract = Object.freeze({
  id: "P1-organization-people-seats",
  routes: Object.freeze([
    "/organization/details",
    "/organization/people",
    "/organization/billing",
  ]),
  permissions: Object.freeze([
    "organization.profile.manage",
    "organization.people.manage",
  ]),
  connectionPoints: Object.freeze([
    ACCELPO_CONNECTION_POINTS.CP_01_IDENTITY_CONTEXT,
    ACCELPO_CONNECTION_POINTS.CP_02_ROUTE_SURFACE,
    ACCELPO_CONNECTION_POINTS.CP_03_COMMAND_PORT,
    ACCELPO_CONNECTION_POINTS.CP_04_QUERY_PROJECTION,
    ACCELPO_CONNECTION_POINTS.CP_06_TASK_NOTIFICATION,
    ACCELPO_CONNECTION_POINTS.CP_10_ENTITLEMENT_BILLING,
  ]),
});

/**
 * P2 owns organization purchasing configuration. CP-05 remains the resolver for the effective
 * policy; these surfaces are configuration entry points and must not invent universal thresholds.
 */
export const P2_PURCHASING_CONFIGURATION_PART: AccelPOPartContract = Object.freeze({
  id: "P2-purchasing-configuration",
  routes: Object.freeze([
    "/organization/purchasing",
    "/organization/providers",
  ]),
  permissions: Object.freeze(["purchasing.configure"]),
  connectionPoints: Object.freeze([
    ACCELPO_CONNECTION_POINTS.CP_01_IDENTITY_CONTEXT,
    ACCELPO_CONNECTION_POINTS.CP_02_ROUTE_SURFACE,
    ACCELPO_CONNECTION_POINTS.CP_03_COMMAND_PORT,
    ACCELPO_CONNECTION_POINTS.CP_04_QUERY_PROJECTION,
    ACCELPO_CONNECTION_POINTS.CP_05_POLICY_RESOLVER,
    ACCELPO_CONNECTION_POINTS.CP_06_TASK_NOTIFICATION,
  ]),
});
