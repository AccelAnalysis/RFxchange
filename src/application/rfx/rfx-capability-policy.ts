export type RfxCapabilityKey = "basic-issuance" | `advanced:${string}`;

export interface RfxCapabilityDecision {
  readonly allowed: boolean;
  readonly authority: "free-participation-policy" | "configured-entitlement" | "unavailable";
}

/** Commercial state may enable a separately authorized tool; it never changes market truth. */
export function evaluateRfxCapability(
  key: RfxCapabilityKey,
  configuredEntitlements: readonly string[] = [],
): RfxCapabilityDecision {
  if (key === "basic-issuance")
    return Object.freeze({ allowed: true, authority: "free-participation-policy" });
  return configuredEntitlements.includes(key)
    ? Object.freeze({ allowed: true, authority: "configured-entitlement" })
    : Object.freeze({ allowed: false, authority: "unavailable" });
}
