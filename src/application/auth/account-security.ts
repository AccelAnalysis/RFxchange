import type { AccessRestrictionState } from "../../domain/lifecycle/model.ts";
import type { OrganizationMembershipStatus } from "../../domain/users/model.ts";

export const DEFAULT_AUTHENTICATION_SECURITY_POLICY = Object.freeze({
  requireVerifiedEmailForOrganizationAccess: true,
});

export interface AuthenticationAccountSecuritySnapshot {
  readonly provider: string;
  readonly subject: string;
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly disabled: boolean;
  readonly mfaEnrolled: boolean;
  /** Provider timestamp after which credentials must have been authenticated to remain current. */
  readonly tokensValidAfter: string | null;
  readonly lastSignInAt: string | null;
}

export type AuthenticationAccountState =
  | "active"
  | "email-verification-required"
  | "disabled";

export type AuthenticationCredentialState = "current" | "revoked";

export type AuthenticatedOrganizationAccessDecision =
  | Readonly<{ readonly allowed: true }>
  | Readonly<{
      readonly allowed: false;
      readonly reason:
        | "account-disabled"
        | "credential-revoked"
        | "email-verification-required"
        | "membership-inactive"
        | "organization-access-restricted";
      readonly restrictionState?: Exclude<AccessRestrictionState, "none">;
    }>;

function normalizedTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid ISO-compatible timestamp.`);
  return parsed;
}

export function authenticationAccountState(
  snapshot: AuthenticationAccountSecuritySnapshot,
  policy = DEFAULT_AUTHENTICATION_SECURITY_POLICY,
): AuthenticationAccountState {
  if (snapshot.disabled) return "disabled";
  if (policy.requireVerifiedEmailForOrganizationAccess && !snapshot.emailVerified) {
    return "email-verification-required";
  }
  return "active";
}

export function authenticationCredentialState(
  snapshot: AuthenticationAccountSecuritySnapshot,
  authenticatedAt: string,
): AuthenticationCredentialState {
  if (!snapshot.tokensValidAfter) return "current";
  const credentialTime = normalizedTimestamp(authenticatedAt, "Credential authentication time");
  const validAfterTime = normalizedTimestamp(snapshot.tokensValidAfter, "Token-valid-after time");
  return credentialTime < validAfterTime ? "revoked" : "current";
}

/**
 * Minimum AUTH-004 eligibility gate before organization permissions are evaluated.
 *
 * Authentication/account state cannot grant organization access. It can only deny access before the
 * organization permission engine runs. AUTH-005 and later vertical slices compose this gate with
 * tenant/membership/permission evaluation.
 */
export function evaluateAuthenticatedOrganizationAccess(input: Readonly<{
  account: AuthenticationAccountSecuritySnapshot;
  credentialAuthenticatedAt: string;
  membershipStatus: OrganizationMembershipStatus;
  restrictionState: AccessRestrictionState;
  policy?: typeof DEFAULT_AUTHENTICATION_SECURITY_POLICY;
}>): AuthenticatedOrganizationAccessDecision {
  const accountState = authenticationAccountState(input.account, input.policy);
  if (accountState === "disabled") {
    return Object.freeze({ allowed: false as const, reason: "account-disabled" as const });
  }
  if (authenticationCredentialState(input.account, input.credentialAuthenticatedAt) === "revoked") {
    return Object.freeze({ allowed: false as const, reason: "credential-revoked" as const });
  }
  if (accountState === "email-verification-required") {
    return Object.freeze({
      allowed: false as const,
      reason: "email-verification-required" as const,
    });
  }
  if (input.membershipStatus !== "active") {
    return Object.freeze({ allowed: false as const, reason: "membership-inactive" as const });
  }
  if (input.restrictionState !== "none") {
    return Object.freeze({
      allowed: false as const,
      reason: "organization-access-restricted" as const,
      restrictionState: input.restrictionState,
    });
  }
  return Object.freeze({ allowed: true as const });
}
