import type {
  EntitlementBillingProjection,
} from "../../../../src/application/accelpo/entitlement-billing.ts";
import { ACCELPO_ENTITLEMENT_BILLING_VERSION } from "../../../../src/application/accelpo/entitlement-billing.ts";
import type { EntitlementBillingPort, QueryProjectionPort } from "../chassis/ports.ts";
import type {
  OrganizationContextProjection,
  QueryProjectionInput,
  QueryProjectionResult,
} from "../query-projection/contracts.ts";

export class EntitlementBillingReadError extends Error {
  readonly code: "forbidden" | "unavailable" | "invalid-projection";

  constructor(
    code: "forbidden" | "unavailable" | "invalid-projection",
    message: string,
  ) {
    super(message);
    this.name = "EntitlementBillingReadError";
    this.code = code;
  }
}

function organizationContext(result: QueryProjectionResult): OrganizationContextProjection {
  if (result.outcome === "failure") {
    throw new EntitlementBillingReadError(
      result.code === "forbidden" || result.code === "unauthenticated" ? "forbidden" : "unavailable",
      result.message,
    );
  }
  if (result.outcome === "empty" || result.projection !== "organization-context") {
    throw new EntitlementBillingReadError(
      "invalid-projection",
      "Organization seat information is unavailable.",
    );
  }
  const item = result.items[0] as OrganizationContextProjection | undefined;
  if (!item || item.membershipStatus !== "active") {
    throw new EntitlementBillingReadError(
      "invalid-projection",
      "Organization seat information is unavailable.",
    );
  }
  return item;
}

/**
 * P1 consumes CP-10 through the existing CP-04 query port. No commercial account or membership
 * collection is read directly by the browser.
 */
export function createEntitlementBillingPort(
  queryPort: QueryProjectionPort<QueryProjectionInput, QueryProjectionResult>,
): EntitlementBillingPort<EntitlementBillingProjection> {
  return Object.freeze({
    async read(): Promise<EntitlementBillingProjection> {
      const item = organizationContext(await queryPort.read(Object.freeze({
        projection: "organization-context",
        scope: "record",
      })));
      if (item.seats.active === null || item.seats.reserved === null) {
        throw new EntitlementBillingReadError(
          "invalid-projection",
          "Organization seat information is unavailable.",
        );
      }
      return Object.freeze({
        version: ACCELPO_ENTITLEMENT_BILLING_VERSION,
        organizationId: item.organizationId,
        status: item.seats.included === null ? "not-configured" as const : "available" as const,
        plan: item.plan.name,
        includedSeats: item.seats.included,
        activeSeats: item.seats.active,
        reservedSeats: item.seats.reserved,
        availableSeats: item.seats.available,
        addOnSeatAllowance: item.seats.addOnAllowance,
        addOnSeatPricing: item.seats.addOnPricing,
        billingPeriod: item.plan.billingPeriod,
        entitlementVersion: item.seats.entitlementVersion,
        addSeatActionAllowed: item.seats.addSeatActionAllowed,
        ownerCountsAsSeat: true as const,
      });
    },
  });
}
