import type { AccelPOPartContract } from "../chassis/ports.ts";
import type { AccelPOPartRegistry } from "../chassis/registry.ts";
import { ACCELPO_CONNECTION_POINTS } from "../chassis/ports.ts";
import { ACCELPO_CAPABILITIES, ACCELPO_PROJECTION_NAMES } from "./contracts.ts";

export const CP04_QUERY_PROJECTION_PART: AccelPOPartContract = Object.freeze({
  id: "CP-04-query-projection",
  routes: Object.freeze([]),
  permissions: Object.freeze([...ACCELPO_CAPABILITIES]),
  connectionPoints: Object.freeze([
    ACCELPO_CONNECTION_POINTS.CP_01_IDENTITY_CONTEXT,
    ACCELPO_CONNECTION_POINTS.CP_04_QUERY_PROJECTION,
  ]),
});

/** Register CP-04 with the shell-owned chassis registry. */
export function registerCP04QueryProjection(registry: AccelPOPartRegistry): void {
  registry.register(CP04_QUERY_PROJECTION_PART);
}

export const CP04_PROJECTION_REGISTRATION = Object.freeze({
  partId: CP04_QUERY_PROJECTION_PART.id,
  projections: ACCELPO_PROJECTION_NAMES,
  endpoint: "/api/accelpo/query",
});
