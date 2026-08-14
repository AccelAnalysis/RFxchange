export type FoundingCheckoutReleaseMode = "closed" | "proof" | "open";
export type FoundingCheckoutReleaseReason =
  | "available"
  | "checkout-closed"
  | "proof-organization-only"
  | "release-configuration-invalid";

export interface FoundingCheckoutReleaseDecision {
  readonly allowed: boolean;
  readonly reason: FoundingCheckoutReleaseReason;
}

export function resolveFoundingCheckoutReleaseDecision(
  organizationId: string,
  input: Readonly<{
    mode?: string | null;
    proofOrganizationId?: string | null;
  }> = {
    mode: process.env.RFXCHANGE_FOUNDING_CHECKOUT_RELEASE_MODE,
    proofOrganizationId: process.env.RFXCHANGE_FOUNDING_PROOF_ORGANIZATION_ID,
  },
): FoundingCheckoutReleaseDecision {
  const mode = input.mode?.trim() ?? "";
  if (!mode || mode === "closed") {
    return Object.freeze({ allowed: false, reason: "checkout-closed" as const });
  }
  if (mode !== "proof" && mode !== "open") {
    return Object.freeze({
      allowed: false,
      reason: "release-configuration-invalid" as const,
    });
  }
  if (mode === "proof") {
    const proof = input.proofOrganizationId?.trim() ?? "";
    if (!proof) {
      return Object.freeze({
        allowed: false,
        reason: "release-configuration-invalid" as const,
      });
    }
    if (proof !== organizationId) {
      return Object.freeze({
        allowed: false,
        reason: "proof-organization-only" as const,
      });
    }
  }
  return Object.freeze({ allowed: true, reason: "available" as const });
}
