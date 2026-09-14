import type { AccelPOPartContract } from "../chassis/ports.ts";
import type { AccelPOPartRegistry } from "../chassis/registry.ts";
import { ACCELPO_CONNECTION_POINTS } from "../chassis/ports.ts";
import { CP08_RFX_BRIDGE_COMMANDS, CP08_RFX_BRIDGE_VERSION } from "./contracts.ts";

export const CP08_RFX_BRIDGE_PART: AccelPOPartContract = Object.freeze({
  id: "CP-08-rfx-bridge",
  routes: Object.freeze([]),
  permissions: Object.freeze([
    "purchase.request",
    "purchase.sourcing.publish",
    "purchase.offers.view",
  ]),
  connectionPoints: Object.freeze([
    ACCELPO_CONNECTION_POINTS.CP_01_IDENTITY_CONTEXT,
    ACCELPO_CONNECTION_POINTS.CP_03_COMMAND_PORT,
    ACCELPO_CONNECTION_POINTS.CP_04_QUERY_PROJECTION,
    ACCELPO_CONNECTION_POINTS.CP_07_FILE_EVIDENCE,
    ACCELPO_CONNECTION_POINTS.CP_08_RFX_BRIDGE,
  ]),
});

export function registerCP08RFxBridge(registry: AccelPOPartRegistry): void {
  registry.register(CP08_RFX_BRIDGE_PART);
}

export const CP08_RFX_BRIDGE_REGISTRATION = Object.freeze({
  partId: CP08_RFX_BRIDGE_PART.id,
  bridgeVersion: CP08_RFX_BRIDGE_VERSION,
  commands: Object.freeze(Object.values(CP08_RFX_BRIDGE_COMMANDS)),
  queries: Object.freeze(["offer-summary", "fulfillment-summary"]),
});
