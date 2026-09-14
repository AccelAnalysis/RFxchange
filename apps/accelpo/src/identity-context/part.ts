import type { AccelPOPartContract } from "../chassis/ports.ts";
import { ACCELPO_CONNECTION_POINTS } from "../chassis/ports.ts";
import type { AccelPOPartRegistry } from "../chassis/registry.ts";

/** CP-01 registration for the shell-owned identity and organization context boundary. */
export const CP01_IDENTITY_CONTEXT_PART: AccelPOPartContract = Object.freeze({
  id: "CP-01-identity-context",
  routes: Object.freeze(["/signin"]),
  permissions: Object.freeze([]),
  connectionPoints: Object.freeze([
    ACCELPO_CONNECTION_POINTS.CP_01_IDENTITY_CONTEXT,
    ACCELPO_CONNECTION_POINTS.CP_04_QUERY_PROJECTION,
  ]),
});

export function registerCP01IdentityContext(registry: AccelPOPartRegistry): void {
  registry.register(CP01_IDENTITY_CONTEXT_PART);
}
