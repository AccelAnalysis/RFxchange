import type { AccelPOPartContract } from "../chassis/ports.ts";
import { ACCELPO_CONNECTION_POINTS } from "../chassis/ports.ts";
import type { AccelPOPartRegistry } from "../chassis/registry.ts";
import {
  ACCELPO_MARKETING_LIFECYCLE_EVENT_TYPES,
  CP09_MARKETING_EVENT_PORT_VERSION,
} from "./contracts.ts";

export const CP09_MARKETING_EVENT_PART: AccelPOPartContract = Object.freeze({
  id: "CP-09-marketing-event",
  routes: Object.freeze([]),
  permissions: Object.freeze([]),
  connectionPoints: Object.freeze([
    ACCELPO_CONNECTION_POINTS.CP_03_COMMAND_PORT,
    ACCELPO_CONNECTION_POINTS.CP_09_MARKETING_EVENT,
  ]),
});

/** Register CP-09 with the shell-owned chassis registry. */
export function registerCP09MarketingEvent(registry: AccelPOPartRegistry): void {
  registry.register(CP09_MARKETING_EVENT_PART);
}

export const CP09_MARKETING_EVENT_REGISTRATION = Object.freeze({
  partId: CP09_MARKETING_EVENT_PART.id,
  portVersion: CP09_MARKETING_EVENT_PORT_VERSION,
  events: ACCELPO_MARKETING_LIFECYCLE_EVENT_TYPES,
  clientEndpoint: null,
  outboxCollection: "accelPoMarketingEventOutbox",
  marketingSignalCollection: "marketingLifecycleSignals",
});
