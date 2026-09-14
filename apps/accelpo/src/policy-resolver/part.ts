import { ACCELPO_CONNECTION_POINTS, type AccelPOPartContract } from "../chassis/ports.ts";
import type { AccelPOPartRegistry } from "../chassis/registry.ts";
import { CP05_POLICY_CONTRACT_VERSION } from "./contracts.ts";

export const CP05_POLICY_RESOLVER_PART: AccelPOPartContract = Object.freeze({
  id: "CP-05-policy-resolver",
  routes: Object.freeze([]),
  permissions: Object.freeze([]),
  connectionPoints: Object.freeze([
    ACCELPO_CONNECTION_POINTS.CP_01_IDENTITY_CONTEXT,
    ACCELPO_CONNECTION_POINTS.CP_05_POLICY_RESOLVER,
  ]),
});

/** Register CP-05 with the shell-owned chassis registry. */
export function registerCP05PolicyResolver(registry: AccelPOPartRegistry): void {
  registry.register(CP05_POLICY_RESOLVER_PART);
}

export const CP05_POLICY_REGISTRATION = Object.freeze({
  partId: CP05_POLICY_RESOLVER_PART.id,
  contractVersion: CP05_POLICY_CONTRACT_VERSION,
});
