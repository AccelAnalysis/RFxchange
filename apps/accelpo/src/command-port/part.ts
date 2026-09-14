import type { AccelPOPartContract } from "../chassis/ports.ts";
import { ACCELPO_CONNECTION_POINTS } from "../chassis/ports.ts";
import type { AccelPOPartRegistry } from "../chassis/registry.ts";

export const CP03_COMMAND_PORT_PART: AccelPOPartContract = Object.freeze({
  id: "CP-03-command-port",
  routes: Object.freeze([]),
  permissions: Object.freeze([]),
  connectionPoints: Object.freeze([
    ACCELPO_CONNECTION_POINTS.CP_01_IDENTITY_CONTEXT,
    ACCELPO_CONNECTION_POINTS.CP_03_COMMAND_PORT,
  ]),
});

/** Register CP-03 with the shell-owned chassis registry. */
export function registerCP03CommandPort(registry: AccelPOPartRegistry): void {
  registry.register(CP03_COMMAND_PORT_PART);
}

export const CP03_COMMAND_REGISTRATION = Object.freeze({
  partId: CP03_COMMAND_PORT_PART.id,
  portVersion: 1 as const,
  endpoint: "/api/accelpo/commands",
});
